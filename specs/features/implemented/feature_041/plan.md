# Implementation Plan — feature_041

## UI Improvements: LTP Modal, Drawer Fix, Delete Guard, Global Search, Report Defaults, New Reports

---

## Phase 1: Quick Fixes (Low Risk, Independent)

### Step 1.1 — Fix InitiativeDrawer Top Section
**Files:** `frontend/src/components/shared/InitiativeDrawer.jsx`

1. After `portfolioData` is loaded, extract initiative data:
   ```javascript
   const initiativeData = portfolioData?.datos_descriptivos?.[0] || {}
   const iniciativaData = portfolioData?.iniciativas?.[0] || {}
   ```
2. Update the `fields` array to use fallback from `portfolioData`:
   - `origen`: `rowData.origen || initiativeData.origen`
   - `digital_framework_level_1`: `rowData.digital_framework_level_1 || initiativeData.digital_framework_level_1`
   - `estado_de_la_iniciativa`: `rowData.estado_de_la_iniciativa || iniciativaData.estado_de_la_iniciativa`
   - `priorizacion`: `rowData.priorizacion || iniciativaData.prioridad_descriptiva`
   - `cluster`: `rowData.cluster || initiativeData.cluster`
   - `fecha_de_estado_de_la_iniciativa`: `rowData.fecha_de_estado_de_la_iniciativa || iniciativaData.fecha_de_ultimo_estado`
3. Also add fallbacks for `nombre` (in header) and `importeValue` from portfolioData
4. Re-render the fields section when `portfolioData` changes (move fields into a useMemo or compute inside render after portfolioData loads)

**Validation:** Open drawer from LTPs report page → top section should show actual initiative data instead of dashes.

### Step 1.2 — LTP Report Default Estado Filter
**Files:** `frontend/src/features/reports/LTPsReportPage.jsx`

1. Change `DEFAULT_FILTERS`:
   ```javascript
   const DEFAULT_FILTERS = {
     responsable: [],
     estado: ['Pendiente'],
   }
   ```

**Validation:** Open LTP report → Estado filter pre-selected with "Pendiente", only Pendiente LTPs shown initially.

### Step 1.3 — Disable Delete for Datos Descriptivos

**Frontend files:**
- `frontend/src/features/detail/components/EntityFormModal.jsx` — Add `disableDelete` prop, conditionally hide delete button
- `frontend/src/features/detail/DetailPage.jsx` — Pass `disableDelete={true}` to the datos_descriptivos `EntityFormModal`

**Backend files:**
- `backend/app/routers/datos_descriptivos.py` — Override delete endpoint with HTTP 403 response

**Steps:**
1. In `EntityFormModal.jsx`: Accept `disableDelete` prop (default `false`), add condition: `{isEdit && !disableDelete && (<AlertDialog>...</AlertDialog>)}`
2. In `DetailPage.jsx`: Find the `EntityFormModal` for datos_descriptivos and add `disableDelete` prop
3. In `datos_descriptivos.py`: Replace or guard the delete endpoint with 403 response

**Validation:** Open detail page → Edit datos descriptivos → No delete button visible. Direct API call to DELETE returns 403.

---

## Phase 2: Global Search

### Step 2.1 — Create GlobalSearch Component
**Files:** `frontend/src/components/layout/GlobalSearch.jsx` (new)

1. Create component with:
   - Search icon button (`Search` from lucide-react)
   - State: `isOpen`, `query`, `results`, `selectedIndex`
   - When opened: render a fixed overlay with input + results dropdown
   - Debounced search (300ms) via `useCallback` + `setTimeout`
   - API: Two parallel calls to `POST /datos-relevantes/search`:
     - Filter 1: `{ field: "portfolio_id", operator: "ilike", value: "%query%" }`
     - Filter 2: `{ field: "nombre", operator: "ilike", value: "%query%" }`
   - Merge and deduplicate results by `portfolio_id`
   - Display each result as: `portfolio_id` (mono) — `nombre` (truncated)
   - Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close
   - Click on result → `navigate('/detail/${portfolio_id}')` and close
   - Click outside → close

2. Global keyboard shortcut (`Ctrl+Shift+F`):
   - `useEffect` with `keydown` listener on `document`
   - Check `e.ctrlKey && e.shiftKey && e.key === 'F'`
   - `e.preventDefault()` to avoid browser search
   - Toggle `isOpen`

### Step 2.2 — Integrate into Navbar
**Files:** `frontend/src/components/layout/Navbar.jsx`

1. Import `GlobalSearch`
2. Add `<GlobalSearch />` in the right-side area (before `<ModeToggle />`)
3. Wrapped in `<SignedIn>` so it only appears for authenticated users

**Validation:** From any page, press Ctrl+Shift+F → search overlay opens. Type a portfolio ID → results appear. Click result → navigate to detail page.

---

## Phase 3: Backend Report Endpoints (4 New Reports)

### Step 3.1 — Add Report Request Schemas
**Files:** `backend/app/schemas.py`

Add 4 new Pydantic schemas:
- `JustificacionesReportRequest`
- `DependenciasReportRequest`
- `DescripcionesReportRequest`
- `NotasReportRequest`

### Step 3.2 — Convert Justificaciones Router
**Files:** `backend/app/routers/justificaciones.py`

Convert from `router_factory` to custom router:
1. Import required modules (APIRouter, Depends, HTTPException, Session, models, schemas, crud)
2. Create `APIRouter(prefix="/justificaciones", tags=["Justificaciones"])`
3. Add standard CRUD endpoints (copy pattern from `etiquetas.py`)
4. Add `GET /report-justificaciones-filter-options`:
   - Query distinct `tipo_justificacion` values
5. Add `POST /search-report-justificaciones`:
   - Join `Justificacion` with `DatosDescriptivo` for `nombre`
   - Apply filters: `portfolio_id`, `tipo_justificacion` (IN), `fecha_modificacion` range
   - Paginate and return
6. **Route ordering**: filter-options and search-report BEFORE `/{id}`

### Step 3.3 — Convert Dependencias Router
**Files:** `backend/app/routers/dependencias.py`

Convert from `router_factory` to custom router:
1. Add `GET /report-dependencias-filter-options`:
   - Return empty dict (no dropdown filters, text search only)
2. Add `POST /search-report-dependencias`:
   - Join `Dependencia` with `DatosDescriptivo` for `nombre`
   - Apply filters: `portfolio_id`, `descripcion_dependencia` (ilike)
   - Paginate and return

### Step 3.4 — Convert Descripciones Router
**Files:** `backend/app/routers/descripciones.py`

Convert from `router_factory` to custom router:
1. Add `GET /report-descripciones-filter-options`:
   - Query distinct `tipo_descripcion` values
2. Add `POST /search-report-descripciones`:
   - Join `Descripcion` with `DatosDescriptivo` for `nombre`
   - Apply filters: `portfolio_id`, `tipo_descripcion` (IN)
   - Paginate and return

### Step 3.5 — Convert Notas Router
**Files:** `backend/app/routers/notas.py`

Convert from `router_factory` to custom router:
1. Add `GET /report-notas-filter-options`:
   - Query distinct `registrado_por` values
2. Add `POST /search-report-notas`:
   - Join `Nota` with `DatosDescriptivo` for `nombre`
   - Apply filters: `portfolio_id`, `registrado_por` (IN), `fecha` range
   - Paginate and return

---

## Phase 4: Frontend Report Pages (4 New Reports)

### Step 4.1 — Create JustificacionesReportPage
**Files:** `frontend/src/features/reports/JustificacionesReportPage.jsx` (new)

Follow `EtiquetasReportPage.jsx` pattern:
1. Define `REPORT_COLUMNS`, `ADDITIONAL_COLUMNS`, `DEFAULT_COLUMN_IDS`
2. Define `DEFAULT_FILTERS`, `FILTER_DEFS`
3. Define `buildRequestBody` function
4. Export default component with `GenericReportPage` config (showDrawer: true)

### Step 4.2 — Create DependenciasReportPage
**Files:** `frontend/src/features/reports/DependenciasReportPage.jsx` (new)

Same pattern. Filters: portfolio_id (text), descripcion_dependencia (text).

### Step 4.3 — Create DescripcionesReportPage
**Files:** `frontend/src/features/reports/DescripcionesReportPage.jsx` (new)

Same pattern. Filters: portfolio_id (text), tipo_descripcion (multiselect).

### Step 4.4 — Create NotasReportPage
**Files:** `frontend/src/features/reports/NotasReportPage.jsx` (new)

Same pattern. Filters: portfolio_id (text), registrado_por (multiselect), fecha range (2 date inputs).

### Step 4.5 — Add Routes and Navigation
**Files:**
- `frontend/src/App.jsx` — Add 4 lazy imports + 4 routes
- `frontend/src/components/layout/Navbar.jsx` — Add 4 items to `informesItems` array

1. Add lazy imports for all 4 new report pages
2. Add routes inside the protected route block (after existing report routes)
3. Add menu items to `informesItems` with appropriate icons

---

## Phase 5: Search Page LTP Modal

### Step 5.1 — Create LtpModal Component
**Files:** `frontend/src/features/search/components/LtpModal.jsx` (new)

1. Component receives `isOpen`, `onClose`, `portfolioId`
2. Fetch LTPs on open: `GET /ltp/portfolio/{portfolioId}`
3. Display table with columns: Responsable, Tarea, Siguiente Accion, Estado, Comentarios
4. Action buttons per row: Edit (pencil), Delete (trash)
5. "Add LTP" button that opens a create sub-form
6. For Create/Edit/Delete: embed `EntityFormModal` from detail feature
   - Import `EntityFormModal` from `@/features/detail/components/EntityFormModal`
   - Import field config from detail feature or define inline
   - CRUD goes through `transacciones_json` system
7. On success: refetch LTPs via the API

### Step 5.2 — Integrate into Search Page
**Files:**
- `frontend/src/features/search/SearchPage.jsx` — Add LTP modal state
- `frontend/src/features/search/components/DataGrid.jsx` — Add LTP icon column

1. In `SearchPage.jsx`:
   - Add state: `const [ltpModalData, setLtpModalData] = useState({ isOpen: false, portfolioId: null })`
   - Add handlers: `handleOpenLtpModal(portfolioId)`, `handleCloseLtpModal()`
   - Render `<LtpModal />` component
   - Pass `onOpenLtpModal` to `DataGrid`

2. In `DataGrid.jsx`:
   - Add a new column (after drawer column) with `ListTodo` icon
   - Click triggers `onOpenLtpModal(row.portfolio_id)`

**Validation:** Click LTP icon on a search result row → modal opens with LTPs for that initiative. Create/Edit/Delete operations work correctly.

---

## Phase 6: Post-Implementation

### Step 6.1 — Version & Changelog
**Files:**
- `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to 41
- `frontend/src/lib/changelog.js` — Add entry at TOP of `CHANGELOG` array

### Step 6.2 — Documentation Updates
**Files:**
- `README.md` — Update routes table, report list, new components
- `specs/architecture/architecture_backend.md` — Document new report endpoints
- `specs/architecture/architecture_frontend.md` — Document new components and routes

### Step 6.3 — Build Verification
```bash
cd frontend && npm run build
```

### Step 6.4 — Close Feature
```
/close_feature feature_041
```

---

## Implementation Order Rationale

1. **Phase 1 (Quick Fixes)** — Three independent, low-risk changes that can be verified immediately
2. **Phase 2 (Global Search)** — Independent feature, no dependencies on other phases
3. **Phase 3 (Backend Reports)** — Must come before Phase 4 (frontend needs API endpoints)
4. **Phase 4 (Frontend Reports)** — Depends on Phase 3 backend endpoints
5. **Phase 5 (LTP Modal)** — Most complex feature, saved for last to avoid blocking other work
6. **Phase 6 (Post-Implementation)** — Version bump, docs, build check
