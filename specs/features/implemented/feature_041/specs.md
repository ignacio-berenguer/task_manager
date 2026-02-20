# Technical Specifications — feature_041

## UI Improvements: LTP Modal, Drawer Fix, Delete Guard, Global Search, Report Defaults, New Reports

---

## 1. Search Page — LTP Quick Edit Modal

### Overview
Add a button on each row in the Search page grid that opens a modal showing all LTPs for that initiative with full CRUD capability.

### Frontend

**New Component: `LtpModal.jsx`** (`frontend/src/features/search/components/LtpModal.jsx`)
- A dialog/modal that receives a `portfolioId` prop
- On open, fetches LTPs via `GET /ltp/portfolio/{portfolio_id}`
- Displays LTPs in a table with columns: Responsable, Tarea, Siguiente Accion, Estado, Comentarios
- Each row has Edit (pencil) and Delete (trash) action buttons
- A "New LTP" button at the top creates a new record with `portfolio_id` pre-filled
- CRUD operations go through `transacciones_json` (same pattern as `EntityFormModal`)

**Integration Point: `DataGrid.jsx`**
- Add a new column icon (e.g., `ListTodo` from lucide-react) next to the existing drawer icon
- Clicking it opens the `LtpModal` for that row's `portfolio_id`
- State management in `SearchPage.jsx`: `ltpModalData = { isOpen, portfolioId }`

**CRUD Flow (via transacciones_json)**
- Reuse `EntityFormModal` for create/edit within the LTP modal, or embed a simpler inline form
- Entity name: `"ltp"`, primary key: `{ id: record.id }` for update/delete, `{ portfolio_id }` for create
- Fields: `responsable`, `tarea` (longtext), `siguiente_accion` (longtext), `estado` (parametric), `comentarios` (longtext)
- On success: refetch LTPs for the portfolio_id, optionally refetch search results

### Backend
No backend changes needed — existing endpoints suffice:
- `GET /ltp/portfolio/{portfolio_id}` — fetch LTPs
- `POST /transacciones-json/` + `POST /transacciones-json/process` — CRUD operations

---

## 2. LTP Side Drawer — Fix Top Section Data

### Root Cause
`InitiativeDrawer.jsx` (line 104-111) reads top section fields directly from `rowData`:
- `rowData.origen`, `rowData.digital_framework_level_1`, `rowData.estado_de_la_iniciativa`, `rowData.priorizacion`, `rowData.cluster`, `rowData.fecha_de_estado_de_la_iniciativa`

When the drawer is opened from the **Search page**, `rowData` comes from `datos_relevantes` search results, which includes all these fields.

When the drawer is opened from a **Report page** (LTPs, Acciones, etc.), `rowData` only contains the report-specific fields (e.g., tarea, siguiente_accion, estado). The initiative-level fields are missing, so the top section shows dashes.

### Fix
Once `portfolioData` is loaded (from `GET /portfolio/{portfolioId}`), use it to populate the top section fields as a fallback:

```javascript
const initiativeData = portfolioData?.datos_descriptivos?.[0] || {}
const iniciativaData = portfolioData?.iniciativas?.[0] || {}

const fields = [
  { label: 'Origen', value: rowData.origen || initiativeData.origen },
  { label: 'Digital Framework', value: rowData.digital_framework_level_1 || initiativeData.digital_framework_level_1 },
  { label: 'Estado', value: rowData.estado_de_la_iniciativa || iniciativaData.estado_de_la_iniciativa, isEstado: true },
  { label: 'Priorizacion', value: rowData.priorizacion || iniciativaData.prioridad_descriptiva },
  { label: 'Cluster', value: rowData.cluster || initiativeData.cluster },
  { label: 'Fecha Estado', value: formatDate(rowData.fecha_de_estado_de_la_iniciativa || iniciativaData.fecha_de_ultimo_estado) },
]
```

Similarly, use `portfolioData` for `nombre` and `importeValue` as fallbacks.

### Scope Check
This issue affects all report pages that use `showDrawer: true`:
- LTPs report (`LTPsReportPage`) — currently affected
- Acciones report (`AccionesReportPage`) — currently affected (has `estado_de_la_iniciativa` via join, but missing other fields)
- Any new report pages with `showDrawer: true`

The fix is centralized in `InitiativeDrawer.jsx`, so it handles all cases.

---

## 3. Datos Descriptivos — Disable Delete

### Frontend
**`DetailPage.jsx`**: The `EntityFormModal` for datos_descriptivos is opened in edit mode. The modal shows a delete button in edit mode. Solution: pass a `disableDelete={true}` prop to `EntityFormModal` when `entityName === "datos_descriptivos"`.

**`EntityFormModal.jsx`**: Accept a new `disableDelete` prop (default `false`). When `true`, hide the "Eliminar" button in the footer.

### Backend
**`datos_descriptivos.py`**: Add a guard to the delete endpoint that returns HTTP 403 with message "Delete operation is not permitted for Datos Descriptivos records." Keep the existing logic but prevent execution.

```python
@router.delete("/{id}")
def delete_datos_descriptivo(id: int, db: Session = Depends(get_db)):
    """Delete operation disabled for datos_descriptivos."""
    raise HTTPException(
        status_code=403,
        detail="Delete operation is not permitted for Datos Descriptivos records."
    )
```

---

## 4. Global Search in Top Menu Bar

### Frontend

**New Component: `GlobalSearch.jsx`** (`frontend/src/components/layout/GlobalSearch.jsx`)
- A search icon button in the Navbar
- Clicking it (or pressing `Ctrl+Shift+F`) opens a command-palette-style overlay/dropdown
- Input field with debounced search (300ms)
- Calls `POST /datos-relevantes/search` with filters:
  ```json
  {
    "filters": [
      { "field": "portfolio_id", "operator": "ilike", "value": "%query%" }
    ],
    "limit": 10
  }
  ```
  AND a second filter set for nombre:
  ```json
  {
    "filters": [
      { "field": "nombre", "operator": "ilike", "value": "%query%" }
    ],
    "limit": 10
  }
  ```
  OR use a single request combining with OR logic if the search API supports it. Since the current search API uses AND logic for filters, two parallel requests are needed, then merge/deduplicate results.

- Results list shows: `portfolio_id` (monospace) + `nombre` (truncated)
- Selecting a result navigates to `/detail/:portfolio_id`
- Keyboard navigation: Arrow Up/Down to navigate, Enter to select, Escape to close
- Click outside to close

**Integration: `Navbar.jsx`**
- Add the `GlobalSearch` component in the right-side area, before `ModeToggle`
- Pass it to both desktop and mobile views

**Keyboard Shortcut**
- `useEffect` with global `keydown` listener for `Ctrl+Shift+F`
- Prevent default browser behavior (browser search)
- Toggle open/close of the search overlay

### Backend
No backend changes needed — uses existing `POST /datos-relevantes/search` endpoint.

---

## 5. Informe LTPs — Default Estado Filter

### Change
In `LTPsReportPage.jsx`, change:
```javascript
const DEFAULT_FILTERS = {
  responsable: [],
  estado: [],
}
```
To:
```javascript
const DEFAULT_FILTERS = {
  responsable: [],
  estado: ['Pendiente'],
}
```

### localStorage Precedence
The `GenericReportPage` uses `useState(defaultFilters)` for initial state. The `useReportPreferences` hook handles column preferences via localStorage, but filters are initialized from `defaultFilters` each time. If localStorage filter persistence is desired, the `useReportPreferences` hook would need extension. For now, since no report persists filters to localStorage, the default simply applies on every fresh load, which matches the requirement.

---

## 6. New Report Pages

### 6.1 Backend — New Report Endpoints

Each of the 4 entities (justificaciones, dependencias, descripciones, notas) needs:

#### A. Report Request Schemas (`schemas.py`)

```python
class JustificacionesReportRequest(BaseModel):
    portfolio_id: str | None = None
    tipo_justificacion: list[str] = []
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)

class DependenciasReportRequest(BaseModel):
    portfolio_id: str | None = None
    descripcion_dependencia: str | None = None
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)

class DescripcionesReportRequest(BaseModel):
    portfolio_id: str | None = None
    tipo_descripcion: list[str] = []
    order_by: str | None = "portfolio_id"
    order_dir: Literal["asc", "desc"] = "asc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)

class NotasReportRequest(BaseModel):
    portfolio_id: str | None = None
    registrado_por: list[str] = []
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    order_by: str | None = "fecha"
    order_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0, ge=0)
```

#### B. Router Modifications

Each router needs to be converted from the simple `router_factory` pattern to a custom router (like `acciones.py` or `etiquetas.py`) with:

1. **Filter options endpoint**: `GET /report-{entity}-filter-options`
   - Queries distinct values for dropdown filter fields
   - Returns `{ field_name: [values] }`

2. **Report search endpoint**: `POST /search-report-{entity}`
   - Joins with `DatosDescriptivo` to include `nombre`
   - Applies filters from request
   - Returns `PaginatedResponse`

3. **Existing CRUD endpoints**: Moved from router_factory, keeping same behavior
   - `GET /`, `GET /{id}`, `GET /portfolio/{portfolio_id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`

**IMPORTANT**: Report endpoints must come BEFORE `/{id}` routes to avoid FastAPI route conflicts.

#### C. Specific Filter Options per Entity

| Entity | Filter Options |
|--------|---------------|
| Justificaciones | `tipo_justificacion` (distinct values) |
| Dependencias | (no dropdown filters — only text search) |
| Descripciones | `tipo_descripcion` (distinct values) |
| Notas | `registrado_por` (distinct values) |

### 6.2 Frontend — New Report Page Components

Each report page follows the `GenericReportPage` pattern (like `EtiquetasReportPage.jsx`).

#### A. Informe Justificaciones (`JustificacionesReportPage.jsx`)

| Config | Value |
|--------|-------|
| Icon | `Scale` (lucide-react) |
| Endpoint | `/justificaciones/search-report-justificaciones` |
| Filter Options | `/justificaciones/report-justificaciones-filter-options` |
| Storage Prefix | `justificaciones` |
| showDrawer | `true` |

**Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| portfolio_id | Portfolio ID | text | Justificaciones (por defecto) |
| nombre | Nombre | text | Justificaciones (por defecto) |
| tipo_justificacion | Tipo | text | Justificaciones (por defecto) |
| valor | Valor | longtext | Justificaciones (por defecto) |
| comentarios | Comentarios | longtext | Justificaciones (por defecto) |

**Additional Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| id | ID | number | Adicional |
| fecha_modificacion | Fecha Modificacion | date | Adicional |
| origen_registro | Origen Registro | text | Adicional |

**Filters:**
- `portfolioId` — text input
- `tipoJustificacion` — multiselect from filter options

**Default Sort:** `{ field: 'portfolio_id', direction: 'asc' }`

#### B. Informe Dependencias (`DependenciasReportPage.jsx`)

| Config | Value |
|--------|-------|
| Icon | `GitBranch` (lucide-react) |
| Endpoint | `/dependencias/search-report-dependencias` |
| Filter Options | `/dependencias/report-dependencias-filter-options` |
| Storage Prefix | `dependencias` |
| showDrawer | `true` |

**Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| portfolio_id | Portfolio ID | text | Dependencias (por defecto) |
| nombre | Nombre | text | Dependencias (por defecto) |
| descripcion_dependencia | Dependencia | longtext | Dependencias (por defecto) |
| fecha_dependencia | Fecha | date | Dependencias (por defecto) |
| comentarios | Comentarios | longtext | Dependencias (por defecto) |

**Additional Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| id | ID | number | Adicional |

**Filters:**
- `portfolioId` — text input
- `descripcionDependencia` — text input (free text search)

**Default Sort:** `{ field: 'portfolio_id', direction: 'asc' }`

#### C. Informe Descripciones (`DescripcionesReportPage.jsx`)

| Config | Value |
|--------|-------|
| Icon | `FileText` (lucide-react) |
| Endpoint | `/descripciones/search-report-descripciones` |
| Filter Options | `/descripciones/report-descripciones-filter-options` |
| Storage Prefix | `descripciones` |
| showDrawer | `true` |

**Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| portfolio_id | Portfolio ID | text | Descripciones (por defecto) |
| nombre | Nombre | text | Descripciones (por defecto) |
| tipo_descripcion | Tipo | text | Descripciones (por defecto) |
| descripcion | Descripcion | longtext | Descripciones (por defecto) |

**Additional Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| id | ID | number | Adicional |
| fecha_modificacion | Fecha Modificacion | date | Adicional |
| origen_registro | Origen Registro | text | Adicional |
| comentarios | Comentarios | longtext | Adicional |

**Filters:**
- `portfolioId` — text input
- `tipoDescripcion` — multiselect from filter options

**Default Sort:** `{ field: 'portfolio_id', direction: 'asc' }`

#### D. Informe Notas (`NotasReportPage.jsx`)

| Config | Value |
|--------|-------|
| Icon | `StickyNote` (lucide-react) |
| Endpoint | `/notas/search-report-notas` |
| Filter Options | `/notas/report-notas-filter-options` |
| Storage Prefix | `notas` |
| showDrawer | `true` |

**Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| portfolio_id | Portfolio ID | text | Notas (por defecto) |
| nombre | Nombre | text | Notas (por defecto) |
| registrado_por | Autor | text | Notas (por defecto) |
| fecha | Fecha | date | Notas (por defecto) |
| nota | Nota | longtext | Notas (por defecto) |

**Additional Columns:**
| ID | Label | Type | Category |
|----|-------|------|----------|
| id | ID | number | Adicional |

**Filters:**
- `portfolioId` — text input
- `registradoPor` — multiselect from filter options
- `fechaInicio` — date input
- `fechaFin` — date input

**Default Sort:** `{ field: 'fecha', direction: 'desc' }`

### 6.3 Frontend — Routes & Navigation

**`App.jsx`** — Add 4 new lazy-loaded routes:
```javascript
const JustificacionesReportPage = lazy(() => import('@/features/reports/JustificacionesReportPage'))
const DependenciasReportPage = lazy(() => import('@/features/reports/DependenciasReportPage'))
const DescripcionesReportPage = lazy(() => import('@/features/reports/DescripcionesReportPage'))
const NotasReportPage = lazy(() => import('@/features/reports/NotasReportPage'))

// Inside Routes:
<Route path="/informes/justificaciones" element={<ErrorBoundary><JustificacionesReportPage /></ErrorBoundary>} />
<Route path="/informes/dependencias" element={<ErrorBoundary><DependenciasReportPage /></ErrorBoundary>} />
<Route path="/informes/descripciones" element={<ErrorBoundary><DescripcionesReportPage /></ErrorBoundary>} />
<Route path="/informes/notas" element={<ErrorBoundary><NotasReportPage /></ErrorBoundary>} />
```

**`Navbar.jsx`** — Add 4 new items to `informesItems` array:
```javascript
{ name: 'Justificaciones', href: '/informes/justificaciones', icon: Scale },
{ name: 'Dependencias', href: '/informes/dependencias', icon: GitBranch },
{ name: 'Descripciones', href: '/informes/descripciones', icon: FileText },
{ name: 'Notas', href: '/informes/notas', icon: StickyNote },
```

---

## Files Modified (Summary)

### Backend
| File | Changes |
|------|---------|
| `backend/app/schemas.py` | Add 4 new report request schemas |
| `backend/app/routers/justificaciones.py` | Convert from factory to custom router with report endpoints |
| `backend/app/routers/dependencias.py` | Convert from factory to custom router with report endpoints |
| `backend/app/routers/descripciones.py` | Convert from factory to custom router with report endpoints |
| `backend/app/routers/notas.py` | Convert from factory to custom router with report endpoints |
| `backend/app/routers/datos_descriptivos.py` | Add delete guard (HTTP 403) |

### Frontend
| File | Changes |
|------|---------|
| `frontend/src/features/search/components/LtpModal.jsx` | **New** — LTP CRUD modal for Search page |
| `frontend/src/features/search/SearchPage.jsx` | Add LTP modal state and integration |
| `frontend/src/features/search/components/DataGrid.jsx` | Add LTP icon column |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Use portfolioData fallback for top section |
| `frontend/src/features/detail/components/EntityFormModal.jsx` | Add `disableDelete` prop |
| `frontend/src/features/detail/DetailPage.jsx` | Pass `disableDelete` for datos_descriptivos modal |
| `frontend/src/components/layout/GlobalSearch.jsx` | **New** — Global search component |
| `frontend/src/components/layout/Navbar.jsx` | Add GlobalSearch + 4 new report menu items |
| `frontend/src/features/reports/LTPsReportPage.jsx` | Change default estado filter |
| `frontend/src/features/reports/JustificacionesReportPage.jsx` | **New** — Report page |
| `frontend/src/features/reports/DependenciasReportPage.jsx` | **New** — Report page |
| `frontend/src/features/reports/DescripcionesReportPage.jsx` | **New** — Report page |
| `frontend/src/features/reports/NotasReportPage.jsx` | **New** — Report page |
| `frontend/src/App.jsx` | Add 4 new lazy routes |
| `frontend/src/lib/version.js` | Version bump |
| `frontend/src/lib/changelog.js` | Changelog entry |
