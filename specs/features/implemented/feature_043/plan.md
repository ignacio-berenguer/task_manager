# Implementation Plan — feature_043: Document Management

## Phase 1: Database Schema

### Step 1.1: Add `documentos` table to `db/schema.sql`
- Add CREATE TABLE statement with `nombre_fichero` as TEXT PRIMARY KEY
- Add columns: portfolio_id, tipo_documento, enlace_documento, estado_proceso_documento, resumen_documento, ruta_documento, fecha_creacion, fecha_actualizacion
- Add CHECK constraint for estado_proceso_documento
- Add FK to iniciativas(portfolio_id) ON DELETE CASCADE
- Add indexes: portfolio_id, tipo_documento, estado_proceso_documento
- Position: before the "END OF SCHEMA" marker

---

## Phase 2: Backend API

### Step 2.1: Add ORM model in `backend/app/models.py`
- Add `Documento` class with `__tablename__ = "documentos"`
- `nombre_fichero` as `Column(Text, primary_key=True)`
- All other columns following existing patterns
- Position: after `EtiquetaDestacada` class (end of file)

### Step 2.2: Add Pydantic schemas in `backend/app/schemas.py`
- Add `DocumentoCreate`, `DocumentoUpdate` schemas
- Add `DocumentosReportRequest` with fields: portfolio_id, nombre, tipo_documento[], estado_proceso_documento[], order_by, order_dir, limit, offset
- Position: before the Generic Schemas section

### Step 2.3: Register model in `backend/app/table_registry.py`
- Import `Documento` from models
- Add `"documentos": Documento` to TABLE_MODELS dict

### Step 2.4: Create router in `backend/app/routers/documentos.py`
- Custom router following `etiquetas.py` pattern
- CRUD endpoints with `nombre_fichero` (str) as path parameter instead of `id` (int)
- Custom `CRUDBase` usage — override get/update/delete to query by `nombre_fichero` instead of `id`
- Report endpoints:
  - `GET /report-documentos-filter-options` — distinct tipo_documento, estado_proceso_documento
  - `POST /search-report-documentos` — join with DatosDescriptivo (nombre) and DatosRelevante (estado_de_la_iniciativa)
- `POST /search` for flexible search
- Static routes before dynamic `/{nombre_fichero}` route

### Step 2.5: Register router in `backend/app/main.py`
- Import `documentos` from routers
- Add `app.include_router(documentos.router, prefix=settings.API_PREFIX)` in the standard CRUD section

---

## Phase 3: Management CLI — Document Scanner

### Step 3.1: Add configuration in `management/src/config/settings.py`
- Add `DOCUMENT_SCAN_CONFIG` loaded from `.env` (default `'[]'`)

### Step 3.2: Update `management/.env.example`
- Add `DOCUMENT_SCAN_CONFIG` with example JSON value including `name` field per entry, and comments explaining the format

### Step 3.3: Create scanner module `management/src/scan/`
- `__init__.py` — export `scan_documents` function
- `portfolio_patterns.py`:
  - Regex for portfolio_id extraction from folder names and filenames
  - Patterns: `SPA_\d{2}_\d{1,4}`, `SPA_[A-Z]{2}-[A-Z]{3}_\d{1,4}`
  - Function: `extract_portfolio_id(name: str) -> str | None`
- `scanner.py`:
  - `scan_documents(db_path: str)` — main entry point
  - Parse `DOCUMENT_SCAN_CONFIG` JSON
  - Validate each folder path exists
  - Load existing `nombre_fichero` set from DB for dedup check
  - Load valid `portfolio_id` set from `iniciativas` table
  - For each folder config (identified by `name`):
    - Log config name at start/end of each scan
    - **subfolder mode**: iterate subdirectories, extract portfolio_id, match files against type patterns, handle most-recent-only logic
    - **flat mode**: iterate files directly, extract portfolio_id from filename, match against type patterns, group by portfolio_id, handle most-recent-only logic (same as subfolder)
  - Generate `enlace_documento` (URL-encode all path components):
    - **subfolder**: `base_url + "/" + url_encode(subfolder_name) + "/" + url_encode(filename)`
    - **flat**: `base_url + "/" + url_encode(filename)`
  - INSERT new records with estado="Pendiente", timestamps
  - Log summary statistics per config name

### Step 3.4: Add CLI command in `management/main.py`
- Add `'scan_documents'` to argparse choices
- Add `elif args.command == 'scan_documents':` block
- Verify DB exists, call `scan_documents(args.db)`

---

## Phase 4: Frontend — Detail Page Section

### Step 4.0: Create SharePoint URL utility
- File: `frontend/src/lib/sharepoint.js`
- `toSharePointOnlineUrl(directUrl)` — converts direct SharePoint URL to Online viewer URL
- Inserts file-type code (`:w:` Word, `:x:` Excel, `:p:` PowerPoint, `:b:` PDF) and appends `?web=1`
- Formula: `https://{tenant}.sharepoint.com/{:type_code:}/r/{path}?web=1`

### Step 4.1: Create `DocumentosSection.jsx`
- File: `frontend/src/features/detail/components/sections/DocumentosSection.jsx`
- Uses `SimpleTable` with columns: tipo_documento, nombre_fichero (online viewer link), estado_proceso_documento, _download (download button), ruta_documento
- Custom cell renderer for nombre_fichero: if row has `enlace_documento`, render `<a>` linking to `toSharePointOnlineUrl(enlace_documento)` (opens in Word/Excel Online); else plain text
- Custom cell renderer for _download: if row has `enlace_documento`, render Download icon button linking to direct `enlace_documento` URL (downloads the file)
- Read-only (no edit modals)

### Step 4.2: Export from sections index
- Add `export { DocumentosSection } from './DocumentosSection'` to `sections/index.js`

### Step 4.3: Integrate into DetailPage.jsx
- Import `DocumentosSection`
- Extract `documentos` from `data.documentos` (it will be an array from portfolio.py)
- Add `SectionAccordion` with id="documentos", title="Documentos", count, read-only
- Position: after Dependencias, before Transacciones

### Step 4.4: Update DetailNav.jsx
- Add "Documentos" entry to the navigation list

---

## Phase 5: Frontend — Informe Documentos Report Page

### Step 5.1: Create `DocumentosReportPage.jsx`
- File: `frontend/src/features/reports/DocumentosReportPage.jsx`
- Follow `EtiquetasReportPage.jsx` pattern exactly
- Define REPORT_COLUMNS, ADDITIONAL_COLUMNS, DEFAULT_COLUMN_IDS, DEFAULT_FILTERS, FILTER_DEFS
- Custom `nombre_fichero` column: uses `renderCell` callback to render as link to `toSharePointOnlineUrl(enlace_documento)` (opens in Word/Excel Online)
- Custom `_download` column: uses `renderCell` to render Download icon button linking to direct `enlace_documento` URL
- buildRequestBody function maps filters to API request shape
- Config object with all GenericReportPage props

### Step 5.2: Add route in App.jsx
- Lazy import `DocumentosReportPage`
- Add `<Route path="/informes/documentos" ...>` inside protected routes, after notas

### Step 5.3: Add to Navbar
- Import `FileText` icon (already imported, or use different icon if FileText conflicts)
- Add `{ name: 'Documentos', href: '/informes/documentos', icon: FileText }` to `informesItems` array
- Position: after Notas entry, before Transacciones

---

## Phase 6: Post-Implementation

### Step 6.1: Version bump
- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js` to 43

### Step 6.2: Changelog entry
- Add entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`

### Step 6.3: Update README.md
- Add `documentos` to table list
- Add `scan_documents` command
- Add Informe Documentos to routes table

### Step 6.4: Update architecture docs
- `specs/architecture/architecture_backend.md` — add documentos router, model, endpoints
- `specs/architecture/architecture_frontend.md` — add DocumentosSection, DocumentosReportPage, route

### Step 6.5: Build verification
- Run `npm run build` in frontend to verify no build errors

---

## Implementation Order

```
Phase 1 (Schema)    → Phase 2 (Backend)    → Phase 3 (CLI Scanner)
                                            → Phase 4 (Detail Section)
                                            → Phase 5 (Report Page)
                                            → Phase 6 (Post-Implementation)
```

Phases 3, 4, and 5 are independent of each other once Phase 2 is complete. They can be implemented in any order, but for testing purposes, Phase 3 (scanner) should come first so the database has data to display.

---

## Risk Notes

1. **PK as Text**: The `CRUDBase` class assumes integer `id` for get/update/delete. The documentos router needs custom query-by-`nombre_fichero` logic instead of using `CRUDBase.get(db, id)`.

2. **Filename uniqueness**: If two folders contain files with the same name, only the first one scanned will be inserted. The scanner should log a warning when a filename collision occurs.

3. **Long paths on Windows**: OneDrive paths can be very long. Ensure no path truncation in SQLite TEXT columns (no limit by default, so this should be fine).

4. **Special characters in filenames**: URL encoding via `urllib.parse.quote()` must handle Spanish characters (accents, ñ) correctly for SharePoint URLs.

5. **GenericReportPage link rendering**: The `nombre_fichero` column needs to render as a clickable external link. Check if GenericReportPage supports custom cell renderers; if not, add minimal support for a `link` column type.
