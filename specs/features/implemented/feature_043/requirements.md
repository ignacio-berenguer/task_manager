# Requirements Prompt for feature_043

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_043/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_043/plan.md' in order to do that.

## Feature Brief

Document Management associated to Iniciativas. This feature adds a new `documentos` table and full-stack support for managing documents linked to portfolio initiatives.

### (1) Database Table — `documentos`

Create a documents table called "documentos" that will allow association of several kinds of documents (initially "SM100", "SM200", "Approval Form") to each `portfolio_id` in the database. The table should store at least:

| Column                     | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `portfolio_id`             | Foreign key linking to the initiative                |
| `tipo_documento`           | Type of document: "SM100", "SM200", "Approval Form"  |
| `nombre_fichero`           | File name of the document                            |
| `enlace_documento`         | SharePoint URL, auto-generated as `base_url` + URL-encoded filename |
| `estado_proceso_documento` | Processing status: "Pendiente" or "Completado"       |
| `resumen_documento`        | Summary/description of the document (in JSON format) |
| `ruta_documento`           | Complete local file system path to the document      |

The primary key of this table should be nombre_fichero.

### (2) Detail Page — Documentos Section

Create user interface elements to display document information:

- New accordion section in the Detail page for Documentos
- Show all documents associated with the initiative's `portfolio_id`
- If `enlace_documento` is present, the document name should be a clickable link to the SharePoint URL

### (3) Informe Documentos (Report Page)

Create a new report page "Informe Documentos" with:

- Reasonable filters (tipo_documento, estado_proceso_documento, portfolio_id, etc.)
- Same link-to-Detail and side drawer for iniciativas as the other reports
- If `enlace_documento` is present, the document name should be a clickable link to the URL

### (4) Document Scanning Process (Management CLI)

Create a process and a CLI command that populates the `documentos` table by scanning folder paths:

- Folder paths are provided in the `.env` file for the management process
- All folder scan configurations are provided in the `.env` file and processed in a single command execution
- Each folder configuration includes: a `name` for identification, folder path, folder mode, SharePoint base URL, and one or more document type + wildcard pattern pairs
- The `enlace_documento` is auto-generated during scanning (all path components URL-encoded):
  - **subfolder mode**: `base_url` + `/` + URL-encoded(subfolder_name) + `/` + URL-encoded(filename)
  - **flat mode**: `base_url` + URL-encoded(filename)
- **Two folder modes** are supported:
  - **`subfolder` mode**: Documents are inside subfolders named as (or starting with) a portfolio_id. The wildcard pattern matches the document filename to determine tipo_documento.
  - **`flat` mode**: Documents are directly in the folder (no subfolders). The portfolio_id is extracted from the filename itself using the wildcard pattern.
- Portfolio_id patterns to recognize: `SPA_NN_N` to `SPA_NN_NNNN`, `SPA_XX-XXX_N` to `SPA_XX-XXX_NNNN`

**Example configuration (3 folder scans in one execution):**

| # | Name | Folder Path | Mode | Base URL | Document Type | Filename Pattern |
|---|------|-------------|------|----------|---------------|------------------|
| 1 | Documentación 2025 | `C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Documentación Iniciativas 2025 SM100 SM200` | subfolder | `https://enelcom.sharepoint.com/sites/CoordinacinSatelliteBusinessImprovement/Shared%20Documents/General/Portfolio%20Digital%202024-2025%20---%20Documentaci%C3%B3n` | SM100 | `SM100*` |
| | | | | | SM200 | `SM2nn*` |
| 2 | Documentación 2026 | `C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Documentación Iniciativas 2026 SM100 SM200` | subfolder | `https://enelcom.sharepoint.com/sites/CoordinacinSatelliteBusinessImprovement/Shared%20Documents/General/Documentaci%C3%B3n%20Iniciativas` | SM100 | `SM100*` |
| | | | | | SM200 | `SM2nn*` |
| 3 | Fichas | `C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Fichas\General\Validación P&C\Revisados\old` | flat | `https://enelcom.sharepoint.com/sites/IMProyectosDigitales/Shared Documents/General/Validación P&C/Revisados/old/` | Approval Form | `*{portfolio_id}*` |

- The process should:
  1. Scan all configured folders in sequence
  2. **subfolder mode**: Identify portfolio_id subfolders by matching name patterns, then match files inside against wildcard patterns to determine tipo_documento
  3. **flat mode**: Scan files directly in the folder, extract portfolio_id from filenames using the pattern
  4. If there are many documents of a certain tipo_documento for the same portfolio_id, consider only the file with the most recent date of modification
  5. Check the database table to see if the document already exists (compare filename vs `nombre_fichero`)
  6. If the document is NOT in the table, create a new record with:
     - `estado_proceso_documento` = "Pendiente"
     - `tipo_documento` = type matching the folder and filename pattern
     - `ruta_documento` = complete path to the document
     - `enlace_documento` = auto-generated (subfolder: `base_url/url_encode(subfolder)/url_encode(filename)`; flat: `base_url/url_encode(filename)`)
     - updated timestamp fields

## User Story

As a portfolio manager, I want to associate and track documents (SM100, SM200, Approval Forms) linked to each initiative, so that I can see which documents exist, access them via SharePoint links, and automatically discover new documents by scanning shared folders.

## Key Requirements

### Requirement 1: Database Schema — `documentos` Table

- Create the `documentos` table in `db/schema.sql` with the columns specified above
- Primary key: `nombre_fichero` (TEXT)
- `portfolio_id` should reference `iniciativas(portfolio_id)`
- `resumen_documento` stores data in JSON format (TEXT column)
- Add appropriate indexes for common query patterns (portfolio_id, tipo_documento, estado_proceso_documento)
- Add timestamps: `fecha_creacion`, `fecha_actualizacion`

### Requirement 2: Backend API — CRUD + Search + Report

- Standard CRUD endpoints via router factory for `documentos`
- Flexible search endpoint: `POST /api/v1/documentos/search`
- Report endpoints: `GET /api/v1/documentos/report-documentos-filter-options` + `POST /api/v1/documentos/search-report-documentos`
- ORM model in `models.py`, Pydantic schema in `schemas.py`

### Requirement 3: Frontend — Detail Page Section

- New accordion section "Documentos" in the Detail page
- Display document list in a table with columns: tipo_documento, nombre_fichero, estado_proceso_documento, download button, ruta_documento
- If `enlace_documento` is present, the document name (nombre_fichero) should be a clickable link that opens the document in Word Online / Excel Online / PowerPoint Online in a new browser tab (using SharePoint Online viewer URL with `:w:/r/` prefix and `?web=1` parameter)
- A separate download button (Download icon) should link to the direct SharePoint URL for downloading the file
- Follow existing Detail page patterns for data fetching and display

### Requirement 4: Frontend — Informe Documentos Report Page

- New report page at route `/informes/documentos`
- Use `GenericReportPage` pattern
- Filters: tipo_documento, estado_proceso_documento, portfolio_id search
- Configurable columns with drag-and-drop reordering
- Document name (nombre_fichero) opens in Word Online / Excel Online / PowerPoint Online via SharePoint Online viewer URL (same conversion as Detail page)
- A separate download button column for direct file download via the original SharePoint URL
- Side drawer for initiative details (same as other reports)
- Add navigation entry in sidebar/navbar

### Requirement 5: Management CLI — Document Scanner

- New CLI command: `uv run python main.py scan_documents`
- `.env` configuration: JSON-encoded list of folder scan definitions, each with `name` (identifier), folder path, mode (`subfolder` or `flat`), SharePoint base URL, and document type/pattern pairs
- All configured folders are processed in a single command execution
- **Two folder modes:**
  - **`subfolder`**: Traverse portfolio_id-named subfolders, match filenames against wildcard patterns (e.g., `SM100*`, `SM2nn*`)
  - **`flat`**: Scan files directly in folder, extract portfolio_id from filenames (e.g., `*{portfolio_id}*`)
- Portfolio_id patterns to recognize: `SPA_NN_N` to `SPA_NN_NNNN`, `SPA_XX-XXX_N` to `SPA_XX-XXX_NNNN`
- When multiple files of the same tipo_documento exist for the same portfolio_id, keep only the most recently modified file
- Check DB for existing records (compare filename vs `nombre_fichero`)
- Insert new records with `estado_proceso_documento` = "Pendiente", matched `tipo_documento`, full `ruta_documento`, auto-generated `enlace_documento` (subfolder: base_url + URL-encoded subfolder + URL-encoded filename; flat: base_url + URL-encoded filename), and updated timestamps
- Log all operations (scanned folders, found files, matched types, new inserts, skipped duplicates)

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
