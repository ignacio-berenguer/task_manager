# Feature 04: Configuration File and Excel Copy Script

## Implementation Plan

**Status:** Completed

---

## Overview

Add a configuration system using `.env` file and create a bash script to copy Excel source files from Windows OneDrive to the WSL project.

---

## Implementation Steps

### Step 1: Add python-dotenv dependency

**File:** `pyproject.toml`

```toml
dependencies = [
    "pandas>=3.0.0",
    "openpyxl>=3.1.0",
    "python-dotenv>=1.0.0",
]
```

**Command:** `uv sync`

**Status:** ✅ Completed

---

### Step 2: Create `.env.example`

**File:** `.env.example` (new file, committed to git)

Template configuration file with all variables and their default values.

**Status:** ✅ Completed

---

### Step 3: Create `config.py`

**File:** `config.py` (new file)

Configuration module that:
- Loads `.env` file using `python-dotenv`
- Exports typed configuration variables
- Converts LOG_LEVEL string to logging constant
- Provides sensible defaults

**Status:** ✅ Completed

---

### Step 4: Create `copy_excel_sources.sh`

**File:** `copy_excel_sources.sh` (new file)

Bash script that:
- Reads WINDOWS_EXCEL_PATH from `.env`
- Copies 4 Excel files to local directory
- Color-coded success/error output
- Made executable with `chmod +x`

**Status:** ✅ Completed

---

### Step 5: Update `main.py`

**Changes:**
- Import `config` module
- Use `config.LOG_LEVEL` and `config.LOG_FILE` instead of hardcoded values
- Update argparse defaults to use `config.DATABASE_PATH` and `config.EXCEL_SOURCE_DIR`

**Status:** ✅ Completed

---

### Step 6: Update `excel_readers.py`

**Changes:**
- Import `config` module
- Change all `__init__` methods to use `excel_dir: str = None` with fallback to `config.EXCEL_SOURCE_DIR`
- Update `get_all_readers()` function signature

**Status:** ✅ Completed

---

### Step 7: Update `migrate.py`

**Changes:**
- Import `config` module
- Update `MigrationEngine.__init__` to use `config.EXCEL_SOURCE_DIR` as default
- Update `migrate_all()` function signature

**Status:** ✅ Completed

---

### Step 8: Update remaining modules

**Files:** `validate.py`, `calculate.py`, `init_db.py`

**Changes:**
- Import `config` module
- Update default database path to use `config.DATABASE_PATH`

**Status:** ✅ Completed

---

### Step 9: Create local `.env` and verify

**Commands:**
```bash
# Install dependencies
uv sync

# Create local config
cp .env.example .env

# Test config loading
uv run python -c "import config; print(f'Excel dir: {config.EXCEL_SOURCE_DIR}')"

# Test copy script
./copy_excel_sources.sh

# Test all imports
uv run python -c "import config; import main; import migrate; print('OK')"
```

**Status:** ✅ Completed

---

## Files Created

| File | Description |
|------|-------------|
| `config.py` | Configuration module |
| `.env.example` | Template (committed) |
| `.env` | Local config (gitignored) |
| `copy_excel_sources.sh` | Excel copy script |

---

## Files Modified

| File | Changes |
|------|---------|
| `pyproject.toml` | Added python-dotenv dependency |
| `main.py` | Import config, use config values |
| `excel_readers.py` | Use config.EXCEL_SOURCE_DIR |
| `migrate.py` | Use config.EXCEL_SOURCE_DIR |
| `validate.py` | Use config.DATABASE_PATH |
| `calculate.py` | Use config.DATABASE_PATH |
| `init_db.py` | Use config.DATABASE_PATH |

---

## Verification Results

```
✅ uv sync - Installed python-dotenv==1.2.1
✅ Config loading with defaults (no .env)
✅ Config loading with .env file
✅ Environment variable override (LOG_LEVEL=DEBUG)
✅ All modules import successfully
✅ copy_excel_sources.sh syntax valid
✅ copy_excel_sources.sh executes correctly
```

---

## Notes

- Backward compatible: defaults unchanged if .env missing
- CLI flags (`--db`, `--excel-dir`) continue to override config
- `.gitignore` already includes `.env` files
