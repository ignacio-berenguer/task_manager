# Specs — feature_011: Bulk Database Inserts

## Overview

The management migration engine (`management/src/migrate/engine.py`) currently inserts rows one at a time using individual `cursor.execute()` calls. When the PostgreSQL database is hosted on a remote server, each INSERT is a network round-trip, making the migration process very slow. This feature replaces individual inserts with bulk operations using `psycopg2.extras.execute_values()`, which sends multiple rows in a single SQL statement.

## Current Behavior Analysis

### migrate_tareas() (engine.py:202–279)

- Iterates row-by-row over a DataFrame
- For each row, builds a dynamic column list (only non-NULL columns) and executes a single INSERT
- Commits every `BATCH_COMMIT_SIZE` rows
- On error: rolls back the transaction and continues to the next row

**Problem:** Each row = 1 network round-trip. For 500 tareas on a remote server with 20ms latency, that's ~10 seconds of network overhead alone.

### migrate_acciones_from_notas() (engine.py:281–327)

- Fetches all tareas with notas, parses each into acciones
- Inserts each accion individually
- Commits every `BATCH_COMMIT_SIZE` rows
- On error: rolls back and continues

**Problem:** Same issue — individual inserts. Acciones can number in the thousands, amplifying the latency.

### migrate_responsables() (engine.py:329–353)

- Inserts unique responsable values one by one
- Uses `ON CONFLICT DO NOTHING`
- Typically a small dataset (10–50 values)

**Impact:** Low — small dataset, not worth optimizing for bulk.

### Backend CRUD (backend/app/crud.py)

- Uses SQLAlchemy ORM, single-record operations via API endpoints
- No batch/bulk endpoints exist
- Each API call creates one record at a time

**Assessment:** The backend serves interactive use (web UI, MCP server). Users create/update records one at a time. Bulk backend endpoints are out of scope for this feature — the performance problem is specifically in the migration process.

## Technical Design

### Approach: `psycopg2.extras.execute_values()`

**Why `execute_values`:**
- Generates a single `INSERT INTO ... VALUES (row1), (row2), ...` statement
- Dramatically reduces network round-trips (1 call per batch instead of 1 per row)
- Native psycopg2 support — no new dependencies
- Typically 5–10x faster than individual inserts for remote databases
- Simpler than `COPY` (which requires CSV formatting, special NULL handling)

**Why not `executemany`:** In psycopg2, `executemany` still executes individual statements server-side — no performance gain for network latency.

**Why not `COPY`:** Faster for very large datasets but requires data format conversion (CSV/binary), complicates NULL handling, and doesn't support `ON CONFLICT`. Overkill for the dataset sizes in this project (hundreds to low thousands of rows).

### Change 1: Bulk insert for `migrate_tareas()`

**Current:** Dynamic column set per row (skips NULLs).
**New:** Fixed column set for all rows, pass `None` for NULL values.

This is safe because:
- No mapped column has a non-NULL default (all default to NULL)
- `tarea_id`, `fecha_creacion`, `fecha_actualizacion` are NOT in `TAREAS_COLUMN_MAP`, so their DB defaults (SERIAL, NOW()) still apply
- Inserting an explicit NULL is equivalent to omitting the column when the default is NULL

**Implementation:**
```python
from psycopg2.extras import execute_values

# All mapped DB columns (fixed set)
columns = list(TAREAS_COLUMN_MAP.values())
col_names = ", ".join(columns)

# Build tuples for all rows
values_list = []
for _, row in batch.iterrows():
    values_list.append(tuple(row.get(col) for col in columns))

# Single bulk insert
execute_values(
    cursor,
    f"INSERT INTO tareas ({col_names}) VALUES %s",
    values_list,
    page_size=batch_size
)
```

**Error handling:** If a batch fails, fall back to individual inserts for that batch to isolate the problematic row(s). This preserves the current behavior of skipping bad rows while still getting bulk performance for clean data.

### Change 2: Bulk insert for `migrate_acciones_from_notas()`

**Simpler case:** All acciones have the same 4 columns (`tarea_id`, `accion`, `fecha_accion`, `estado`).

**Implementation:**
- Collect all parsed acciones into a list of tuples
- Insert in batches using `execute_values`
- Same fallback-to-individual strategy on error

### Change 3: Keep `migrate_responsables()` as-is

The responsables dataset is tiny (10–50 rows) and uses `ON CONFLICT DO NOTHING`. The performance gain from bulk insert would be negligible. No changes needed.

### Change 4: Performance logging

Add timing and throughput metrics to each migration step:
- Total rows processed
- Time elapsed
- Rows per second
- Number of batches executed
- Bulk vs. fallback insert counts (to detect data quality issues)

This data already partially exists in the current code (`start`/`duration` timing). We'll enhance it with rows/second and batch statistics.

### Change 5: Configuration

The existing `BATCH_COMMIT_SIZE` setting (default: 100) already controls batch boundaries and will be reused for the `execute_values` page size. No new configuration settings needed.

The `page_size` parameter of `execute_values` controls how many rows are sent per SQL statement. Setting it equal to `BATCH_COMMIT_SIZE` means each SQL statement and each commit align.

## Files Modified

| File | Change |
|------|--------|
| `management/src/migrate/engine.py` | Replace individual inserts with `execute_values` in `migrate_tareas()` and `migrate_acciones_from_notas()`. Add enhanced performance logging. |

## Files NOT Modified

| File | Reason |
|------|--------|
| `management/src/config/settings.py` | `BATCH_COMMIT_SIZE` already exists and is sufficient |
| `management/manage.py` | No changes needed — it just calls `engine.migrate_all()` |
| `backend/app/crud.py` | Backend serves interactive use; bulk endpoints out of scope |
| `db/schema.sql` | No schema changes |

## Constraints

- The final database state must be identical to the current individual-insert approach
- Error handling must gracefully handle bad rows without losing the entire batch
- The existing `BATCH_COMMIT_SIZE` configuration is reused (no new env vars)
- No new dependencies (psycopg2.extras is part of psycopg2)
