# Feature 07: Implementation Plan

## Phase 1: Suppress openpyxl Warning (Requirement 4)

**Files:** `main.py`

**Steps:**
1. Add `import warnings` at top of main.py
2. Add `warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')` before any imports that might trigger openpyxl

**Testing:**
```bash
uv run python main.py migrate --db portfolio.db 2>&1 | grep -i "validation"
# Should return nothing
```

---

## Phase 2: Fix Log File Format (Requirement 2)

### Step 2.1: Fix main.py

**File:** `main.py`

**Changes:**
- Line 68: Remove `logger.info("")` (empty log line)
- Lines 69-71, 77: Keep the separator logs but ensure no leading newlines

**Before:**
```python
logger.info("")
logger.info("=" * 60)
logger.info(f"NEW EXECUTION - {datetime.now().strftime(LOG_DATE_FORMAT)}")
logger.info("=" * 60)
```

**After:**
```python
logger.info("=" * 60)
logger.info(f"NEW EXECUTION - {datetime.now().strftime(LOG_DATE_FORMAT)}")
logger.info("=" * 60)
```

### Step 2.2: Fix migrate/engine.py

**File:** `src/migrate/engine.py`

**Changes:** Remove leading `\n` from all log messages at lines:
- 1770: `logger.info("\n### PHASE 1: Master Data ###")` → `logger.info("### PHASE 1: Master Data ###")`
- 1774: `logger.info("\n### PHASE 2: Core Entities ###")` → `logger.info("### PHASE 2: Core Entities ###")`
- 1779: `logger.info("\n### PHASE 3: Financial Data ###")` → `logger.info("### PHASE 3: Financial Data ###")`
- 1784: `logger.info("\n### PHASE 4: Operational Data ###")` → `logger.info("### PHASE 4: Operational Data ###")`
- 1792: `logger.info("\n### PHASE 5: Supporting Data ###")` → `logger.info("### PHASE 5: Supporting Data ###")`
- 1797: `logger.info("\n### PHASE 6: Additional Tables ###")` → `logger.info("### PHASE 6: Additional Tables ###")`
- 1809: `logger.info("\n" + "=" * 60)` → `logger.info("=" * 60)`

**Testing:**
```bash
rm portfolio_migration.log
uv run python main.py migrate --db portfolio.db
grep -v "^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" portfolio_migration.log | head
# Should show no lines (all lines should start with timestamp)
```

---

## Phase 3: Fix Console Output Format (Requirement 3)

### Step 3.1: Fix excel_readers.py

**File:** `src/migrate/excel_readers.py`

**Changes:**
1. Add logger import at top of file:
   ```python
   import logging
   logger = logging.getLogger('portfolio_migration')
   ```

2. Line 529: Convert print to logger
   ```python
   # Before
   print(f"Read {len(df)} benefit records from sheet: {sheet_name}")
   # After
   logger.info(f"Read {len(df)} benefit records from sheet: {sheet_name}")
   ```

3. Line 533: Convert print to logger
   ```python
   # Before
   print(f"Skipping historical snapshot sheet: {sheet_name}")
   # After
   logger.info(f"Skipping historical snapshot sheet: {sheet_name}")
   ```

**Testing:**
```bash
uv run python main.py migrate --db test.db 2>&1
# All output lines should start with INFO:, WARNING:, or ERROR:
```

---

## Phase 4: Add force_overwrite Parameter (Requirement 1 - Preparation)

**File:** `src/init/db_init.py`

**Changes:**
1. Modify function signature:
   ```python
   def create_database(db_path: str = None, force_overwrite: bool = False) -> sqlite3.Connection:
   ```

2. Modify the overwrite logic (around line 34-49):
   ```python
   if db_path_obj.exists():
       if force_overwrite:
           # Silent overwrite
           db_path_obj.unlink()
           logger.info(f"Removed existing database (force_overwrite): {db_path}")
       else:
           # Original behavior: prompt user
           logger.warning(f"Database {db_path} already exists")
           print(f"Warning: Database {db_path} already exists")
           response = input("Do you want to overwrite it? (yes/no): ")
           logger.debug(f"User response to overwrite: {response}")

           if response.lower() != 'yes':
               logger.info("Database initialization aborted by user")
               print("Aborted.")
               return None

           db_path_obj.unlink()
           logger.info(f"Removed existing database: {db_path}")
           print(f"Removed existing database: {db_path}")
   ```

**Testing:**
```bash
# Test normal behavior (should prompt)
uv run python main.py init --db test.db
# Answer "yes" to create
uv run python main.py init --db test.db
# Should prompt again

# Test force_overwrite via Python
uv run python -c "from src.init import create_database; create_database('test.db', force_overwrite=True)"
# Should not prompt
```

---

## Phase 5: Implement full_calculation_datos_relevantes Command (Requirement 1)

**File:** `main.py`

**Changes:**

1. Add new command to choices list (line 49):
   ```python
   choices=['init', 'migrate', 'validate', 'calculate_datos_relevantes',
            'export_datos_relevantes', 'full_calculation_datos_relevantes'],
   ```

2. Update help text and epilog to include the new command.

3. Add command handler after the other elif blocks:
   ```python
   elif args.command == 'full_calculation_datos_relevantes':
       logger.info(f"Starting full calculation pipeline: {args.db}")
       print(f"Running full calculation pipeline for: {args.db}\n")

       # Step 1: Initialize database (force overwrite)
       logger.info("Step 1/4: Initializing database...")
       print("Step 1/4: Initializing database...")
       conn = create_database(args.db, force_overwrite=True)
       if conn:
           conn.close()
           logger.info("Database initialized successfully")
       else:
           logger.error("Database initialization failed")
           print("Error: Database initialization failed")
           sys.exit(1)

       # Step 2: Migrate data
       logger.info("Step 2/4: Migrating data from Excel...")
       print("Step 2/4: Migrating data from Excel...")
       results = migrate_all(args.db, args.excel_dir)
       logger.info(f"Migration completed: {results}")

       # Step 3: Calculate datos_relevantes
       logger.info("Step 3/4: Calculating datos_relevantes...")
       print("Step 3/4: Calculating datos_relevantes...")
       from src.calculate import main as calculate_main
       calc_result = calculate_main(args.db)
       if calc_result['validation']['total_mismatches'] > 0:
           logger.warning(f"Calculation validation found {calc_result['validation']['total_mismatches']} mismatches")

       # Step 4: Export to Excel
       logger.info("Step 4/4: Exporting to Excel...")
       print("Step 4/4: Exporting to Excel...")
       from src.export import export_datos_relevantes
       export_result = export_datos_relevantes(args.db)

       # Summary
       logger.info("Full calculation pipeline completed successfully")
       print(f"\n{'='*60}")
       print("Full calculation pipeline completed!")
       print(f"  Database: {args.db}")
       print(f"  Rows calculated: {calc_result['rows_calculated']}")
       print(f"  Rows exported: {export_result['rows_exported']}")
       print(f"  Output file: {export_result['output_file']}")
       print(f"{'='*60}")
   ```

**Testing:**
```bash
# Test full pipeline
uv run python main.py full_calculation_datos_relevantes --db test_full.db

# Verify database was created
ls -la test_full.db

# Verify export was created
ls -la excel_output/

# Run again to verify overwrite works
uv run python main.py full_calculation_datos_relevantes --db test_full.db
# Should not prompt, should complete successfully
```

---

## Phase 6: Update Documentation

### Step 6.1: Update CLAUDE.md

Add documentation for new command in the "Running the Application" section.

### Step 6.2: Update specs/architecture.md

Add the new command to the architecture documentation.

---

## Implementation Order

1. Phase 1: Suppress openpyxl warning (quick fix)
2. Phase 2: Fix log file format (independent of other changes)
3. Phase 3: Fix console output format (independent)
4. Phase 4: Add force_overwrite parameter (required for Phase 5)
5. Phase 5: Implement new command (depends on Phase 4)
6. Phase 6: Update documentation (after all code changes)

## Estimated Code Changes

| File | Lines Added | Lines Modified | Lines Removed |
|------|-------------|----------------|---------------|
| main.py | ~50 | ~5 | 1 |
| src/init/db_init.py | ~10 | ~5 | 0 |
| src/migrate/engine.py | 0 | 7 | 0 |
| src/migrate/excel_readers.py | 3 | 2 | 0 |
| CLAUDE.md | ~10 | 0 | 0 |
| specs/architecture.md | ~5 | 0 | 0 |
