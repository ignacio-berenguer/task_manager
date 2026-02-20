# Implementation Plan — feature_042: Etiquetas Destacadas

## Phase 1: Database & Backend

### Step 1.1 — Database Schema
**File:** `db/schema.sql`
- Add `CREATE TABLE etiquetas_destacadas` after the existing `parametros` table definition
- Add `INSERT INTO etiquetas_destacadas` with the 3 initial rows
- Run `management/main.py recreate_tables` is NOT needed — the table will be created by executing the DDL directly against the database, since we don't want to drop existing data

### Step 1.2 — SQLAlchemy Model
**File:** `backend/app/models.py`
- Add `EtiquetaDestacada` class after the `Parametro` model

### Step 1.3 — Pydantic Schemas
**File:** `backend/app/schemas.py`
- Add `EtiquetaDestacadaCreate` and `EtiquetaDestacadaUpdate` schemas in the Parametros section

### Step 1.4 — Router
**File:** `backend/app/routers/etiquetas_destacadas.py` (NEW)
- Create router following `parametros.py` pattern
- Endpoints: GET /, POST /, PUT /{id}, DELETE /{id}
- Tag: "Etiquetas Destacadas"
- Prefix: `/etiquetas-destacadas`

### Step 1.5 — Registration
**Files:** `backend/app/main.py`, `backend/app/table_registry.py`
- Import `etiquetas_destacadas` router in main.py, include in parametric tables section
- Add `EtiquetaDestacada` to table_registry.py imports and `TABLE_MODELS` dict

### Step 1.6 — Verify Backend
- Start backend server
- Test CRUD endpoints via Swagger UI or curl:
  - `GET /api/v1/etiquetas-destacadas/` → should return 3 pre-populated records
  - `POST /api/v1/etiquetas-destacadas/` → create test record
  - `PUT /api/v1/etiquetas-destacadas/{id}` → update test record
  - `DELETE /api/v1/etiquetas-destacadas/{id}` → delete test record

---

## Phase 2: Frontend — Navigation & Management Page

### Step 2.1 — Navbar Dropdown
**File:** `frontend/src/components/layout/Navbar.jsx`
- Remove `Parametricas` from `trailingNavItems`
- Add `parametricasItems` array with 2 items: Etiquetas Destacadas + Parametricas
- Add `isParametricasActive` computed from `location.pathname.startsWith('/parametricas')`
- Add Parametricas dropdown in desktop nav (after trailing items loop, before `</SignedIn>`)
- Add Parametricas section in mobile nav (after trailing items, with section header)
- Import `Star` icon from lucide-react for the Etiquetas Destacadas menu item

### Step 2.2 — Route
**File:** `frontend/src/App.jsx`
- Add lazy import for `EtiquetasDestacadasPage`
- Add route `/parametricas/etiquetas-destacadas` before the existing `/parametricas` route

### Step 2.3 — Shared Hook
**File:** `frontend/src/features/parametricas/hooks/useEtiquetasDestacadas.js` (NEW)
- Export `useEtiquetasDestacadas()` hook using `@tanstack/react-query`
- Fetch from `/etiquetas-destacadas/`, staleTime 5 min

### Step 2.4 — Form Dialog
**File:** `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx` (NEW)
- Follow `ParametroFormDialog.jsx` pattern
- Fields: etiqueta (text), color (select), orden (number)

### Step 2.5 — Management Page
**File:** `frontend/src/features/parametricas/EtiquetasDestacadasPage.jsx` (NEW)
- Follow `ParametricasPage.jsx` pattern (simpler — no grouping filter)
- Table: etiqueta, color, orden, fecha_creacion, actions
- CRUD via `/etiquetas-destacadas/` API
- Delete confirmation dialog

### Step 2.6 — Verify Management Page
- Navigate to `/parametricas/etiquetas-destacadas`
- Verify the 3 pre-populated records appear
- Test create, edit, delete operations
- Verify navigation dropdown works on desktop and mobile

---

## Phase 3: Frontend — Prominent Badge Display

### Step 3.1 — Badge Color Utility
**File:** `frontend/src/lib/badgeColors.js` (NEW)
- Export `getBadgeColorClass(color)` function
- Map: blue, green, purple, orange, red to Tailwind classes (light + dark mode)

### Step 3.2 — Detail Page Header Badges
**Files:**
- `frontend/src/features/detail/DetailPage.jsx` — compute matching etiquetas, pass to DetailHeader
- `frontend/src/features/detail/components/DetailHeader.jsx` — render badges

Steps:
1. In `DetailPage.jsx`, import `useEtiquetasDestacadas` hook
2. Compute `highlightedEtiquetas` by intersecting `data.etiquetas` with the destacadas list
3. Pass `highlightedEtiquetas` prop to `<DetailHeader>`
4. In `DetailHeader.jsx`, accept `highlightedEtiquetas` prop
5. Render badges as colored `<span>` elements below the initiative name
6. Use `getBadgeColorClass()` for color mapping

### Step 3.3 — Initiative Drawer Badges
**File:** `frontend/src/components/shared/InitiativeDrawer.jsx`

Steps:
1. Import `useEtiquetasDestacadas` hook
2. Extract `etiquetas` from `portfolioData`
3. Compute matching highlighted etiquetas
4. Render badges below the initiative name in `SheetHeader`
5. Use same `getBadgeColorClass()` utility

### Step 3.4 — Verify Badge Display
- Open a Detail page for an initiative that has one of the 3 highlighted etiquetas
- Verify badges appear in the header area
- Open the InitiativeDrawer from the Search page for the same initiative
- Verify badges appear in the drawer header
- Open a Detail page for an initiative WITHOUT highlighted etiquetas → no badges shown
- Verify dark mode rendering

---

## Phase 4: Documentation & Close

### Step 4.1 — Version & Changelog
- `frontend/src/lib/version.js` → bump `APP_VERSION.minor` to 42
- `frontend/src/lib/changelog.js` → add entry at TOP of `CHANGELOG` array

### Step 4.2 — Update README.md
- Add `etiquetas_destacadas` table to the database schema section
- Update table count (25 → 26)
- Mention Etiquetas Destacadas management page

### Step 4.3 — Update Architecture Docs
- `specs/architecture/architecture_backend.md` — Add router, model, schema references
- `specs/architecture/architecture_frontend.md` — Add new page, hook, navigation changes

### Step 4.4 — Close Feature
- Use `/close_feature feature_042`
