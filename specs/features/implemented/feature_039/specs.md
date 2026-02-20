# Specs — feature_039: Excel Write-Back Resilience & Debug Logging

## Overview

The Excel write-back process (`backend/app/services/excel_writer.py`) currently fails when a target Excel file is already open on the same machine. This happens because `xw.App(visible=False)` creates a **new** hidden Excel instance and then tries to open a file that is already locked by another Excel instance, causing a COM error.

The fix leverages xlwings' ability to enumerate running Excel instances (`xw.apps`) and their open workbooks to detect and reuse already-open files instead of fighting them.

## Current Behavior

In `process_pending_excel_transactions()`:

1. Creates a new hidden Excel COM instance: `xw.App(visible=False)`
2. For each workbook file, calls `excel_app.books.open(file_path)` — **fails if file is already open**
3. After processing, calls `wb.close()` then `excel_app.quit()`

## Target Behavior

### Workbook Opening Strategy

For each Excel file to process:

1. **Check all running Excel instances** via `xw.apps` for an already-open copy of the file
2. **If found**: use the existing workbook reference; mark it as "pre-opened"
3. **If not found**: open it via a dedicated `xw.App` instance (current behavior, but only created once if needed)

### Workbook Closing Strategy

- **Pre-opened workbooks**: call `wb.save()` but do **NOT** call `wb.close()` — leave it open for the user
- **Newly-opened workbooks**: call `wb.save()` then `wb.close()` (current behavior)
- **Excel app instance**: only call `excel_app.quit()` on the app we created ourselves, never on an existing user instance

### Matching Logic

To determine if a file is "the same" workbook:

- Compare the **resolved absolute path** of the target file against each open workbook's `wb.fullname`
- Use `Path.resolve()` on both sides to normalize casing and relative paths (Windows is case-insensitive)
- Match using `os.path.normcase()` for reliable Windows path comparison

## Technical Design

### Modified Function: `_find_open_workbook(file_path: Path)`

New helper function:

```python
def _find_open_workbook(file_path: Path) -> tuple[xw.Book | None, bool]:
    """Check if file_path is already open in any running Excel instance.

    Returns:
        (workbook, was_pre_opened):
        - (wb, True) if the workbook was found in an existing Excel instance
        - (None, False) if not found
    """
```

Iterates `xw.apps`, then each `app.books`, comparing `Path(wb.fullname).resolve()` against `file_path.resolve()`.

### Modified Function: `process_pending_excel_transactions()`

Changes:

1. **Before creating `xw.App`**: for each file group, try `_find_open_workbook()` first
2. **Lazy `xw.App` creation**: only create `xw.App(visible=False)` if at least one file is not already open
3. **Track ownership**: use a dict `{file_path: (wb, was_pre_opened)}` to remember what to close
4. **Cleanup**: only close workbooks we opened; only quit the app we created

### Enhanced Debug Logging

Add `logger.debug()` calls at these points:

| Location | Log Message |
|----------|-------------|
| Start of process | Total pending transactions count, grouped by file |
| File detection | Whether file was found pre-opened or needs opening, which Excel instance |
| xw.App creation | Only if needed (no pre-opened workbooks covered all files) |
| Workbook open | File path, time taken to open |
| Sheet access | Sheet name being accessed for each transaction |
| Column index build | Column mappings resolved (count of columns) |
| Row matching | PK values being searched, number of matches found |
| Cell updates | Individual cell writes (already exists for UPDATE/INSERT) |
| Sheet cache | Cache hits/misses, invalidations |
| Workbook save | File path, time taken to save |
| Workbook close/skip | Whether closed or left open (pre-opened) |
| Process summary | Per-file stats (transactions, time) |
| Overall timing | Total elapsed time for entire process |

Existing `logger.info()` calls remain unchanged. New debug messages use `logger.debug()` only.

## Files Modified

| File | Change |
|------|--------|
| `backend/app/services/excel_writer.py` | Add `_find_open_workbook()`, modify `process_pending_excel_transactions()` for pre-opened detection, add debug logging throughout |

## No Configuration Changes

No new `.env` variables needed. The existing `LOG_LEVEL` setting already controls whether DEBUG messages appear (currently set to `DEBUG` in the backend `.env`).

## Constraints

- All changes confined to `excel_writer.py` — no API or frontend changes
- Existing behavior for files that are NOT open remains identical
- No changes to `excel_mapping.py`, router, or any other file
- COM error handling must be robust — if enumerating `xw.apps` fails (e.g., no Excel running), fall back gracefully to current behavior
