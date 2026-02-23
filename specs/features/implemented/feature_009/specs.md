# feature_009 — Technical Specification

## Feature Summary

Map the "Tema" column from the source Excel workbook to the existing `tema` field in the `tareas` table during migration.

## Current State Analysis

The codebase **already has** the core infrastructure for this feature:

| Component | Status | Detail |
|-----------|--------|--------|
| DB schema (`db/schema.sql`) | Ready | `tema TEXT` column exists on `tareas` (line 44), index `idx_tareas_tema` exists (line 52) |
| Column mapping (`engine.py`) | Ready | `"tema": "tema"` entry exists in `TAREAS_COLUMN_MAP` (line 24) |
| Column normalization | **Missing** | No `normalize_multiline_text` or whitespace stripping applied to `tema` |
| Empty-string → NULL | **Missing** | Generic `pd.notna()` handles NaN but not empty strings `""` |

The migration pipeline reads the Excel, normalizes column names to lowercase, and maps them using `TAREAS_COLUMN_MAP`. The mapping entry for `tema` is already present, so the column is already imported. What is missing is the normalization step that other text fields have.

## Gap Analysis

### Normalization gap

In `migrate_tareas()`, the following text fields receive `normalize_multiline_text`:
- `descripcion` (line 234)
- `tarea` (line 238)
- `notas_anteriores` (line 242)

The `tema` field is **not** normalized. `normalize_multiline_text` strips whitespace, normalizes line endings, and returns `None` for empty strings — which satisfies the requirement that empty values become NULL.

The `responsable` and `estado` fields are also not normalized, but their values come from controlled sources (dropdown lists in Excel), so this is acceptable. `tema` may contain free-form text with leading/trailing whitespace, so normalization is warranted.

### Empty value requirement

The requirement states: "If the 'Tema' column is missing or a row has an empty value, the `tema` field should be set to `NULL`."

- **Column missing**: Already handled — `migrate_tareas()` logs a warning and skips the column (lines 220-221).
- **NaN values**: Already handled — `mapped_df.where(pd.notna(mapped_df), None)` converts NaN → None (line 247).
- **Empty strings**: **Not handled** — an empty string `""` passes through as-is. Adding `normalize_multiline_text` to `tema` will convert empty/whitespace-only strings to `None`.

## Technical Design

### Change 1: Add `tema` normalization in `migrate_tareas()`

**File:** `management/src/migrate/engine.py`

Add a normalization block for `tema` alongside the existing text field normalizations:

```python
if "tema" in mapped_df.columns:
    mapped_df["tema"] = mapped_df["tema"].apply(
        lambda v: normalize_multiline_text(v) if pd.notna(v) else None
    )
```

This uses the same `normalize_multiline_text` function already applied to other text fields. For a short text field like `tema`, this function:
- Strips leading/trailing whitespace
- Normalizes line endings (defensive — `tema` should be single-line)
- Returns `None` for empty/whitespace-only strings

### Change 2: Fix NULL check in batch insert loop

**File:** `management/src/migrate/engine.py`

The batch insert loop used `row[c] is not None` to skip NULL columns, but this fails for `NaN` values (which are not `None` but should be treated as NULL). Changed to `pd.notna(row[c])` for consistency with the rest of the pipeline.

```python
# Before:
cols = [c for c in row.index if row[c] is not None]
# After:
cols = [c for c in row.index if pd.notna(row[c])]
```

### No other code changes needed

- **Backend (FastAPI)**: Already supports `tema` in models, schemas, search, and CRUD — no changes needed.
- **Frontend (React)**: Already displays `tema` in search filters and detail views — no changes needed.
- **MCP Server**: Already exposes `tema` through tools — no changes needed.
- **Database schema**: `tema TEXT` column and index already exist — no changes needed.
- **Configuration**: No new `.env` variables required.

## Impact Assessment

- **Scope**: Single file change (`management/src/migrate/engine.py`), ~5 lines modified
- **Risk**: Minimal — adds normalization consistent with existing patterns
- **Backwards compatibility**: No breaking changes; existing data with `tema` values is unaffected (normalization only runs during migration)
