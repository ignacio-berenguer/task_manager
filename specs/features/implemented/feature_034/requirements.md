# Requirements Prompt for feature_034

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a 'C:\Users\ignac\dev\portfolio_migration\specs\features\feature_034\specs.md' and 'C:\Users\ignac\dev\portfolio_migration\specs\features\feature_034\plan.md' in order to do that.

## Feature Brief

Optimize `_find_matching_rows` in `excel_writer.py` by replacing cell-by-cell xlwings COM calls with bulk-read via `sheet.range().values`, adding per-sheet data caching across transactions, and optimizing all related cell reads (PK reconciliation, delete/update previous values).

## User Story

As a user processing Excel write-back transactions, I want the system to complete the write-back significantly faster so that I don't have to wait excessively when processing batches of transactions, especially for entities with many rows (e.g., etiquetas with ~7,278 rows).

## Key Requirements

### Requirement 1: Bulk-read sheet data instead of cell-by-cell COM calls

Currently `_find_matching_rows` iterates row-by-row and calls `sheet.range((row, col)).value` for each PK field, resulting in `rows × pk_fields` COM interop calls per scan. Replace this with a single `sheet.range((first_data_row, 1), (last_row, last_col)).values` bulk-read that fetches all data into a Python list-of-lists in one COM call, then perform row matching in pure Python.

**Impact**: For 10 etiquetas transactions (7,278 rows × 2 PK fields), reduces ~145,560 COM calls to 1.

### Requirement 2: Cache sheet data across transactions on the same sheet

When multiple transactions target the same entity/sheet within a single workbook processing batch, the sheet data should be read once and reused. Invalidate the cache after INSERT or DELETE operations (which change row count/positions), but keep it for UPDATE-only sequences.

### Requirement 3: Optimize PK reconciliation in `_apply_excel_insert`

The hechos PK reconciliation (lines 192–199) scans cell-by-cell for the max ID. Replace with a column slice from the cached bulk data.

### Requirement 4: Optimize previous-value reads in `_apply_excel_update` and `_apply_excel_delete`

Both functions read old cell values one-by-one. Use the cached bulk data to read previous values instead of individual COM calls.

### Requirement 5: Preserve existing behavior and type coercion

All existing type coercion logic (float/int/string comparisons), error handling, and write operations must remain unchanged. Only reads are optimized. Write operations (setting cell values) still use individual COM calls since they are few per transaction and must be done individually.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Only `backend/app/services/excel_writer.py` should be modified (plus docs).
- No new dependencies required — uses existing xlwings API.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
