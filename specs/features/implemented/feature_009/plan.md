# feature_009 — Implementation Plan

## Overview

This is a minimal feature. The core mapping already exists; only a normalization step is missing. The implementation consists of a single code change plus documentation updates.

## Phase 1: Code Change

### Step 1.1 — Add `tema` normalization in `migrate_tareas()`

**File:** `management/src/migrate/engine.py`

Add the following block after the existing `notas_anteriores` normalization (after line 244):

```python
if "tema" in mapped_df.columns:
    mapped_df["tema"] = mapped_df["tema"].apply(
        lambda v: normalize_multiline_text(v) if pd.notna(v) else None
    )
```

**Placement:** Between the `notas_anteriores` normalization block and the `# Replace NaN with None` comment (currently line 247).

**Verification:** Run the import check to confirm no syntax errors:
```bash
cd management
uv run python -c "from src.migrate.engine import TareasMigrationEngine; print('OK')"
```

## Phase 2: Documentation Updates

### Step 2.1 — Update `README.md`

No structural changes to README needed — the `tema` field is already documented in the schema section. Add a note under the management module section that the migration pipeline imports the `Tema` column from Excel if present.

### Step 2.2 — Update architecture docs

Review `specs/architecture/architecture_backend.md` — no backend changes were made, so no update needed.

Review `specs/architecture/architecture_frontend.md` — no frontend changes were made, so no update needed.

If the management module has architecture documentation, add a note about `tema` normalization.

### Step 2.3 — Update version and changelog

Per CLAUDE.md post-implementation checklist:
- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js`
- Add changelog entry in `frontend/src/lib/changelog.js`

## Summary

| Phase | Steps | Files Modified |
|-------|-------|----------------|
| 1. Code | 1.1 Add normalization | `management/src/migrate/engine.py` |
| 2. Docs | 2.1–2.3 Update docs + changelog | `README.md`, `frontend/src/lib/version.js`, `frontend/src/lib/changelog.js` |

**Total estimated file changes:** 4 files, ~15 lines modified
