# Feature 07: Full Calculation Command and Logging Improvements

## Overview

This feature adds a new command `full_calculation_datos_relevantes` that executes the complete pipeline (init → migrate → calculate → export) in a single command, and improves logging consistency throughout the application.

## Requirements

### Requirement 1: New Command `full_calculation_datos_relevantes`

**Purpose:** Execute the full pipeline without user intervention, suitable for automated/scheduled runs.

**Command:** `uv run python main.py full_calculation_datos_relevantes`

**Behavior:**

1. Initialize database (overwrite existing if present - no user confirmation)
2. Migrate all data from Excel to SQLite
3. Calculate datos_relevantes table
4. Export datos_relevantes to Excel

**Arguments:**

- `--db`: Custom database path (default: portfolio.db)
- `--excel-dir`: Custom Excel source directory (default: excel_source/)

**Exit codes:**

- 0: Success
- 1: Error at any step

**Implementation approach:**

Orchestrate existing commands from main.py

**Changes required:**

1. **`main.py`:**
   - Add `full_calculation_datos_relevantes` to the choices list
   - Add command handler that calls the four operations in sequence
   - Handle errors at each step (abort on failure)

2. **`src/init/db_init.py`:**
   - Add optional parameter `force_overwrite: bool = False`
   - When `force_overwrite=True`, skip the user confirmation prompt
   - Delete existing database silently if it exists

---

### Requirement 2: Log File Format Consistency

**Current issue:** Some log entries don't follow the standard format:

```
YYYY-MM-DD HH:MM:SS - <module_name> - <LOG_LEVEL> - <message>
```

**Problematic patterns found:**

1. **Empty line before separators** (main.py:68):

   ```python
   logger.info("")  # Empty message creates malformed log line
   ```

2. **Newline inside message** (migrate/engine.py:1770, 1774, etc.):
   ```python
   logger.info("\n### PHASE 1: Master Data ###")  # Newline inside message
   ```
   This produces:
   ```
   2026-01-31 14:06:42 - portfolio_migration - INFO -
   ### PHASE 1: Master Data ###
   ```

**Solution:**

- Remove empty `logger.info("")` calls
- Remove leading `\n` from log messages (use separate log calls if blank line is needed)
- Replace decorative separator logs with proper context messages

**Files to modify:**

- `main.py`: Remove `logger.info("")` at line 68
- `src/migrate/engine.py`: Fix all `logger.info("\n###...)` patterns (lines 1770, 1774, 1779, 1784, 1792, 1797, 1809)

---

### Requirement 3: Console Output Format Consistency

**Current issue:** Some console output doesn't follow the format `<LOG_LEVEL>: <message>`:

1. **Direct print statements** that should use logger:
   - `print(f"Read {len(df)} benefit records from sheet: {sheet_name}")` in excel_readers.py:529
   - `print(f"Skipping historical snapshot sheet: {sheet_name}")` in excel_readers.py:533

2. **Decorative print statements** in main.py that bypass logging:
   - `print(f"\n{'=' * 60}")`
   - `print(f"✓ Migration completed successfully!")`

**Solution:**
All user-facing output should go through the logging system so it gets the proper format. Replace `print()` calls with `logger.info()` or `logger.warning()` as appropriate.

**Files to modify:**

- `src/migrate/excel_readers.py`: Lines 529, 533 - convert to logger calls
- `main.py`: Convert remaining print statements to logger calls, or keep them as intentional non-logged output (user banner)

**Note:** Some print statements in main.py are intentional user interface elements (like the program banner). These can remain as-is since they are not log messages.

---

### Requirement 4: Suppress openpyxl Data Validation Warning

**Current issue:** openpyxl displays a warning when reading Excel files:

```
/home/nacho/dev/portfolio_migration/.venv/lib/python3.12/site-packages/openpyxl/worksheet/_reader.py:329: UserWarning: Data Validation extension is not supported and will be removed
```

**Solution:** Add a warnings filter to suppress this specific warning at application startup.

**Implementation:**
Add to `main.py` or `src/core/logging_config.py`:

```python
import warnings
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
```

**Alternative location:** `src/migrate/excel_readers.py` since that's where openpyxl is used.

**Recommended:** Add to `main.py` at the top, before any openpyxl imports occur.

---

## Summary of Changes

| File                           | Changes                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `main.py`                      | Add new command, fix logging format, add warnings filter |
| `src/init/db_init.py`          | Add `force_overwrite` parameter                          |
| `src/migrate/engine.py`        | Fix `\n` in log messages                                 |
| `src/migrate/excel_readers.py` | Convert print to logger                                  |
| `CLAUDE.md`                    | Document new command                                     |
| `specs/architecture.md`        | Update architecture documentation                        |

## Testing

After implementation:

```bash
# Test full calculation (deletes and recreates database)
uv run python main.py full_calculation_datos_relevantes --db test_full.db

# Verify log file format
grep -v "^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" portfolio_migration.log
# Should return no lines (all lines should start with timestamp)

# Verify no openpyxl warnings appear on console
uv run python main.py migrate --db test.db 2>&1 | grep -i "validation"
# Should return nothing

# Verify existing commands still work
uv run python main.py init --db test.db
uv run python main.py migrate --db test.db
uv run python main.py validate --db test.db
uv run python main.py calculate_datos_relevantes --db test.db
uv run python main.py export_datos_relevantes --db test.db
```

## Constraints

- Existing command behavior must be preserved
- Individual commands (init, migrate, calculate, export) must work independently
- No changes to database schema or calculations
- The `init` command should still prompt for confirmation when run standalone
