# Technical Specification — feature_043: Document Management

## Overview

Add a `documentos` table and full-stack support for managing documents (SM100, SM200, Approval Form) linked to portfolio initiatives. Includes a management CLI scanner that discovers documents from configured folders, a backend API with CRUD/search/report endpoints, a Detail page section, and an Informe Documentos report page.

---

## 1. Database Schema

### Table: `documentos`

```sql
CREATE TABLE documentos (
    nombre_fichero TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    enlace_documento TEXT,
    estado_proceso_documento TEXT NOT NULL DEFAULT 'Pendiente',
    resumen_documento TEXT,          -- JSON format
    ruta_documento TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    CHECK (estado_proceso_documento IN ('Pendiente', 'Completado'))
);

CREATE INDEX idx_documentos_portfolio ON documentos (portfolio_id);
CREATE INDEX idx_documentos_tipo ON documentos (tipo_documento);
CREATE INDEX idx_documentos_estado ON documentos (estado_proceso_documento);
```

**Design decisions:**
- Primary key is `nombre_fichero` (TEXT) per requirements — filenames are unique across all scan folders
- `resumen_documento` is TEXT storing JSON (same pattern as `transacciones_json.cambios`)
- `estado_proceso_documento` uses CHECK constraint with two allowed values
- FK to `iniciativas(portfolio_id)` with CASCADE delete
- Standard audit timestamps (`fecha_creacion`, `fecha_actualizacion`)

---

## 2. Backend API

### 2.1 SQLAlchemy Model (`models.py`)

```python
class Documento(Base):
    """Documents associated with initiatives."""
    __tablename__ = "documentos"

    nombre_fichero = Column(Text, primary_key=True)
    portfolio_id = Column(Text, nullable=False)
    tipo_documento = Column(Text, nullable=False)
    enlace_documento = Column(Text)
    estado_proceso_documento = Column(Text, nullable=False, default="Pendiente")
    resumen_documento = Column(Text)
    ruta_documento = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)
```

### 2.2 Pydantic Schemas (`schemas.py`)

```python
class DocumentoCreate(BaseModel):
    nombre_fichero: str
    portfolio_id: str
    tipo_documento: str
    enlace_documento: str | None = None
    estado_proceso_documento: str = "Pendiente"
    resumen_documento: str | None = None
    ruta_documento: str | None = None

class DocumentoUpdate(BaseModel):
    portfolio_id: str | None = None
    tipo_documento: str | None = None
    enlace_documento: str | None = None
    estado_proceso_documento: str | None = None
    resumen_documento: str | None = None
    ruta_documento: str | None = None

class DocumentosReportRequest(BaseModel):
    portfolio_id: str | None = None
    nombre: str | None = None
    tipo_documento: list[str] = []
    estado_proceso_documento: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

### 2.3 Router (`routers/documentos.py`)

Custom router (not factory) since it needs report endpoints. Pattern follows `etiquetas.py`:

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/documentos/` | List with pagination |
| GET | `/documentos/report-documentos-filter-options` | Distinct filter values |
| POST | `/documentos/search-report-documentos` | Report search with joins |
| GET | `/documentos/portfolio/{portfolio_id}` | Get by portfolio |
| GET | `/documentos/{nombre_fichero}` | Get by PK (string) |
| POST | `/documentos/` | Create |
| PUT | `/documentos/{nombre_fichero}` | Update |
| DELETE | `/documentos/{nombre_fichero}` | Delete |
| POST | `/documentos/search` | Flexible search |

**Key difference from other routers:** The PK is `nombre_fichero` (Text), not `id` (Integer). The `/{nombre_fichero}` path parameter will be `str`, and `CRUDBase` methods that look up by integer `id` need a custom approach — use direct query by `nombre_fichero` instead.

**Report search joins:** Join with `DatosDescriptivo` to include `nombre` and with `DatosRelevante` to include `estado_de_la_iniciativa` (same as etiquetas report pattern).

**Filter options:** Return distinct values for `tipo_documento` and `estado_proceso_documento`.

### 2.4 Registration

- Add `Documento` to `table_registry.py` as `"documentos": Documento`
- Import and register router in `main.py`
- The `documentos` table will be automatically included in the portfolio cross-table search (`portfolio.py`) since the model has a `portfolio_id` attribute

---

## 3. Frontend — Detail Page Section

### 3.1 `DocumentosSection.jsx`

New section component in `frontend/src/features/detail/components/sections/`:

- Read-only display (documents are populated by the CLI scanner, not manually)
- Uses `SimpleTable` component with columns:
  - `tipo_documento` — text
  - `nombre_fichero` — custom renderer: if `enlace_documento` exists, render as link to SharePoint Online viewer URL (converted via `toSharePointOnlineUrl()` which adds `:w:/r/` prefix + `?web=1`); otherwise plain text
  - `estado_proceso_documento` — text
  - `_download` — download button: if `enlace_documento` exists, render a Download icon button linking to the direct SharePoint URL (downloads the file)
  - `ruta_documento` — text (truncated, tooltip on hover)
- No create/edit/delete modals (read-only section)

**SharePoint Online URL conversion** (`frontend/src/lib/sharepoint.js`):
- Converts direct SharePoint URLs to online viewer URLs
- Inserts file-type code after domain: `:w:` (Word), `:x:` (Excel), `:p:` (PowerPoint), `:b:` (PDF)
- Appends `?web=1` to force browser viewing instead of download
- Formula: `https://{tenant}.sharepoint.com/{:type_code:}/r/{path}?web=1`

### 3.2 Detail Page Integration

In `DetailPage.jsx`:
- Import `DocumentosSection` from sections index
- Extract `documentos` from `data.documentos` (array)
- Add `SectionAccordion` with `id="documentos"`, `title="Documentos"`, read-only (no headerAction buttons)
- Position: after Dependencias, before Transacciones

### 3.3 Detail Nav

Update `DetailNav.jsx` to include "Documentos" entry.

---

## 4. Frontend — Informe Documentos Report Page

### 4.1 `DocumentosReportPage.jsx`

New file in `frontend/src/features/reports/`, following `EtiquetasReportPage.jsx` pattern:

**Columns:**
| id | label | type | category |
|----|-------|------|----------|
| `portfolio_id` | Portfolio ID | text | Documentos (por defecto) |
| `nombre` | Nombre Iniciativa | text | Documentos (por defecto) |
| `tipo_documento` | Tipo Documento | text | Documentos (por defecto) |
| `nombre_fichero` | Nombre Fichero | text (custom renderCell) | Documentos (por defecto) |
| `estado_proceso_documento` | Estado Proceso | text | Documentos (por defecto) |
| `_download` | (download button) | text (custom renderCell) | Documentos (por defecto) |
| `enlace_documento` | Enlace | text | Adicional |
| `ruta_documento` | Ruta | text | Adicional |
| `resumen_documento` | Resumen | longtext | Adicional |
| `estado_de_la_iniciativa` | Estado Iniciativa | estado | Portfolio |
| `fecha_creacion` | Fecha Creación | date | Adicional |
| `fecha_actualizacion` | Fecha Actualización | date | Adicional |

**Custom cell renderers:**
- `nombre_fichero` — renders as a clickable link to the SharePoint Online viewer URL (converted via `toSharePointOnlineUrl()`) when `enlace_documento` is present. Opens document in Word/Excel/PowerPoint Online in a new tab. Otherwise, plain text.
- `_download` — renders a Download icon button linking to the direct `enlace_documento` URL (downloads the file). Only shown when `enlace_documento` exists.

**Filters:**
| key | type | label |
|-----|------|-------|
| `portfolioId` | text | Portfolio ID |
| `nombre` | text | Nombre |
| `tipoDocumento` | multiselect | Tipo Documento |
| `estadoProcesoDocumento` | multiselect | Estado Proceso |

**Config:**
- `searchEndpoint`: `/documentos/search-report-documentos`
- `filterOptionsEndpoint`: `/documentos/report-documentos-filter-options`
- `storagePrefix`: `documentos`
- `icon`: `FileText` from lucide-react
- `defaultSort`: `{ field: 'portfolio_id', direction: 'asc' }`

### 4.2 Route Registration

In `App.jsx`:
- Add lazy import: `const DocumentosReportPage = lazy(() => import('@/features/reports/DocumentosReportPage'))`
- Add route: `<Route path="/informes/documentos" element={<ErrorBoundary><DocumentosReportPage /></ErrorBoundary>} />`

### 4.3 Navigation

In `Navbar.jsx`, add to `informesItems` array:
```js
{ name: 'Documentos', href: '/informes/documentos', icon: FileText }
```

Position: after Notas, before Transacciones.

---

## 5. Management CLI — Document Scanner

### 5.1 Configuration (`.env`)

Add a JSON-encoded `DOCUMENT_SCAN_CONFIG` variable. Each entry includes a `name` for identification:

```env
DOCUMENT_SCAN_CONFIG=[{"name":"Documentación 2025","path":"C:\\Users\\ES07239146B\\OneDrive - Enel Spa\\Documents\\edistribucion\\Documentación Iniciativas 2025 SM100 SM200","mode":"subfolder","base_url":"https://enelcom.sharepoint.com/sites/CoordinacinSatelliteBusinessImprovement/Shared%20Documents/General/Portfolio%20Digital%202024-2025%20---%20Documentaci%C3%B3n","types":[{"tipo":"SM100","pattern":"SM100*"},{"tipo":"SM200","pattern":"SM2nn*"}]},{"name":"Documentación 2026","path":"C:\\Users\\ES07239146B\\OneDrive - Enel Spa\\Documents\\edistribucion\\Documentación Iniciativas 2026 SM100 SM200","mode":"subfolder","base_url":"https://enelcom.sharepoint.com/sites/CoordinacinSatelliteBusinessImprovement/Shared%20Documents/General/Documentaci%C3%B3n%20Iniciativas","types":[{"tipo":"SM100","pattern":"SM100*"},{"tipo":"SM200","pattern":"SM2nn*"}]},{"name":"Fichas","path":"C:\\Users\\ES07239146B\\OneDrive - Enel Spa\\Documents\\edistribucion\\Fichas\\General\\Validación P&C\\Revisados\\old","mode":"flat","base_url":"https://enelcom.sharepoint.com/sites/IMProyectosDigitales/Shared Documents/General/Validación P&C/Revisados/old/","types":[{"tipo":"Approval Form","pattern":"*"}]}]
```

### 5.2 Settings (`settings.py`)

```python
# Document scanner configuration
DOCUMENT_SCAN_CONFIG: str = os.getenv('DOCUMENT_SCAN_CONFIG', '[]')
```

Parsed at runtime in the scanner module as `json.loads(DOCUMENT_SCAN_CONFIG)`.

### 5.3 CLI Command

New command `scan_documents` in `main.py`:
- Added to `choices` list
- Requires database to exist
- Calls `scan_documents(args.db)` from `src.scan` module

### 5.4 Scanner Module (`src/scan/`)

New package: `management/src/scan/`
- `__init__.py` — exports `scan_documents`
- `scanner.py` — main scanning logic
- `portfolio_patterns.py` — portfolio_id regex patterns

**Portfolio ID patterns** (regex):
```
SPA_\d{2}_\d{1,4}              # SPA_NN_N to SPA_NN_NNNN (e.g. SPA_25_1, SPA_25_100)
SPA_[A-Z]{2}-[A-Z]{3}_\d{1,4}  # SPA_XX-XXX_N to SPA_XX-XXX_NNNN (e.g. SPA_AM-OTH_1, SPA_AM-OTH_1092)
```

**Scanning algorithm:**

```
for each folder_config in DOCUMENT_SCAN_CONFIG:
    log: "Scanning config: {folder_config.name}"
    if mode == "subfolder":
        for each subdirectory in folder_config.path:
            portfolio_id = extract_portfolio_id(subdirectory.name)
            if not portfolio_id: skip
            if portfolio_id not in iniciativas table: log warning, skip
            for each type_config in folder_config.types:
                matching_files = glob(subdirectory / type_config.pattern)
                if multiple matches: keep only most recently modified
                if matching_file:
                    if nombre_fichero already in documentos: skip (log)
                    else: INSERT new record

    elif mode == "flat":
        for each type_config in folder_config.types:
            group files by extracted portfolio_id
            for each portfolio_id, files_group:
                if not portfolio_id: skip
                if portfolio_id not in iniciativas table: log warning, skip
                matching_files = [f for f in files_group if fnmatch(f.name, type_config.pattern)]
                if multiple matches: keep only most recently modified
                if matching_file:
                    if nombre_fichero already in documentos: skip (log)
                    else: INSERT new record
```

**enlace_documento generation** (URL-encode all path components):
- **subfolder mode**: `base_url + "/" + urllib.parse.quote(subfolder_name) + "/" + urllib.parse.quote(filename)`
- **flat mode**: `base_url + "/" + urllib.parse.quote(filename)`

```python
# subfolder mode
enlace = f"{base_url}/{urllib.parse.quote(subfolder_name)}/{urllib.parse.quote(filename)}"
# flat mode
enlace = f"{base_url}/{urllib.parse.quote(filename)}"
```

**Wildcard pattern matching:**
- `SM100*` → `fnmatch.fnmatch(filename, 'SM100*')`
- `SM2nn*` → `fnmatch.fnmatch(filename, 'SM2??*')` (treat `nn` as two-character wildcard)
- `*` → matches everything (for flat mode Approval Forms where any file in folder matches)

**Note on `SM2nn*` pattern:** The `nn` in the pattern represents two digit characters. Implementation should convert `nn` to `??` for fnmatch, or use a regex `SM2\d{2}.*`.

**Database operations:**
- Use direct SQLite connection (same pattern as other management modules — `sqlite3.connect(db_path)`)
- Query `iniciativas` table to validate portfolio_id exists
- Query `documentos` table to check for existing `nombre_fichero`
- INSERT new records directly

**Logging:**
- Log each folder scan start/end with config `name`
- Log each portfolio_id subfolder found
- Log each file matched with type
- Log skipped duplicates
- Log new inserts
- Summary at end: total scanned, new inserts, skipped duplicates, errors

---

## 6. Files to Create/Modify

### New Files
| File | Description |
|------|-------------|
| `management/src/scan/__init__.py` | Scanner module exports |
| `management/src/scan/scanner.py` | Document scanning logic |
| `management/src/scan/portfolio_patterns.py` | Portfolio ID regex extraction |
| `backend/app/routers/documentos.py` | Documentos router with CRUD + report |
| `frontend/src/features/detail/components/sections/DocumentosSection.jsx` | Detail page section |
| `frontend/src/features/reports/DocumentosReportPage.jsx` | Report page |
| `frontend/src/lib/sharepoint.js` | SharePoint direct URL → Online viewer URL converter |

### Modified Files
| File | Change |
|------|--------|
| `db/schema.sql` | Add `documentos` table DDL |
| `backend/app/models.py` | Add `Documento` model |
| `backend/app/schemas.py` | Add `DocumentoCreate`, `DocumentoUpdate`, `DocumentosReportRequest` |
| `backend/app/table_registry.py` | Register `Documento` |
| `backend/app/main.py` | Import and include `documentos` router |
| `management/main.py` | Add `scan_documents` command |
| `management/src/config/settings.py` | Add `DOCUMENT_SCAN_CONFIG` |
| `management/.env.example` | Add `DOCUMENT_SCAN_CONFIG` example |
| `frontend/src/features/detail/DetailPage.jsx` | Add DocumentosSection accordion |
| `frontend/src/features/detail/components/sections/index.js` | Export DocumentosSection |
| `frontend/src/App.jsx` | Add DocumentosReportPage route |
| `frontend/src/components/layout/Navbar.jsx` | Add Documentos to informesItems |
| `frontend/src/features/detail/components/DetailNav.jsx` | Add Documentos nav entry |
| `frontend/src/lib/version.js` | Bump version |
| `frontend/src/lib/changelog.js` | Add changelog entry |
| `README.md` | Update |
| `specs/architecture/architecture_backend.md` | Update |
| `specs/architecture/architecture_frontend.md` | Update |
