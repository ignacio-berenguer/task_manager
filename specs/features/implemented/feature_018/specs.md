# Feature 018: Informes - Hechos, LTPs, Acciones, Etiquetas, Transacciones

## 1. Overview

This feature expands the reporting system from a single "Iniciativas Cambiadas" report to a comprehensive set of five reports under the "Informes" menu. The changes include:

1. **Rename "Iniciativas Cambiadas" to "Hechos"** - Both frontend display name and backend API endpoints
2. **Add "Estado del Hecho" filter** to the Hechos report
3. **New "LTPs" report** - Pending tasks with responsable/estado filters and configurable columns
4. **New "Acciones" report** - Actions with siguiente_accion/estado filters and configurable columns
5. **New "Etiquetas" report** - Tags with portfolio_id/nombre/etiqueta filters and configurable columns
6. **New "Transacciones" report** - Audit trail with portfolio_id/estado_cambio/fecha/id filters and configurable columns
7. **Document filter behavior conventions** in architecture_frontend.md

---

## 2. Requirement 1: Rename "Iniciativas Cambiadas" to "Hechos"

### 2.1 Frontend Changes

| Current | New |
|---------|-----|
| Nav item: "Iniciativas Cambiadas" | "Hechos" |
| Route: `/informes/iniciativas-cambiadas` | `/informes/hechos` |
| Page title: "Iniciativas Cambiadas en el Periodo" | "Hechos" |

### 2.2 Backend API Changes

| Current Endpoint | New Endpoint |
|-----------------|-------------|
| `GET /api/v1/hechos/report01-filter-options` | `GET /api/v1/hechos/report-hechos-filter-options` |
| `POST /api/v1/hechos/search-report01` | `POST /api/v1/hechos/search-report-hechos` |

The Pydantic schema `HechosReport01Request` will be renamed to `HechosReportRequest`.

### 2.3 Frontend Hook/API Changes

- `useReportSearch.js`: Update endpoint from `/hechos/search-report01` to `/hechos/search-report-hechos`
- `useReportFilterOptions.js`: Update endpoint from `/hechos/report01-filter-options` to `/hechos/report-hechos-filter-options`

---

## 3. Requirement 2: Add "Estado del Hecho" Filter to Hechos Report

### 3.1 New Filter

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Estado del Hecho | Multi-Select | Distinct `estado` values from `hechos` table | Filter on hechos.estado |

### 3.2 Backend Changes

**Filter options endpoint** (`GET /api/v1/hechos/report-hechos-filter-options`):
- Add `estado` field to the response: distinct non-null, non-empty values from `hechos.estado`, ordered alphabetically

**Response** (updated):
```json
{
  "digital_framework_level_1": [...],
  "unidad": [...],
  "cluster": [...],
  "tipo": [...],
  "estado": [...]
}
```

**Search endpoint** (`POST /api/v1/hechos/search-report-hechos`):
- Add `estado: list[str] = []` field to the request schema
- If non-empty, apply `hechos.estado IN (...)` filter

**Updated request schema** (`HechosReportRequest`):
```python
class HechosReportRequest(BaseModel):
    fecha_inicio: str
    fecha_fin: str
    digital_framework_level_1: list[str] = []
    unidad: list[str] = []
    cluster: list[str] = []
    tipo: list[str] = []
    estado: list[str] = []          # NEW
    order_by: str | None = "fecha"
    order_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

### 3.3 Frontend Changes

- Add "Estado del Hecho" multi-select to `ReportFilterPanel.jsx`
- Update `buildRequestBody()` to include `estado` array
- Update `useReportFilterOptions.js` response handling to include `estado`

---

## 4. Requirement 3: LTPs Report

### 4.1 Route

- **Path:** `/informes/ltps`
- **Access:** Protected (authenticated users only)
- **Page title:** "LTPs"

### 4.2 Filter Criteria

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Responsable | Multi-Select | Distinct `responsable` from `ltp` | ltp.responsable IN (...) |
| Estado | Multi-Select | Distinct `estado` from `ltp` | ltp.estado IN (...) |

### 4.3 Backend Endpoints

**New endpoint:** `GET /api/v1/ltp/report-ltps-filter-options`

**Response:**
```json
{
  "responsable": ["Person1", "Person2", ...],
  "estado": ["Active", "Pending", ...]
}
```

**New endpoint:** `POST /api/v1/ltp/search-report-ltps`

**Request schema** (`LTPReportRequest`):
```python
class LTPReportRequest(BaseModel):
    responsable: list[str] = []
    estado: list[str] = []
    order_by: str | None = "siguiente_accion"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

**Backend logic:**
1. Query `ltp` table with LEFT JOIN to `datos_descriptivos` on `portfolio_id` (to get `nombre`)
2. Apply optional filters on `ltp.responsable` and `ltp.estado`
3. Merge `nombre` from datos_descriptivos into each row
4. Return `PaginatedResponse`

**Response row example:**
```json
{
  "id": 1,
  "portfolio_id": "P001",
  "nombre": "Initiative Name",
  "responsable": "John",
  "tarea": "Long task description...",
  "siguiente_accion": "2026-03-01",
  "comentarios": "Long comments...",
  "estado": "Active",
  "fecha_creacion": "...",
  "fecha_actualizacion": "..."
}
```

### 4.4 Default Columns

| Column | Source | Type | Notes |
|--------|--------|------|-------|
| Portfolio ID | ltp.portfolio_id | link | Links to `/detail/{portfolio_id}` |
| Nombre | datos_descriptivos.nombre | text | From joined table |
| Tarea | ltp.tarea | longtext | Word-wrap |
| Siguiente Accion | ltp.siguiente_accion | date | DD/MM/YYYY format |
| Comentarios | ltp.comentarios | longtext | Word-wrap |
| Estado | ltp.estado | text | |

### 4.5 Additional Columns (available via column selector)

| Column | Source | Type |
|--------|--------|------|
| ID | ltp.id | number |
| Responsable | ltp.responsable | text |
| Fecha Creacion | ltp.fecha_creacion | date |
| Fecha Actualizacion | ltp.fecha_actualizacion | date |

### 4.6 Default Sort

- `siguiente_accion` ascending

---

## 5. Requirement 4: Acciones Report

### 5.1 Route

- **Path:** `/informes/acciones`
- **Access:** Protected (authenticated users only)
- **Page title:** "Acciones"

### 5.2 Filter Criteria

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Siguiente Accion (from) | Date Input | User input | acciones.siguiente_accion >= value |
| Siguiente Accion (to) | Date Input | User input | acciones.siguiente_accion <= value |
| Estado (de la iniciativa) | Multi-Select | Distinct `estado_de_la_iniciativa` from `iniciativas` | Filter on joined iniciativas.estado_de_la_iniciativa |

Note: "estado" here refers to the estado of the portfolio_id (i.e., `iniciativas.estado_de_la_iniciativa`), not a field on acciones itself.

### 5.3 Backend Endpoints

**New endpoint:** `GET /api/v1/acciones/report-acciones-filter-options`

**Response:**
```json
{
  "estado_de_la_iniciativa": ["Aprobada", "En Ejecucion", ...]
}
```

**New endpoint:** `POST /api/v1/acciones/search-report-acciones`

**Request schema** (`AccionesReportRequest`):
```python
class AccionesReportRequest(BaseModel):
    siguiente_accion_inicio: str | None = None
    siguiente_accion_fin: str | None = None
    estado_de_la_iniciativa: list[str] = []
    order_by: str | None = "siguiente_accion"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

**Backend logic:**
1. Query `acciones` table with LEFT JOIN to `datos_descriptivos` on `portfolio_id` (for `nombre`) and LEFT JOIN to `iniciativas` on `portfolio_id` (for `estado_de_la_iniciativa`)
2. Apply date range filter on `acciones.siguiente_accion`
3. Apply optional filter on `iniciativas.estado_de_la_iniciativa`
4. Merge `nombre` and `estado_de_la_iniciativa` into each row
5. Return `PaginatedResponse`

### 5.4 Default Columns

| Column | Source | Type | Notes |
|--------|--------|------|-------|
| Portfolio ID | acciones.portfolio_id | link | Links to `/detail/{portfolio_id}` |
| Nombre | datos_descriptivos.nombre | text | From joined table |
| Siguiente Accion | acciones.siguiente_accion | text | |
| Siguiente Accion Comentarios | acciones.siguiente_accion_comentarios | longtext | Word-wrap |
| Estado | iniciativas.estado_de_la_iniciativa | text | From joined table |

### 5.5 Additional Columns (available via column selector)

| Column | Source | Type |
|--------|--------|------|
| ID | acciones.id | number |
| Comentarios | acciones.comentarios | longtext |
| Fecha Creacion | acciones.fecha_creacion | date |
| Fecha Actualizacion | acciones.fecha_actualizacion | date |

### 5.6 Default Sort

- `siguiente_accion` ascending, then `portfolio_id` ascending

---

## 6. Requirement 5: Etiquetas Report

### 6.1 Route

- **Path:** `/informes/etiquetas`
- **Access:** Protected (authenticated users only)
- **Page title:** "Etiquetas"

### 6.2 Filter Criteria

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Portfolio ID | Text Input (combobox) | User input | etiquetas.portfolio_id = value |
| Nombre | Text Input | User input | datos_descriptivos.nombre ILIKE %value% |
| Etiqueta | Multi-Select | Distinct `etiqueta` from `etiquetas` | etiquetas.etiqueta IN (...) |

### 6.3 Backend Endpoints

**New endpoint:** `GET /api/v1/etiquetas/report-etiquetas-filter-options`

**Response:**
```json
{
  "etiqueta": ["Tag1", "Tag2", ...]
}
```

**New endpoint:** `POST /api/v1/etiquetas/search-report-etiquetas`

**Request schema** (`EtiquetasReportRequest`):
```python
class EtiquetasReportRequest(BaseModel):
    portfolio_id: str | None = None
    nombre: str | None = None
    etiqueta: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

**Backend logic:**
1. Query `etiquetas` table with LEFT JOIN to `datos_descriptivos` on `portfolio_id` (for `nombre`)
2. Apply optional filters:
   - `portfolio_id` exact match if provided
   - `nombre` ILIKE if provided
   - `etiqueta` IN if non-empty
3. Merge `nombre` into each row
4. Return `PaginatedResponse`

### 6.4 Default Columns

| Column | Source | Type | Notes |
|--------|--------|------|-------|
| Portfolio ID | etiquetas.portfolio_id | link | Links to `/detail/{portfolio_id}` |
| Nombre | datos_descriptivos.nombre | text | From joined table |
| Etiqueta | etiquetas.etiqueta | longtext | |
| Valor | etiquetas.valor | longtext | |
| Origen Registro | etiquetas.origen_registro | longtext | |
| Comentario | etiquetas.comentarios | longtext | |

### 6.5 Additional Columns (available via column selector)

| Column | Source | Type |
|--------|--------|------|
| ID | etiquetas.id | number |
| Fecha Modificacion | etiquetas.fecha_modificacion | date |
| Fecha Creacion | etiquetas.fecha_creacion | date |
| Fecha Actualizacion | etiquetas.fecha_actualizacion | date |

### 6.6 Default Sort

- `portfolio_id` ascending, then `etiqueta` ascending

---

## 7. Requirement 6: Transacciones Report

### 7.1 Route

- **Path:** `/informes/transacciones`
- **Access:** Protected (authenticated users only)
- **Page title:** "Transacciones"

### 7.2 Filter Criteria

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Portfolio ID (clave1) | Text Input (combobox) | User input | transacciones.clave1 = value |
| Estado Cambio | Multi-Select | Distinct `estado_cambio` from `transacciones` | transacciones.estado_cambio IN (...) |
| Fecha Registro Cambio (from) | Date Input | User input | transacciones.fecha_registro_cambio >= value |
| Fecha Registro Cambio (to) | Date Input | User input | transacciones.fecha_registro_cambio <= value |
| Fecha Ejecucion Cambio (from) | Date Input | User input | transacciones.fecha_ejecucion_cambio >= value |
| Fecha Ejecucion Cambio (to) | Date Input | User input | transacciones.fecha_ejecucion_cambio <= value |
| ID | Number Input | User input | transacciones.id = value |

### 7.3 Backend Endpoints

**New endpoint:** `GET /api/v1/transacciones/report-transacciones-filter-options`

**Response:**
```json
{
  "estado_cambio": ["EJECUTADO", "ERROR", "PENDIENTE", ...]
}
```

**New endpoint:** `POST /api/v1/transacciones/search-report-transacciones`

**Request schema** (`TransaccionesReportRequest`):
```python
class TransaccionesReportRequest(BaseModel):
    clave1: str | None = None
    estado_cambio: list[str] = []
    fecha_registro_cambio_inicio: str | None = None
    fecha_registro_cambio_fin: str | None = None
    fecha_ejecucion_cambio_inicio: str | None = None
    fecha_ejecucion_cambio_fin: str | None = None
    id_filter: int | None = None
    order_by: str | None = "id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

**Backend logic:**
1. Query `transacciones` table (no joins needed - standalone audit trail)
2. Apply optional filters:
   - `clave1` exact match if provided
   - `estado_cambio` IN if non-empty
   - Date range filters on `fecha_registro_cambio` and `fecha_ejecucion_cambio`
   - `id` exact match if provided
3. Return `PaginatedResponse`

### 7.4 Default Columns (all columns)

| Column | Source | Type | Notes |
|--------|--------|------|-------|
| ID | transacciones.id | number | |
| Clave1 (Portfolio ID) | transacciones.clave1 | link | Links to `/detail/{clave1}` |
| Clave2 | transacciones.clave2 | text | |
| Tabla | transacciones.tabla | text | |
| Campo Tabla | transacciones.campo_tabla | text | |
| Valor Nuevo | transacciones.valor_nuevo | longtext | |
| Tipo Cambio | transacciones.tipo_cambio | text | |
| Estado Cambio | transacciones.estado_cambio | text | |
| Fecha Registro Cambio | transacciones.fecha_registro_cambio | date | |
| Fecha Ejecucion Cambio | transacciones.fecha_ejecucion_cambio | date | |
| Valor Antes del Cambio | transacciones.valor_antes_del_cambio | longtext | |
| Comentarios | transacciones.comentarios | longtext | |
| Fecha Creacion | transacciones.fecha_creacion | date | |
| Fecha Actualizacion | transacciones.fecha_actualizacion | date | |

### 7.5 Default Sort

- `id` ascending

Note: The requirement mentioned "then etiqueta" for sort, but since this is the transacciones table, the secondary sort will be omitted as `id` is unique.

---

## 8. Filter Behavior Convention (for architecture_frontend.md)

All report filters across the application follow these conventions:

### 8.1 Multi-Select Filters

- **"Todos" option**: When all values are selected (or no specific values are selected), this is equivalent to "no filter" — the filter is not applied
- **Empty array = no filter**: On the API level, sending `[]` (empty array) means "do not filter on this field"
- **Conversion**: Frontend converts `['ALL']` or "Todos" selection to `[]` before sending to API
- **Options source**: Fetched from dedicated `*-filter-options` endpoints (distinct non-null, non-empty values, ordered alphabetically)
- **Display**: Uses `MultiSelect` component with checkboxes and search capability

### 8.2 Text Input Filters

- **Exact match**: Portfolio ID uses exact match (`=`)
- **Wildcard match**: Name/text fields use ILIKE (`%value%`)
- **Empty string = no filter**: Empty text inputs are not sent to the API

### 8.3 Date Range Filters

- **Format**: Frontend displays as `DD/MM/YYYY`, sends as `YYYY-MM-DD` (ISO 8601) to API
- **Inclusive**: Both start and end dates are inclusive (`>=` and `<=`)
- **Optional**: Both dates are optional; if omitted, that bound is not applied
- **Defaults**: Some reports have default date ranges (e.g., Hechos: first day of current month to today)

### 8.4 Filter Panel UX

- **Collapsible**: Filter panel is collapsible with active filter count badge
- **Keyboard shortcuts**: Enter key submits search, Ctrl+Shift+X clears all filters
- **Apply button**: "Buscar" button triggers the search
- **Clear button**: "Limpiar" button resets all filters to defaults
- **Auto-search on load**: Page executes search with default filters on initial load

### 8.5 Pagination & Sorting

- **Server-side**: All pagination and sorting is handled server-side
- **Page size**: Configurable (25, 50, 100, 200), default 50, persisted to localStorage
- **Sorting**: Click column header for ascending, click again for descending, click again to clear
- **Reset on filter/sort change**: Page resets to 1 when filters or sort config changes

---

## 9. Navigation Changes

### 9.1 Updated Informes Dropdown

| Item | Route | Icon |
|------|-------|------|
| Hechos | `/informes/hechos` | `ClipboardList` |
| LTPs | `/informes/ltps` | `ListTodo` |
| Acciones | `/informes/acciones` | `Zap` |
| Etiquetas | `/informes/etiquetas` | `Tags` |
| Transacciones | `/informes/transacciones` | `ArrowLeftRight` |

---

## 10. Frontend Architecture

### 10.1 Shared Report Infrastructure

To avoid code duplication across 5 report pages, create shared utilities:

**Shared report hooks:**
- `useReportData(config)` - Generic hook that handles search mutation, filter options fetching, and pagination state. Config specifies endpoints and default values.

**Shared report components:**
- Reuse existing `ReportFilterPanel`, `ReportColumnSelector` components with configurable props
- Each report page composes these shared components with report-specific configuration

### 10.2 Report Page Pattern

Each report page follows this structure:
1. Page title
2. Collapsible filter panel (report-specific filters)
3. Toolbar: Column selector + page size
4. Data table (TanStack Table) with sortable columns
5. Pagination

### 10.3 New Feature Directory Structure

```
frontend/src/features/reports/
├── ReportPage.jsx                          # Hechos report (renamed from "Iniciativas Cambiadas")
├── LTPsReportPage.jsx                     # LTPs report
├── AccionesReportPage.jsx                 # Acciones report
├── EtiquetasReportPage.jsx                # Etiquetas report
├── TransaccionesReportPage.jsx            # Transacciones report
├── index.js                               # Exports all report pages
├── components/
│   ├── ReportFilterPanel.jsx              # Existing, enhanced for reuse
│   ├── ReportColumnSelector.jsx           # Existing, reusable
│   └── GenericReportPage.jsx              # Optional: shared report layout component
├── hooks/
│   ├── useReportSearch.js                 # Existing, parameterized by endpoint
│   ├── useReportFilterOptions.js          # Existing, parameterized by endpoint
│   └── useReportPreferences.js            # Existing, parameterized by storage key prefix
└── utils/
    ├── reportColumnDefinitions.js         # Existing hechos columns
    ├── ltpColumnDefinitions.js            # LTP column definitions
    ├── accionesColumnDefinitions.js       # Acciones column definitions
    ├── etiquetasColumnDefinitions.js      # Etiquetas column definitions
    ├── transaccionesColumnDefinitions.js  # Transacciones column definitions
    └── reportStorage.js                   # Existing, extended with per-report keys
```

### 10.4 localStorage Keys

| Key | Report | Default |
|-----|--------|---------|
| `portfolio-report-hechos-columns` | Hechos | 12 default columns |
| `portfolio-report-hechos-page-size` | Hechos | 50 |
| `portfolio-report-ltps-columns` | LTPs | 6 default columns |
| `portfolio-report-ltps-page-size` | LTPs | 50 |
| `portfolio-report-acciones-columns` | Acciones | 5 default columns |
| `portfolio-report-acciones-page-size` | Acciones | 50 |
| `portfolio-report-etiquetas-columns` | Etiquetas | 6 default columns |
| `portfolio-report-etiquetas-page-size` | Etiquetas | 50 |
| `portfolio-report-transacciones-columns` | Transacciones | 14 default columns (all) |
| `portfolio-report-transacciones-page-size` | Transacciones | 50 |

Note: Existing keys (`portfolio-report-columns`, `portfolio-report-page-size`) will be migrated to `portfolio-report-hechos-*` for consistency.

---

## 11. API Changes Summary

| Method | Endpoint | Type | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/hechos/report-hechos-filter-options` | Renamed | Get filter options for Hechos report (was report01-filter-options) |
| POST | `/api/v1/hechos/search-report-hechos` | Renamed | Search for Hechos report (was search-report01) |
| GET | `/api/v1/ltp/report-ltps-filter-options` | New | Get filter options for LTPs report |
| POST | `/api/v1/ltp/search-report-ltps` | New | Search for LTPs report |
| GET | `/api/v1/acciones/report-acciones-filter-options` | New | Get filter options for Acciones report |
| POST | `/api/v1/acciones/search-report-acciones` | New | Search for Acciones report |
| GET | `/api/v1/etiquetas/report-etiquetas-filter-options` | New | Get filter options for Etiquetas report |
| POST | `/api/v1/etiquetas/search-report-etiquetas` | New | Search for Etiquetas report |
| GET | `/api/v1/transacciones/report-transacciones-filter-options` | New | Get filter options for Transacciones report |
| POST | `/api/v1/transacciones/search-report-transacciones` | New | Search for Transacciones report |

---

## 12. Dependencies

No new npm or Python packages are required. All functionality uses existing dependencies:
- Frontend: React, TanStack Table, TanStack Query, Lucide icons, Shadcn/ui components
- Backend: FastAPI, SQLAlchemy

---

## 13. Constraints

- Existing application functionality from previous versions must be maintained, except for the changes explicitly described in this feature
- Static routes MUST be defined before dynamic path parameter routes in FastAPI routers
- All UI text is in Spanish (no i18n library)
