# Implementation Plan — feature_047

## Documentos Table Processing Improvement

### Phase 1: Database Schema & Configuration

**Step 1.1 — Add `documentos_items` table to schema**
- File: `db/schema.sql`
- Add `CREATE TABLE documentos_items` with columns: `id`, `portfolio_id`, `nombre_fichero`, `tipo_documento`, `tipo_registro`, `texto`
- Add indexes on `portfolio_id`, `nombre_fichero`, `tipo_registro`
- Insert before the `-- END OF SCHEMA` marker

**Step 1.2 — Remove `documentos` from PRESERVED_TABLES**
- File: `management/src/init/db_init.py`
- Change `PRESERVED_TABLES = ["transacciones_json", "documentos"]` to `PRESERVED_TABLES = ["transacciones_json"]`

**Step 1.3 — Add config keys to settings**
- File: `management/src/config/settings.py`
- Add: `DOCUMENTOS_IMPORT_EXCEL_PATH`, `DOCUMENTOS_ITEMS_EXCEL_PATH`, `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET`, `DOCUMENTOS_ITEMS_EXCEL_TABLE`, `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH`

**Step 1.4 — Update `.env.example`**
- File: `management/.env.example`
- Add the new config keys with defaults

---

### Phase 2: Management CLI — Migration & Calculation

**Step 2.1 — Add `documentos` migration method**
- File: `management/src/migrate/engine.py`
- Add `migrate_documentos()` method to `MigrationEngine`
- Read from `DOCUMENTOS_IMPORT_EXCEL_PATH` (the import source Excel)
- Map columns using existing `DOCUMENTOS_COLUMN_MAPPING` from `management/src/summarize/excel_export.py`
- DELETE FROM documentos, then INSERT rows
- Log statistics

**Step 2.2 — Add `documentos_items` generation**
- File: `management/src/migrate/engine.py` (or new file `management/src/calculate/documentos_items.py`)
- Create function `generate_documentos_items(db_path)`:
  - Query `documentos` where `resumen_documento IS NOT NULL`
  - Parse each `resumen_documento` as JSON
  - For each key-value pair, create a row: `portfolio_id`, `nombre_fichero`, `tipo_documento`, `tipo_registro` (key), `texto` (value as string, arrays joined with `\n`)
  - DELETE FROM documentos_items, then INSERT all rows
  - Return count

**Step 2.3 — Add `documentos_items` import from Excel**
- File: `management/src/migrate/engine.py`
- Add `migrate_documentos_items()` method
- Read from `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH`
- Only runs if the file exists; otherwise falls through to generation (Step 2.2)

**Step 2.4 — Add Phase 10 to `migrate_all()`**
- File: `management/src/migrate/engine.py`
- After Phase 9, add:
  ```
  # Phase 10: Document Data (Feature 047)
  results['documentos'] = self.migrate_documentos()
  results['documentos_items'] = self.migrate_documentos_items()  # from Excel or generation
  ```

**Step 2.5 — Add `documentos_items` export**
- File: `management/src/export/documentos_items_export.py` (new file)
- Follow the same pattern as `management/src/summarize/excel_export.py`
- Column mapping: `id`, `portfolio_id`, `nombre_fichero`, `tipo_documento`, `tipo_registro`, `texto`
- Config: `DOCUMENTOS_ITEMS_EXCEL_PATH`, `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET`, `DOCUMENTOS_ITEMS_EXCEL_TABLE`
- Add `export_documentos_items` to `management/src/export/__init__.py`

---

### Phase 3: CLI Renaming & Pipeline

**Step 3.1 — Rename `main.py` → `manage.py`**
- Rename file: `management/main.py` → `management/manage.py`
- Update all internal references in help text / epilog (e.g., `python main.py init` → `python manage.py init`)

**Step 3.2 — Rename command `full_calculation_datos_relevantes` → `complete_process`**
- File: `management/manage.py`
- Update `choices` list in argparse
- Update the `elif` handler block
- Update epilog examples

**Step 3.3 — Expand `complete_process` pipeline**
- File: `management/manage.py`
- Update the pipeline from 4 steps to 6 steps:
  1. `recreate_tables`
  2. `migrate` (now includes documentos + documentos_items)
  3. `calculate_datos_relevantes`
  4. `export_datos_relevantes`
  5. `scan_documents`
  6. `export_documentos` + `export_documentos_items`

---

### Phase 4: Backend Changes

**Step 4.1 — Add `DocumentoItem` model**
- File: `backend/app/models.py`
- Add SQLAlchemy model for `documentos_items`

**Step 4.2 — Update table registry**
- File: `backend/app/table_registry.py`
- Add `"documentos_items": DocumentoItem`

**Step 4.3 — Add basic router (optional)**
- File: `backend/app/routers/documentos_items.py` (new)
- Use `router_factory` for basic CRUD
- Register in `backend/app/main.py`

---

### Phase 5: Frontend — Informe Documentos Side Drawer

**Step 5.1 — Enable side drawer**
- File: `frontend/src/features/reports/DocumentosReportPage.jsx`
- Add `showDrawer: true` to the config object (line ~153)

---

### Phase 6: Frontend — Detail Page Documentos Row Expansion

**Step 6.1 — Add row expansion to DocumentosSection**
- File: `frontend/src/features/detail/components/sections/DocumentosSection.jsx`
- Add state to track expanded rows: `const [expandedRows, setExpandedRows] = useState(new Set())`
- Remove `ruta_documento` from the main columns array
- Add a chevron/expand button column at the start
- When expanded, render a detail panel below the row showing:
  - `ruta_documento`
  - `enlace_documento`
  - `fecha_creacion`
  - `fecha_actualizacion`
  - `tokens_input`, `tokens_output`
- Handle expand/collapse with a custom table render (since SimpleTable doesn't support expansion, implement inline in DocumentosSection with a custom table or extend SimpleTable)

**Design decision:** Rather than modifying the shared `SimpleTable` component (which could affect other sections), implement the expandable table directly in `DocumentosSection` using a custom table with the same styling as `SimpleTable`.

---

### Phase 7: Frontend — Estado Proceso Tag

**Step 7.1 — Add color mappings**
- File: `frontend/src/lib/estadoColors.js`
- Add `'Error': RED` and `'Ignorado': GRAY` to `ESTADO_COLORS`
- (`Completado` → GREEN and `Pendiente` → RED are already mapped)

**Step 7.2 — Update DocumentosSection**
- File: `frontend/src/features/detail/components/sections/DocumentosSection.jsx`
- Change `estado_proceso_documento` column to `type: 'estado'` (SimpleTable handles this)

**Step 7.3 — Update DocumentosReportPage**
- File: `frontend/src/features/reports/DocumentosReportPage.jsx`
- Change `estado_proceso_documento` column to `type: 'estado'` (GenericReportPage handles this)

---

### Phase 8: Documentation

**Step 8.1 — Update `README.md`**
- CLI changes: `manage.py` instead of `main.py`, `complete_process` instead of `full_calculation_datos_relevantes`
- New tables: `documentos_items`
- New config keys

**Step 8.2 — Update `CLAUDE.md`**
- Same CLI changes
- Update project structure section
- Update database schema table
- Update testing commands

**Step 8.3 — Update architecture docs**
- `specs/architecture/architecture_management.md` — new migration phase, export, pipeline
- `specs/architecture/architecture_backend.md` — new model, router
- `specs/architecture/architecture_frontend.md` — drawer, expansion, tags

**Step 8.4 — Update `.env.example`**
- Already done in Step 1.4

---

### Phase 9: Version & Changelog

**Step 9.1 — Bump version**
- File: `frontend/src/lib/version.js`
- Set `APP_VERSION.minor` to `47`

**Step 9.2 — Add changelog entry**
- File: `frontend/src/lib/changelog.js`
- Add entry at TOP of `CHANGELOG` array:
  - version: `0.47`
  - feature: `feature_047`
  - title: `Documentos Processing Improvement`
  - summary: Brief description of all changes

---

## Dependency Order

```
Phase 1 (Schema/Config) → Phase 2 (Migration/Calculation) → Phase 3 (CLI Rename/Pipeline)
                        → Phase 4 (Backend)
                        → Phase 5-7 (Frontend, can be parallel)
Phase 3 + 4 + 5-7 → Phase 8 (Documentation)
Phase 8 → Phase 9 (Version/Changelog)
```

## Post-Implementation Bug Fixes

The following issues were discovered and fixed after the initial implementation:

1. **Excel header row detection**: Source Excel files (`PortfolioDigital_Documentos.xlsx`, `PortfolioDigital_Documentos_Items.xlsx`) have 2 title rows before the actual column headers. Added auto-detection that scans the first 10 rows looking for expected header names.
2. **Timestamp binding**: pandas reads Excel dates as `Timestamp` objects, which SQLite's `sqlite3` module cannot bind. Added `.isoformat()` conversion for `fecha_creacion` and `fecha_actualizacion`.
3. **documentos_items fallback**: When the Excel import file exists but yields 0 rows (empty template), the code now falls back to JSON generation instead of returning 0.
4. **documentos_items export from scratch**: When no template Excel file with a pre-configured Table exists, the export now creates a new `.xlsx` file from scratch with headers, data, and an Excel Table.
5. **Unicode checkmark crash**: The `✓` character in log/print messages caused `UnicodeEncodeError` on Windows cp1252 consoles. Replaced all `✓` with `[OK]` across all management module files.
6. **complete_process summary**: Enhanced the final log summary to include all pipeline results (migration row counts, calculation, and all 3 export outputs).
7. **Informe Documentos expandable rows**: Added `collapsibleConfig` to the Documentos report page so additional fields (enlace, ruta, dates, estado_iniciativa) appear in expandable detail rows. Enhanced `CollapsibleRow` in `GenericReportPage` to support `renderCell` and proper estado/date rendering in detail panels.
8. **run.bat cleanup**: Fixed copy-paste error messages, renamed `run_at_home.bat` to `run.bat`, deleted duplicate `run_at_work.bat`.

## Risk Notes

- **Excel file availability**: Migration from `PortfolioDigital_Documentos.xlsx` requires the file to exist. The `validate_config` function should be updated to check for this when running `migrate` or `complete_process`.
- **JSON parsing**: Some `resumen_documento` values may have `{"error": "..."}` format. The expansion logic should skip these gracefully.
- **SimpleTable modification**: Row expansion is implemented directly in `DocumentosSection` to avoid breaking other sections that use `SimpleTable`.
