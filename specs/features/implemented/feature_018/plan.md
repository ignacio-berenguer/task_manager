# Feature 018: Implementation Plan

## Phase 1: Backend - Rename and Enhance Hechos Report Endpoints

### Step 1.1: Rename schema and add estado filter

**File:** `backend/app/schemas.py`

- Rename `HechosReport01Request` to `HechosReportRequest`
- Add `estado: list[str] = []` field to the schema
- Add new schemas: `LTPReportRequest`, `AccionesReportRequest`, `EtiquetasReportRequest`, `TransaccionesReportRequest`

### Step 1.2: Rename and enhance hechos report endpoints

**File:** `backend/app/routers/hechos.py`

- Rename `GET /report01-filter-options` to `GET /report-hechos-filter-options`
- Add `estado` distinct values from `Hecho` model to filter options response
- Rename `POST /search-report01` to `POST /search-report-hechos`
- Add `estado` filter logic: if `request.estado` is non-empty, apply `Hecho.estado.in_(request.estado)`
- Update import from `HechosReport01Request` to `HechosReportRequest`
- Update log messages

### Step 1.3: Test renamed hechos endpoints

- Start backend server
- Test `GET /api/v1/hechos/report-hechos-filter-options` (should include `estado` field)
- Test `POST /api/v1/hechos/search-report-hechos` with and without `estado` filter

---

## Phase 2: Backend - New Report Endpoints (LTP, Acciones, Etiquetas, Transacciones)

### Step 2.1: Add LTP report endpoints

**File:** `backend/app/routers/ltp.py`

- Import required models: `LTP`, `DatosDescriptivo`
- Import `LTPReportRequest`, `PaginatedResponse`, and helper functions
- Add `GET /report-ltps-filter-options` endpoint (before `/{id}` route):
  - Query distinct `responsable` and `estado` from `ltp`
  - Return alphabetically sorted lists
- Add `POST /search-report-ltps` endpoint:
  - LEFT JOIN `ltp` with `datos_descriptivos` on `portfolio_id` (for `nombre`)
  - Apply optional filters on `responsable` and `estado`
  - Merge `nombre` from datos_descriptivos into each row
  - Default order: `siguiente_accion` ascending
  - Return `PaginatedResponse`
- **Critical:** Move these new endpoints BEFORE the `/{id}` path parameter route

### Step 2.2: Add Acciones report endpoints

**File:** `backend/app/routers/acciones.py`

- Import required models: `Accion`, `DatosDescriptivo`, `Iniciativa`
- Import `AccionesReportRequest`, `PaginatedResponse`, and helper functions
- Add `GET /report-acciones-filter-options` endpoint (before `/{id}` route):
  - Query distinct `estado_de_la_iniciativa` from `iniciativas`
  - Return alphabetically sorted list
- Add `POST /search-report-acciones` endpoint:
  - LEFT JOIN `acciones` with `datos_descriptivos` on `portfolio_id` (for `nombre`)
  - LEFT JOIN with `iniciativas` on `portfolio_id` (for `estado_de_la_iniciativa`)
  - Apply optional filters on date range (`siguiente_accion`) and `estado_de_la_iniciativa`
  - Merge `nombre` and `estado_de_la_iniciativa` into each row
  - Default order: `siguiente_accion` ascending, `portfolio_id` ascending
  - Return `PaginatedResponse`
- **Critical:** Move these new endpoints BEFORE the `/{id}` path parameter route

### Step 2.3: Add Etiquetas report endpoints

**File:** `backend/app/routers/etiquetas.py`

- Import required models: `Etiqueta`, `DatosDescriptivo`
- Import `EtiquetasReportRequest`, `PaginatedResponse`, and helper functions
- Add `GET /report-etiquetas-filter-options` endpoint (before `/{id}` route):
  - Query distinct `etiqueta` from `etiquetas`
  - Return alphabetically sorted list
- Add `POST /search-report-etiquetas` endpoint:
  - LEFT JOIN `etiquetas` with `datos_descriptivos` on `portfolio_id` (for `nombre`)
  - Apply optional filters on `portfolio_id` (exact), `nombre` (ILIKE), `etiqueta` (IN)
  - Merge `nombre` from datos_descriptivos into each row
  - Default order: `portfolio_id` ascending, `etiqueta` ascending
  - Return `PaginatedResponse`
- **Critical:** Move these new endpoints BEFORE the `/{id}` path parameter route

### Step 2.4: Add Transacciones report endpoints

**File:** `backend/app/routers/transacciones.py`

- Import `TransaccionesReportRequest`, `PaginatedResponse`, and helper functions
- Add `GET /report-transacciones-filter-options` endpoint (before `/{id}` route):
  - Query distinct `estado_cambio` from `transacciones`
  - Return alphabetically sorted list
- Add `POST /search-report-transacciones` endpoint:
  - Query `transacciones` table (no joins needed)
  - Apply optional filters: `clave1` (exact), `estado_cambio` (IN), date ranges on `fecha_registro_cambio` and `fecha_ejecucion_cambio`, `id` (exact)
  - Default order: `id` ascending
  - Return `PaginatedResponse`
- **Critical:** Move these new endpoints BEFORE the `/{id}` path parameter route

### Step 2.5: Test all new backend endpoints

- Test each pair of filter-options + search endpoints
- Verify pagination, sorting, and filtering work correctly
- Verify joins return correct data

---

## Phase 3: Frontend - Rename Hechos Report and Add Estado Filter

### Step 3.1: Update hooks for renamed endpoints

**Files:**
- `frontend/src/features/reports/hooks/useReportSearch.js` - Update endpoint to `/hechos/search-report-hechos`
- `frontend/src/features/reports/hooks/useReportFilterOptions.js` - Update endpoint to `/hechos/report-hechos-filter-options`

### Step 3.2: Add estado filter to ReportFilterPanel

**File:** `frontend/src/features/reports/components/ReportFilterPanel.jsx`

- Add "Estado del Hecho" multi-select dropdown
- Use the `estado` values from filter options response
- Update `onFiltersChange` to include `estado` array

### Step 3.3: Update ReportPage for rename and estado filter

**File:** `frontend/src/features/reports/ReportPage.jsx`

- Change page title from "Iniciativas Cambiadas en el Periodo" to "Hechos"
- Update `buildRequestBody()` to include `estado` filter array
- Update localStorage keys to use `portfolio-report-hechos-*` prefix

### Step 3.4: Update reportStorage.js for new key prefix

**File:** `frontend/src/features/reports/utils/reportStorage.js`

- Change keys from `portfolio-report-columns` to `portfolio-report-hechos-columns`
- Change keys from `portfolio-report-page-size` to `portfolio-report-hechos-page-size`

### Step 3.5: Update navigation

**File:** `frontend/src/components/layout/Navbar.jsx`

- Change "Iniciativas Cambiadas" to "Hechos"
- Change route from `/informes/iniciativas-cambiadas` to `/informes/hechos`

**File:** `frontend/src/App.jsx`

- Update route from `/informes/iniciativas-cambiadas` to `/informes/hechos`

---

## Phase 4: Frontend - LTPs Report Page

### Step 4.1: Create LTP column definitions

**File:** `frontend/src/features/reports/utils/ltpColumnDefinitions.js`

- Define default columns: portfolio_id (link), nombre, tarea (longtext), siguiente_accion (date), comentarios (longtext), estado
- Define additional columns: id, responsable, fecha_creacion, fecha_actualizacion
- Define column categories: "LTP (por defecto)", "Adicional"

### Step 4.2: Create LTPs report page

**File:** `frontend/src/features/reports/LTPsReportPage.jsx`

- Follow same pattern as ReportPage.jsx
- Filter panel with: Responsable (multi-select), Estado (multi-select)
- Use parameterized hooks pointing to `/ltp/search-report-ltps` and `/ltp/report-ltps-filter-options`
- Column selector with LTP-specific column definitions
- localStorage keys: `portfolio-report-ltps-columns`, `portfolio-report-ltps-page-size`
- Default sort: `siguiente_accion` ascending
- Auto-search on page load (no date filters needed as default)

### Step 4.3: Add route and navigation

**File:** `frontend/src/App.jsx` - Add `/informes/ltps` route

**File:** `frontend/src/components/layout/Navbar.jsx` - Add "LTPs" to informesItems with `ListTodo` icon

---

## Phase 5: Frontend - Acciones Report Page

### Step 5.1: Create Acciones column definitions

**File:** `frontend/src/features/reports/utils/accionesColumnDefinitions.js`

- Define default columns: portfolio_id (link), nombre, siguiente_accion, siguiente_accion_comentarios (longtext), estado
- Define additional columns: id, comentarios (longtext), fecha_creacion, fecha_actualizacion
- Define column categories

### Step 5.2: Create Acciones report page

**File:** `frontend/src/features/reports/AccionesReportPage.jsx`

- Filter panel with: Siguiente Accion date range, Estado de la Iniciativa (multi-select)
- Use parameterized hooks pointing to `/acciones/search-report-acciones` and `/acciones/report-acciones-filter-options`
- Column selector with Acciones-specific column definitions
- localStorage keys: `portfolio-report-acciones-columns`, `portfolio-report-acciones-page-size`
- Default sort: `siguiente_accion` ascending

### Step 5.3: Add route and navigation

**File:** `frontend/src/App.jsx` - Add `/informes/acciones` route

**File:** `frontend/src/components/layout/Navbar.jsx` - Add "Acciones" to informesItems with `Zap` icon

---

## Phase 6: Frontend - Etiquetas Report Page

### Step 6.1: Create Etiquetas column definitions

**File:** `frontend/src/features/reports/utils/etiquetasColumnDefinitions.js`

- Define default columns: portfolio_id (link), nombre, etiqueta (longtext), valor (longtext), origen_registro (longtext), comentarios (longtext)
- Define additional columns: id, fecha_modificacion, fecha_creacion, fecha_actualizacion
- Define column categories

### Step 6.2: Create Etiquetas report page

**File:** `frontend/src/features/reports/EtiquetasReportPage.jsx`

- Filter panel with: Portfolio ID (text/combobox), Nombre (text), Etiqueta (multi-select)
- Use parameterized hooks pointing to `/etiquetas/search-report-etiquetas` and `/etiquetas/report-etiquetas-filter-options`
- Column selector with Etiquetas-specific column definitions
- localStorage keys: `portfolio-report-etiquetas-columns`, `portfolio-report-etiquetas-page-size`
- Default sort: `portfolio_id` ascending, then `etiqueta` ascending

### Step 6.3: Add route and navigation

**File:** `frontend/src/App.jsx` - Add `/informes/etiquetas` route

**File:** `frontend/src/components/layout/Navbar.jsx` - Add "Etiquetas" to informesItems with `Tags` icon

---

## Phase 7: Frontend - Transacciones Report Page

### Step 7.1: Create Transacciones column definitions

**File:** `frontend/src/features/reports/utils/transaccionesColumnDefinitions.js`

- Define all columns as default: id, clave1 (link to detail), clave2, tabla, campo_tabla, valor_nuevo (longtext), tipo_cambio, estado_cambio, fecha_registro_cambio (date), fecha_ejecucion_cambio (date), valor_antes_del_cambio (longtext), comentarios (longtext), fecha_creacion (date), fecha_actualizacion (date)
- All columns are default (no additional columns)

### Step 7.2: Create Transacciones report page

**File:** `frontend/src/features/reports/TransaccionesReportPage.jsx`

- Filter panel with: Portfolio ID/clave1 (text), Estado Cambio (multi-select), Fecha Registro Cambio (date range), Fecha Ejecucion Cambio (date range), ID (number input)
- Use parameterized hooks pointing to `/transacciones/search-report-transacciones` and `/transacciones/report-transacciones-filter-options`
- Column selector with Transacciones column definitions
- localStorage keys: `portfolio-report-transacciones-columns`, `portfolio-report-transacciones-page-size`
- Default sort: `id` ascending
- Special: `clave1` column rendered as link to `/detail/{clave1}`

### Step 7.3: Add route and navigation

**File:** `frontend/src/App.jsx` - Add `/informes/transacciones` route

**File:** `frontend/src/components/layout/Navbar.jsx` - Add "Transacciones" to informesItems with `ArrowLeftRight` icon

---

## Phase 8: Frontend - Refactor for Shared Report Infrastructure

### Step 8.1: Parameterize hooks

Refactor the existing hooks to accept configuration parameters so they can be reused across all 5 reports:

**File:** `frontend/src/features/reports/hooks/useReportSearch.js`
- Accept `endpoint` parameter (e.g., `/hechos/search-report-hechos`)

**File:** `frontend/src/features/reports/hooks/useReportFilterOptions.js`
- Accept `endpoint` parameter (e.g., `/hechos/report-hechos-filter-options`)

**File:** `frontend/src/features/reports/hooks/useReportPreferences.js`
- Accept `storageKeyPrefix` parameter (e.g., `portfolio-report-hechos`)

### Step 8.2: Update index.js exports

**File:** `frontend/src/features/reports/index.js`
- Export all 5 report page components

Note: This step should actually be done first, before creating individual report pages, so that the refactored hooks are available. In practice, steps 8.1 and 3.1 will be combined.

---

## Phase 9: Documentation

### Step 9.1: Update architecture_frontend.md

**File:** `specs/architecture_frontend.md`

- Add "Filter Behavior Convention" section documenting:
  - Multi-select filter behavior (Todos = no filter, empty array = no filter)
  - Text input filter behavior (exact match vs wildcard)
  - Date range filter behavior (format, inclusive bounds, optional)
  - Filter panel UX conventions (collapsible, keyboard shortcuts, auto-search)
  - Pagination and sorting conventions
- Add new report routes to routing table
- Update navigation section with all 5 Informes sub-items
- Update directory structure for reports feature
- Update localStorage keys table

### Step 9.2: Update README.md

**File:** `README.md`

- Update "Informes" feature description to reflect all 5 reports
- Update API endpoints documentation

### Step 9.3: Update architecture_backend.md

**File:** `specs/architecture_backend.md`

- Add new report endpoints to API documentation
- Document the report endpoint pattern (filter-options + search pairs)

---

## Execution Order

```
Phase 1 (Backend - Rename Hechos)
  └── Step 1.1 → Step 1.2 → Step 1.3

Phase 2 (Backend - New Endpoints) ← After Phase 1
  └── Step 2.1 → Step 2.2 → Step 2.3 → Step 2.4 → Step 2.5

Phase 3 (Frontend - Rename Hechos + Estado Filter) ← After Phase 1
  └── Step 3.1 → Step 3.2 → Step 3.3 → Step 3.4 → Step 3.5
  Note: Step 8.1 (parameterize hooks) happens concurrently with Step 3.1

Phase 4 (Frontend - LTPs) ← After Phase 2 (backend) + Phase 3 (refactored hooks)
  └── Step 4.1 → Step 4.2 → Step 4.3

Phase 5 (Frontend - Acciones) ← After Phase 2
  └── Step 5.1 → Step 5.2 → Step 5.3

Phase 6 (Frontend - Etiquetas) ← After Phase 2
  └── Step 6.1 → Step 6.2 → Step 6.3

Phase 7 (Frontend - Transacciones) ← After Phase 2
  └── Step 7.1 → Step 7.2 → Step 7.3

Phase 8 (Refactor) ← Done as part of Phase 3 (see note)

Phase 9 (Documentation) ← After all other phases
  └── Step 9.1 → Step 9.2 → Step 9.3
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| FastAPI route conflicts (static vs dynamic) | All report endpoints defined BEFORE `/{id}` path parameter routes |
| Large result sets (etiquetas: 7,278, transacciones: ~9,000) | Server-side pagination with configurable page size (default 50) |
| Missing datos_descriptivos for some portfolio_ids (LTP/Acciones/Etiquetas joins) | Use LEFT JOIN so records without matching datos_descriptivos still appear (nombre=null) |
| Transacciones has no portfolio_id field | Filter by `clave1` which typically contains portfolio_id; link column uses `clave1` |
| localStorage key migration (Hechos report) | Old keys continue working; new keys used for new reports |
| 5 very similar report pages = code duplication | Parameterized hooks + shared components minimize duplication |

---

## Files Changed Summary

### Backend (Modified)
- `backend/app/schemas.py` - Rename schema + add 4 new schemas
- `backend/app/routers/hechos.py` - Rename endpoints + add estado filter
- `backend/app/routers/ltp.py` - Add 2 report endpoints
- `backend/app/routers/acciones.py` - Add 2 report endpoints
- `backend/app/routers/etiquetas.py` - Add 2 report endpoints
- `backend/app/routers/transacciones.py` - Add 2 report endpoints

### Frontend (Modified)
- `frontend/src/App.jsx` - Add 4 new routes, update 1 route
- `frontend/src/components/layout/Navbar.jsx` - Update informesItems array
- `frontend/src/features/reports/ReportPage.jsx` - Rename title, add estado filter, update storage keys
- `frontend/src/features/reports/hooks/useReportSearch.js` - Parameterize endpoint
- `frontend/src/features/reports/hooks/useReportFilterOptions.js` - Parameterize endpoint
- `frontend/src/features/reports/hooks/useReportPreferences.js` - Parameterize storage key prefix
- `frontend/src/features/reports/components/ReportFilterPanel.jsx` - Add estado multi-select
- `frontend/src/features/reports/utils/reportStorage.js` - Update key prefixes
- `frontend/src/features/reports/index.js` - Export all report pages

### Frontend (New)
- `frontend/src/features/reports/LTPsReportPage.jsx`
- `frontend/src/features/reports/AccionesReportPage.jsx`
- `frontend/src/features/reports/EtiquetasReportPage.jsx`
- `frontend/src/features/reports/TransaccionesReportPage.jsx`
- `frontend/src/features/reports/utils/ltpColumnDefinitions.js`
- `frontend/src/features/reports/utils/accionesColumnDefinitions.js`
- `frontend/src/features/reports/utils/etiquetasColumnDefinitions.js`
- `frontend/src/features/reports/utils/transaccionesColumnDefinitions.js`

### Documentation (Modified)
- `specs/architecture_frontend.md` - Add filter conventions + new routes
- `specs/architecture_backend.md` - Add new report endpoints
- `README.md` - Update feature descriptions
