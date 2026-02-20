# Plan — feature_039: Excel Write-Back Resilience & Debug Logging

## Single File Change

All modifications are in `backend/app/services/excel_writer.py`.

## Phase 1: Add `_find_open_workbook()` Helper

Add a new function after the existing helper functions (after `_apply_excel_delete`):

```python
def _find_open_workbook(file_path: Path) -> tuple:
    """Check running Excel instances for an already-open workbook matching file_path.

    Returns (workbook, True) if found, (None, False) if not.
    """
```

Implementation:
- Iterate `xw.apps` (all running Excel instances)
- For each app, iterate `app.books`
- Compare `os.path.normcase(Path(wb.fullname).resolve())` with `os.path.normcase(file_path.resolve())`
- Wrap entire function in try/except to gracefully handle COM errors (return `(None, False)` on failure)
- Add `logger.debug()` messages for: number of running instances checked, match found/not found

## Phase 2: Modify `process_pending_excel_transactions()`

Restructure the main processing loop:

### 2a. Add overall timing
- Record `t_start = time.time()` at the beginning
- Log total elapsed time at the end

### 2b. Add per-group debug logging
- After grouping transactions by file, log: number of files, transactions per file

### 2c. Change workbook opening logic

**Current** (lines 499-511):
```python
excel_app = xw.App(visible=False)
# ...
for excel_file, txns in groups.items():
    wb = excel_app.books.open(str(file_path))
```

**New**:
```python
excel_app = None  # Only created if needed

for excel_file, txns in groups.items():
    file_path = source_dir / excel_file
    wb, was_pre_opened = _find_open_workbook(file_path)

    if wb:
        logger.info("Workbook already open, reusing: %s", file_path)
    else:
        if excel_app is None:
            excel_app = xw.App(visible=False)
            logger.debug("Created new xlwings App instance (pid=%s)", excel_app.pid)
        logger.debug("Opening workbook: %s", file_path)
        t_open = time.time()
        wb = excel_app.books.open(str(file_path))
        logger.debug("Opened workbook in %.3fs: %s", time.time() - t_open, file_path)
```

### 2d. Change workbook closing logic

**Current** (lines 538-543):
```python
finally:
    if wb:
        wb.close()
```

**New**:
```python
finally:
    if wb and not was_pre_opened:
        wb.close()
        logger.debug("Closed workbook: %s", file_path)
    elif wb and was_pre_opened:
        logger.debug("Left workbook open (pre-opened): %s", file_path)
```

### 2e. Change app cleanup logic

**Current** (lines 562-568):
```python
finally:
    if excel_app:
        excel_app.quit()
```

**New**:
```python
finally:
    if excel_app:
        try:
            excel_app.quit()
            logger.debug("Quit xlwings App instance")
        except Exception:
            pass
```

No change needed here structurally — `excel_app` is only set if we created it.

## Phase 3: Add Debug Logging to Existing Functions

### 3a. `_build_column_index()`
- Log: sheet name, number of headers found, number of mapped columns

### 3b. `_find_matching_rows()`
- Log: PK being searched, number of rows scanned, number of matches found

### 3c. `_process_single_transaction()`
- Log: sheet name being accessed
- Log: elapsed time per transaction

### 3d. Workbook save
- Log: time taken to save each workbook

## Phase 4: Post-Implementation Checklist

1. Update `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 39
2. Update `frontend/src/lib/changelog.js` — add entry at TOP of `CHANGELOG` array
3. Update `README.md` with any relevant changes
4. Update `specs/architecture/architecture_backend.md`
5. Use `/close_feature feature_039` to move to implemented and commit

## Verification

Since this is a COM/Excel feature, it must be tested manually:
1. **File closed**: Run process-excel with the target .xlsm file closed — should behave identically to before
2. **File open**: Open the .xlsm file in Excel, run process-excel — should succeed, file should remain open with changes saved
3. **No Excel running**: Ensure no Excel process exists, run process-excel — should create new instance and work normally
4. **Check logs**: Verify DEBUG messages appear in log file showing detection and decision logic
