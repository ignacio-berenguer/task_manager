# Implementation Plan — feature_034

## Phase 1: Add `_SheetCache` class and `_bulk_read` helper

**File:** `backend/app/services/excel_writer.py`

Add the `_SheetCache` class after the existing module-level `_processing_state` dict (around line 34). The class provides:
- `get(sheet, sheet_name, header_row)` — returns cached data or bulk-reads and caches
- `invalidate(sheet_name)` — removes a sheet entry (called after INSERT/DELETE)
- `_bulk_read(sheet, header_row)` — static method that does `sheet.range((first_data_row, 1), (last_row, last_col)).value`

Handle the xlwings single-row edge case: when `first_data_row == last_row`, xlwings returns a flat list instead of list-of-lists — normalize to `[flat_list]`.

## Phase 2: Rewrite `_find_matching_rows` to use bulk data

**File:** `backend/app/services/excel_writer.py`

Add `sheet_data=None, first_data_row=None` parameters to the function signature. When provided:
- Iterate `sheet_data` (Python list) instead of calling `sheet.range()` per cell
- Use `col_index[pk_field] - 1` for 0-indexed list access
- Compute row number as `first_data_row + i` for each list index `i`
- Preserve all existing type coercion logic exactly (float→int, float→str, str comparison)

When `sheet_data` is `None`, fall back to the original cell-by-cell behavior (defensive — should not happen in normal flow).

## Phase 3: Update `_apply_excel_update` to use cache

**File:** `backend/app/services/excel_writer.py`

Add `sheet_cache: _SheetCache = None` parameter. Changes:
1. Get `sheet_data, first_data_row, last_col` from cache via `sheet_cache.get()`
2. Pass `sheet_data, first_data_row` to `_find_matching_rows`
3. Read previous values from `sheet_data[row - first_data_row]` instead of `sheet.range((row, col)).value`
4. Write operations remain as individual COM calls (unchanged)

No cache invalidation needed — UPDATE doesn't change row positions.

## Phase 4: Update `_apply_excel_insert` to use cache

**File:** `backend/app/services/excel_writer.py`

Add `sheet_cache: _SheetCache = None` parameter. Changes:
1. Get `sheet_data, first_data_row, last_col` from cache
2. PK reconciliation: extract column from `sheet_data` instead of cell-by-cell reads
3. Duplicate check: pass `sheet_data, first_data_row` to `_find_matching_rows`
4. Write operations remain as individual COM calls
5. **After successful insert:** call `sheet_cache.invalidate(sheet_name)` — new row added

## Phase 5: Update `_apply_excel_delete` to use cache

**File:** `backend/app/services/excel_writer.py`

Add `sheet_cache: _SheetCache = None` parameter. Changes:
1. Get `sheet_data, first_data_row, last_col` from cache
2. Pass `sheet_data, first_data_row` to `_find_matching_rows`
3. Read previous values from `sheet_data[row - first_data_row]` instead of cell-by-cell
4. Row deletion via `sheet.range().delete()` remains unchanged
5. **After successful delete:** call `sheet_cache.invalidate(sheet_name)` — row positions changed

## Phase 6: Wire cache through processing pipeline

**File:** `backend/app/services/excel_writer.py`

1. In `process_pending_excel_transactions`: create `sheet_cache = _SheetCache()` inside the `for excel_file, txns in groups.items()` loop (one cache per workbook)
2. Pass `sheet_cache` to `_process_single_transaction`
3. In `_process_single_transaction`: pass `sheet_cache` to all `_apply_excel_*` calls
4. Add `sheet_name` to `mapping_with_meta` for invalidation calls

## Phase 7: Add performance logging

**File:** `backend/app/services/excel_writer.py`

Add `time.time()` timing around the bulk-read in `_SheetCache._bulk_read` and log at DEBUG level:
```
"Bulk-read sheet '%s': %d rows x %d cols in %.3fs"
```

Add `import time` at the top of the file.

## Phase 8: Verification

1. **Backend import check:**
   ```bash
   cd backend && uv run python -c "from app.services.excel_writer import process_pending_excel_transactions"
   ```

2. **Backend startup check:**
   ```bash
   cd backend && uv run python -c "from app.main import app"
   ```

3. **Frontend build check:**
   ```bash
   cd frontend && npm run build
   ```
   (No frontend changes, but confirm nothing broke)

## Phase 9: Documentation

1. Update `specs/architecture/architecture_backend.md` — document the bulk-read optimization and `_SheetCache` in the excel_writer service section
2. Update `README.md` — add feature_034 to the implemented features list
