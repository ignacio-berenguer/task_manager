# Plan — feature_011: Bulk Database Inserts

## Phase 1: Refactor `migrate_tareas()` to use bulk insert

**File:** `management/src/migrate/engine.py`

### Steps:

1. Add `from psycopg2.extras import execute_values` import at the top of the file

2. Refactor the insert loop in `migrate_tareas()`:
   - Define a fixed column list from `TAREAS_COLUMN_MAP.values()` (all mapped columns)
   - After DataFrame normalization, replace NaN with None across all columns (already done)
   - Build a list of tuples for each batch (all columns, using None for NULLs)
   - Use `execute_values(cursor, INSERT_SQL, values_list, page_size=batch_size)` for the batch
   - On success: commit and increment counters
   - On error (any exception from `execute_values`): rollback, then fall back to row-by-row inserts for that batch to isolate bad rows. Log a warning that fallback was triggered.

3. Enhance performance logging:
   - Log batch progress: `"Batch {n}: inserted {count} tareas (bulk)"`
   - At end: log total rows, elapsed time, rows/second, bulk vs. fallback counts

## Phase 2: Refactor `migrate_acciones_from_notas()` to use bulk insert

**File:** `management/src/migrate/engine.py`

### Steps:

1. After parsing all acciones from notas, collect them into a flat list of tuples: `(tarea_id, accion, fecha_accion, estado)`

2. Insert in batches using `execute_values`:
   - Fixed column set: `tarea_id, accion, fecha_accion, estado`
   - Chunk the list into `BATCH_COMMIT_SIZE` batches
   - Use `execute_values` per batch, commit after each
   - On error: rollback, fall back to individual inserts for that batch

3. Enhance performance logging (same pattern as Phase 1)

## Phase 3: Update documentation

1. Update `README.md` — note bulk insert capability in the Management module section
2. Update `specs/architecture/architecture_backend.md` if it references the migration engine

## Summary of Changes

| File | Lines Changed (approx.) | Description |
|------|------------------------|-------------|
| `management/src/migrate/engine.py` | ~80 lines modified | Bulk inserts for tareas and acciones, enhanced logging |
| `README.md` | ~5 lines | Document bulk insert capability |
| Architecture docs | ~5 lines (if applicable) | Note migration performance improvement |

## Risk Assessment

- **Low risk:** `execute_values` is a well-established psycopg2 API, no new dependencies
- **Fallback strategy:** Row-by-row fallback on batch error ensures no data loss compared to current behavior
- **Same final state:** All columns map identically; explicit NULLs are equivalent to omitting columns when DB defaults are NULL
- **Testable:** Run `complete_process` and compare the resulting database state with the previous approach
