# feature_034 — Optimize Excel Write-Back Bulk Reads

## Overview

Replace cell-by-cell xlwings COM calls in `excel_writer.py` with bulk-read operations and a per-sheet data cache. This eliminates the dominant bottleneck in Excel write-back processing: the O(rows x pk_fields) COM interop calls per row-matching scan.

## Problem Analysis

### Current Bottleneck

The `_find_matching_rows` function (lines 89–120) iterates every data row and calls `sheet.range((row, col)).value` for each PK field. Each call is a COM interop round-trip (~0.5–2ms). For entities with many rows this becomes extremely slow:

| Entity | Rows | PK Fields | COM Calls/Scan | x10 txns |
|--------|------|-----------|----------------|----------|
| etiquetas | 7,278 | 2 | 14,556 | 145,560 |
| hechos | 3,530 | 1 | 3,530 | 35,300 |
| beneficios | 26,568 | 2 | 53,136 | 531,360 |
| notas | various | 3 | rows×3 | rows×30 |

Additional cell-by-cell reads in:
- `_apply_excel_insert` lines 192–199: PK reconciliation scans column for max ID
- `_apply_excel_update` line 147: reads old values one cell at a time
- `_apply_excel_delete` lines 295–296: reads all previous values one cell at a time

### Target

Replace all read COM calls with a single `sheet.range((r1, c1), (r2, c2)).value` bulk-read per sheet, yielding a Python list-of-lists. All matching/lookups then happen in pure Python with no COM overhead.

## Technical Design

### 1. Sheet Data Cache (`_SheetCache`)

A lightweight dictionary-based cache scoped to a single workbook processing batch. Stores bulk-read data keyed by `sheet_name`.

```python
class _SheetCache:
    """Caches bulk-read sheet data to avoid redundant COM calls."""

    def __init__(self):
        self._data = {}  # {sheet_name: (rows_data, first_data_row, last_col)}

    def get(self, sheet, sheet_name: str, header_row: int):
        """Return cached (rows_data, first_data_row, last_col) or bulk-read and cache."""
        if sheet_name not in self._data:
            self._data[sheet_name] = self._bulk_read(sheet, header_row)
        return self._data[sheet_name]

    def invalidate(self, sheet_name: str):
        """Remove cached data (call after INSERT or DELETE)."""
        self._data.pop(sheet_name, None)

    @staticmethod
    def _bulk_read(sheet, header_row: int):
        """Read all data rows in one COM call."""
        last_row = sheet.used_range.last_cell.row
        last_col = sheet.used_range.last_cell.column
        first_data_row = header_row + 1

        if first_data_row > last_row:
            return [], first_data_row, last_col

        data = sheet.range((first_data_row, 1), (last_row, last_col)).value
        # Single row: xlwings returns a flat list; normalize to list-of-lists
        if first_data_row == last_row:
            data = [data] if isinstance(data, list) else [[data]]

        return data, first_data_row, last_col
```

**Lifecycle:**
- Created once per workbook in the `for excel_file, txns in groups.items()` loop
- Passed through `_process_single_transaction` to all helper functions
- Invalidated for a sheet after INSERT or DELETE (row positions change)
- Discarded when the workbook is closed

### 2. Rewritten `_find_matching_rows`

New signature adds optional `sheet_data`, `first_data_row` parameters:

```python
def _find_matching_rows(
    sheet, header_row: int, col_index: dict,
    pk_fields: list, pk_data: dict,
    sheet_data: list = None, first_data_row: int = None
) -> list:
```

When `sheet_data` is provided, row matching uses list indexing instead of COM calls. The existing type coercion logic (float→int, float→str) is preserved exactly.

### 3. Optimized `_apply_excel_update`

Previous values are read from `sheet_data` (list indexing) instead of per-cell COM calls. Write operations still use individual `sheet.range((row, col)).value = new_value` calls (unavoidable — must write to COM).

### 4. Optimized `_apply_excel_delete`

Previous values are read from `sheet_data` before the row is deleted. The actual `sheet.range(f"{row}:{row}").delete()` call remains unchanged.

### 5. Optimized `_apply_excel_insert` PK Reconciliation

The hechos max-ID scan reads from `sheet_data` instead of cell-by-cell COM calls:

```python
pk_col_idx = col_index[pk_field] - 1  # 0-indexed for list access
excel_ids = []
for row_data in sheet_data:
    val = row_data[pk_col_idx] if pk_col_idx < len(row_data) else None
    if val is not None:
        try:
            excel_ids.append(int(float(val)))
        except (ValueError, TypeError):
            pass
```

### 6. Cache Invalidation Rules

| Operation | Invalidate? | Reason |
|-----------|-------------|--------|
| UPDATE | No | Row count and positions unchanged |
| INSERT | Yes | New row appended, data array outdated |
| DELETE | Yes | Row removed, all subsequent row indices shift |

### 7. Function Signature Changes

| Function | Added Parameters |
|----------|-----------------|
| `_find_matching_rows` | `sheet_data=None, first_data_row=None` |
| `_apply_excel_update` | `sheet_cache=None` |
| `_apply_excel_insert` | `sheet_cache=None` |
| `_apply_excel_delete` | `sheet_cache=None` |
| `_process_single_transaction` | `sheet_cache: _SheetCache` |

All new parameters are optional with `None` defaults to maintain backward compatibility if any function were called externally (though they are all private).

### 8. COM Call Reduction Summary

| Scenario | Before | After |
|----------|--------|-------|
| 10 etiquetas UPDATE txns | 145,560 reads + 10 writes | 1 bulk read + 10 writes |
| 10 hechos INSERT txns | 35,300 reads + row scans + reconciliation | 1 bulk read + 10 writes |
| Mixed batch (same sheet) | N × (rows × pk_fields) | 1 bulk read (reused) + writes |
| Mixed batch (different sheets) | N × (rows × pk_fields) | 1 bulk read per sheet + writes |

## Files Modified

| File | Change |
|------|--------|
| `backend/app/services/excel_writer.py` | All optimizations (single file) |
| `specs/architecture/architecture_backend.md` | Document bulk-read optimization |
| `README.md` | Add feature_034 to implemented features |

## No New Dependencies

Uses only existing xlwings `.range().value` API (already used in `_build_column_index`). No new packages or configuration needed.
