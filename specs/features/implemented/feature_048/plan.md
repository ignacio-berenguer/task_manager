# Plan: feature_048 — Management Module .env Refactor

## Phase 1: Update settings.py (core config)

**File**: `management/src/config/settings.py`

1. Rename `EXCEL_OUTPUT_FILE` → `DATOS_RELEVANTES_FILE`
2. Rename `EXCEL_OUTPUT_WORKSHEET` → `DATOS_RELEVANTES_WORKSHEET`
3. Rename `EXCEL_OUTPUT_TABLE` → `DATOS_RELEVANTES_TABLE`
4. Rename `DOCUMENTOS_EXCEL_PATH` → compose from `EXCEL_OUTPUT_DIR` + `DOCUMENTOS_EXPORT_FILE`
5. Rename `DOCUMENTOS_EXCEL_WORKSHEET` → `DOCUMENTOS_EXPORT_WORKSHEET`
6. Rename `DOCUMENTOS_EXCEL_TABLE` → `DOCUMENTOS_EXPORT_TABLE`
7. Rename `DOCUMENTOS_IMPORT_EXCEL_PATH` → compose from `EXCEL_SOURCE_DIR` + `DOCUMENTOS_IMPORT_FILE`
8. Rename `DOCUMENTOS_ITEMS_EXCEL_PATH` → compose from `EXCEL_OUTPUT_DIR` + `DOCUMENTOS_ITEMS_EXPORT_FILE`
9. Rename `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET` → `DOCUMENTOS_ITEMS_EXPORT_WORKSHEET`
10. Rename `DOCUMENTOS_ITEMS_EXCEL_TABLE` → `DOCUMENTOS_ITEMS_EXPORT_TABLE`
11. Rename `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` → compose from `EXCEL_SOURCE_DIR` + `DOCUMENTOS_ITEMS_IMPORT_FILE`
12. Keep `EXCEL_OUTPUT_DIR` as-is (now serves as base for all output files)
13. Remove `WINDOWS_EXCEL_PATH` (only used by decommissioned `copy_excel_sources.sh`)

The composed path variables will be computed properties:
```python
DATOS_RELEVANTES_PATH = str(Path(EXCEL_OUTPUT_DIR) / DATOS_RELEVANTES_FILE)
DOCUMENTOS_EXPORT_PATH = str(Path(EXCEL_OUTPUT_DIR) / DOCUMENTOS_EXPORT_FILE)
DOCUMENTOS_IMPORT_PATH = str(Path(EXCEL_SOURCE_DIR) / DOCUMENTOS_IMPORT_FILE)
DOCUMENTOS_ITEMS_EXPORT_PATH = str(Path(EXCEL_OUTPUT_DIR) / DOCUMENTOS_ITEMS_EXPORT_FILE)
DOCUMENTOS_ITEMS_IMPORT_PATH = str(Path(EXCEL_SOURCE_DIR) / DOCUMENTOS_ITEMS_IMPORT_FILE)
```

## Phase 2: Update consumer code

### 2a: `management/src/export/excel_export.py`

- Replace `config.EXCEL_OUTPUT_FILE` → `config.DATOS_RELEVANTES_FILE`
- Replace `config.EXCEL_OUTPUT_WORKSHEET` → `config.DATOS_RELEVANTES_WORKSHEET`
- Replace `config.EXCEL_OUTPUT_TABLE` → `config.DATOS_RELEVANTES_TABLE`
- Replace path composition `Path(config.EXCEL_OUTPUT_DIR) / config.EXCEL_OUTPUT_FILE` → `Path(config.DATOS_RELEVANTES_PATH)`

### 2b: `management/src/summarize/excel_export.py`

- Replace `config.DOCUMENTOS_EXCEL_PATH` → `config.DOCUMENTOS_EXPORT_PATH`
- Replace `config.DOCUMENTOS_EXCEL_WORKSHEET` → `config.DOCUMENTOS_EXPORT_WORKSHEET`
- Replace `config.DOCUMENTOS_EXCEL_TABLE` → `config.DOCUMENTOS_EXPORT_TABLE`

### 2c: `management/src/export/documentos_items_export.py`

- Replace `config.DOCUMENTOS_ITEMS_EXCEL_PATH` → `config.DOCUMENTOS_ITEMS_EXPORT_PATH`
- Replace `config.DOCUMENTOS_ITEMS_EXCEL_WORKSHEET` → `config.DOCUMENTOS_ITEMS_EXPORT_WORKSHEET`
- Replace `config.DOCUMENTOS_ITEMS_EXCEL_TABLE` → `config.DOCUMENTOS_ITEMS_EXPORT_TABLE`

### 2d: `management/src/migrate/engine.py`

- Replace `config.DOCUMENTOS_IMPORT_EXCEL_PATH` → `config.DOCUMENTOS_IMPORT_PATH`
- Replace `config.DOCUMENTOS_EXCEL_WORKSHEET` → `config.DOCUMENTOS_EXPORT_WORKSHEET`
- Replace `config.DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` → `config.DOCUMENTOS_ITEMS_IMPORT_PATH`

## Phase 2e: Delete decommissioned files

- Delete `management/copy_excel_sources.sh`

## Phase 3: Update .env files

### 3a: `management/.env`

Rewrite with new structure (see specs.md for template). Key changes:
- Remove full-path variables, replace with `_FILE` variables
- Remove `WINDOWS_EXCEL_PATH`
- Add section comments
- Keep all actual values from current `.env`

### 3b: `management/.env.example`

Mirror the `.env` structure with placeholder/default values.

## Phase 4: Update documentation

### 4a: `specs/architecture/architecture_management.md`

Update the "Configuration" section with the new `.env` variable list and the base-directory composition pattern.

### 4b: `README.md`

Check if management `.env` variables are referenced and update if so.

### 4c: `CLAUDE.md`

Check if management `.env` variables are referenced and update if so (the management Configuration section in the Project Structure).

## Phase 5: Post-feature checklist

1. Increment `APP_VERSION.minor` in `frontend/src/lib/version.js`
2. Add changelog entry in `frontend/src/lib/changelog.js`
3. Use `/close_feature feature_048` to finalize

## Verification

After all changes:
- Confirm `settings.py` loads without errors: `uv run python -c "from src.config import settings; print('OK')"`
- Confirm all commands parse: `uv run python manage.py --help`
- Validate no broken references: search for old variable names in `management/src/`
