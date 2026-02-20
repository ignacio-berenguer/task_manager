# Feature 038 — Implementation Plan

## Phase 1: EstadoTag Component (Foundation)

All other requirements depend on this component, so it's built first.

### Step 1.1: Create estado color mapping
- **File**: `frontend/src/lib/estadoColors.js`
- Define `ESTADO_COLORS` map: estado string → Tailwind class string (light + dark)
- Export `getEstadoColor(estado)` helper that returns the class for a given estado value (neutral gray for unknown)
- Follow the same pattern as `badgeColors.js`

### Step 1.2: Create EstadoTag component
- **File**: `frontend/src/components/shared/EstadoTag.jsx`
- Props: `value` (string), `className` (optional)
- Renders inline badge span with color from `getEstadoColor(value)`
- Null/empty → renders `"—"` as plain text
- Style: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` (same as TransactionBadge)

---

## Phase 2: Estado Tag Integration (Hechos, Etiquetas, LTP, Detail)

### Step 2.1: Add estado tag to SimpleTable
- **File**: `frontend/src/features/detail/components/SimpleTable.jsx`
- Add support for column `type: 'estado'` in cell rendering
- When `type === 'estado'`, render `<EstadoTag value={value} />` instead of plain text
- Import EstadoTag

### Step 2.2: Apply estado tag in Detail/Hechos
- **File**: `frontend/src/features/detail/components/sections/HechosSection.jsx`
- Change estado column type from `'text'` to `'estado'` in COLUMNS array

### Step 2.3: Add estado tag to GenericReportPage
- **File**: `frontend/src/features/reports/components/GenericReportPage.jsx`
- In the standard table cell rendering, add a case for `type === 'estado'` → render `<EstadoTag value={value} />`
- In the `CollapsibleRow` cell rendering, also support `type: 'estado'` rendering via EstadoTag (in addition to existing badgeColumns)
- Import EstadoTag

### Step 2.4: Apply estado tag in Hechos report
- **File**: `frontend/src/features/reports/utils/reportColumnDefinitions.js`
- Change the `estado` column type from `'text'` to `'estado'`

### Step 2.5: Apply estado tag in LTP report
- **File**: `frontend/src/features/reports/LTPsReportPage.jsx`
- Change the `estado` column type from `'text'` to `'estado'`

### Step 2.6: Add estado column to Etiquetas report (backend)
- **File**: `backend/app/routers/etiquetas.py`
- In `search-report-etiquetas` endpoint, join `DatosRelevante` (or `DatosDescriptivo`) to get `estado_de_la_iniciativa`
- Include `estado_de_la_iniciativa` in the response data

### Step 2.7: Add estado column to Etiquetas report (frontend)
- **File**: `frontend/src/features/reports/EtiquetasReportPage.jsx`
- Add `{ id: 'estado_de_la_iniciativa', label: 'Estado Iniciativa', type: 'estado', category: 'Portfolio' }` to ADDITIONAL_COLUMNS
- This makes it available via ColumnConfigurator but not shown by default

---

## Phase 3: Hechos Report — Side Drawer

### Step 3.1: Move InitiativeDrawer to shared
- **File**: Create `frontend/src/components/shared/InitiativeDrawer.jsx` (copy from `features/search/components/InitiativeDrawer.jsx`)
- Delete the original file
- **File**: `frontend/src/features/search/SearchPage.jsx` — update import path to `@/components/shared/InitiativeDrawer`

### Step 3.2: Add drawer to Hechos report
- **File**: `frontend/src/features/reports/ReportPage.jsx`
- Add state: `const [drawerData, setDrawerData] = useState({ isOpen: false, rowData: null })`
- Add `handleOpenDrawer(portfolioId)` callback — finds row in results.data, sets drawerData
- Add `handleCloseDrawer()` callback — resets drawerData
- Add a clickable icon button (PanelRightOpen) in the portfolio_id cell or as a separate actions column
- Render `<InitiativeDrawer isOpen={drawerData.isOpen} onClose={handleCloseDrawer} rowData={drawerData.rowData} />` at bottom of component

---

## Phase 4: Hechos Report — Expandable Rows

### Step 4.1: Add expansion logic to ReportPage
- **File**: `frontend/src/features/reports/ReportPage.jsx`
- Add state: `const [expandedRowId, setExpandedRowId] = useState(null)`
- Add toggle function: click row → expand/collapse
- Add chevron column as first column (ChevronRight/ChevronDown icons)
- Each row is clickable to toggle expansion

### Step 4.2: Render expanded detail panel
- **File**: `frontend/src/features/reports/ReportPage.jsx`
- When a row is expanded, render a `<tr>` below it with `<td colSpan={...}>`
- Show all hecho fields not visible in the current columns:
  - Iterate over ALL hecho fields (partida_presupuestaria, importe, estado, importe_ri, importe_re, notas, racional, calidad_estimacion)
  - Skip fields that are already visible as columns
  - Render as label-value pairs in a grid layout
  - Long text (notas, racional) in `<pre>` with `whitespace-pre-wrap`
  - Currency values formatted appropriately
- Styled with `bg-muted/30` background (same pattern as GenericReportPage collapsible)

---

## Phase 5: LTP Report — Expandable Rows

### Step 5.1: Configure collapsible mode for LTP report
- **File**: `frontend/src/features/reports/LTPsReportPage.jsx`
- Add `collapsibleConfig` to the config object:
  ```javascript
  collapsibleConfig: {
    mainColumnIds: ['portfolio_id', 'nombre', 'tarea', 'siguiente_accion', 'estado'],
    badgeColumns: {},
    detailColumnIds: ['comentarios', 'responsable'],
  }
  ```
- This activates the existing CollapsibleReportTable in GenericReportPage
- Ensure the estado column in mainColumnIds renders with EstadoTag (from Step 2.3)

---

## Phase 6: Parametricas Page

### Step 6.1: Add backend CRUD endpoints
- **File**: `backend/app/schemas.py`
  - Add `ParametroCreate(BaseModel)`: nombre_parametro (str), valor (str), orden (int | None)
  - Add `ParametroUpdate(BaseModel)`: nombre_parametro (str | None), valor (str | None), orden (int | None)

- **File**: `backend/app/routers/parametros.py`
  - Add BEFORE the existing `GET /{nombre_parametro}` route (FastAPI route ordering!):
    - `GET /` — List all parametros with optional `nombre_parametro` query parameter for filtering. Returns `{ data: [...], total: N }`
    - `POST /` — Create parametro. Validates unique(nombre_parametro, valor). Returns created object.
    - `PUT /{id}` — Update parametro by id. Validates unique constraint if nombre_parametro or valor changed. Returns updated object.
    - `DELETE /{id}` — Delete parametro by id. Returns `{ success: true }`.

### Step 6.2: Create ParametroFormDialog
- **File**: `frontend/src/features/parametricas/ParametroFormDialog.jsx`
- Uses Dialog from `@/components/ui/dialog`
- Props: `open`, `onOpenChange`, `mode` ('create' | 'edit'), `initialData`, `existingNames`, `onSave`
- Fields:
  - nombre_parametro: text input (with datalist of existing names for autocomplete)
  - valor: text input
  - orden: number input (optional)
- Validates non-empty nombre_parametro and valor
- Calls `onSave(data)` on submit

### Step 6.3: Create ParametricasPage
- **File**: `frontend/src/features/parametricas/ParametricasPage.jsx`
- Uses Layout, usePageTitle
- State: parametros list, selected nombre_parametro filter, dialog state (create/edit/delete)
- Fetches: `GET /parametros/` (all) on mount with React Query
- Filter: Dropdown of distinct nombre_parametro values (derived from data)
- Table: nombre_parametro, valor, orden, fecha_creacion, actions (edit/delete buttons)
- Create button: Opens ParametroFormDialog in create mode
- Edit button: Opens ParametroFormDialog in edit mode with row data
- Delete button: Opens confirmation dialog, then calls DELETE
- API calls: Direct axios calls via apiClient (not transacciones_json)
- Invalidates React Query cache on create/update/delete

### Step 6.4: Add route and navigation
- **File**: `frontend/src/App.jsx`
  - Add lazy import: `const ParametricasPage = lazy(() => import('./features/parametricas/ParametricasPage'))`
  - Add route: `<Route path="/parametricas" element={<ErrorBoundary><ParametricasPage /></ErrorBoundary>} />`
  - Place inside the protected routes section

- **File**: `frontend/src/components/layout/Navbar.jsx`
  - Add "Parametricas" nav item with Settings icon
  - Place after "Trabajos" in trailing navigation items

---

## Phase 7: Documentation & Finalization

### Step 7.1: Version bump and changelog
- **File**: `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to 38
- **File**: `frontend/src/lib/changelog.js` — Add entry at TOP of CHANGELOG array

### Step 7.2: Update documentation
- **File**: `README.md` — Add Parametricas route, mention new UI features
- **File**: `specs/architecture/architecture_frontend.md` — Document EstadoTag, expandable rows, drawer reuse, Parametricas page
- **File**: `specs/architecture/architecture_backend.md` — Document parametros CRUD endpoints

---

## Dependency Order

```
Phase 1 (EstadoTag)
    ↓
Phase 2 (Tag Integration) ←──┐
    ↓                          │
Phase 3 (Drawer)     [independent of Phase 2]
    ↓
Phase 4 (Hechos Expand) [depends on Phase 3 for same file]
    ↓
Phase 5 (LTP Expand) [depends on Phase 2.3]
    ↓
Phase 6 (Parametricas) [fully independent]
    ↓
Phase 7 (Documentation)
```

Phases 3 and 6 are independent of each other and of Phase 2 (except they all need Phase 1).

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Hechos report is custom (not GenericReportPage) — expansion logic must be written from scratch | Follow CollapsibleRow pattern from GenericReportPage as reference |
| FastAPI route ordering for parametros CRUD | Define all new routes BEFORE the existing `/{nombre_parametro}` catch-all |
| Hechos estado values differ from initiative estados (21 canonical) | EstadoTag handles unknown values gracefully with neutral gray |
| LTP collapsible mode changes the table layout | Users can still configure columns via ColumnConfigurator; commented columns remain available |
| Etiquetas backend needs a new JOIN for estado | Simple LEFT JOIN on datos_relevantes, same pattern as existing nombre join |
