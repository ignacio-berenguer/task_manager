# Implementation Plan — feature_010: Database Export API + Administrator Menu

## Phase 1: Backend — Export API Endpoint

### Step 1.1: Create `backend/app/routers/admin.py`

Create a new router file with a single `GET /admin/export` endpoint:

- Import `APIRouter`, `Depends`, `Session`, `verify_auth`, `get_db`, all 5 models, `model_to_dict` from crud
- Define `router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(verify_auth)])`
- Implement `export_database(db: Session = Depends(get_db))`:
  - Query all records from each of the 5 tables in dependency order:
    1. `EstadoTarea` (estados_tareas)
    2. `EstadoAccion` (estados_acciones)
    3. `Responsable` (responsables)
    4. `Tarea` (tareas)
    5. `AccionRealizada` (acciones_realizadas)
  - Convert each record to dict using `model_to_dict()`
  - Build the export JSON structure with `export_metadata` and `data` sections
  - Return a `JSONResponse` with `Content-Disposition` header for download
  - Log start and completion with record counts

### Step 1.2: Register router in `backend/app/main.py`

- Import the admin router
- Add `app.include_router(admin.router, prefix=settings.API_PREFIX)` alongside existing routers

## Phase 2: Frontend — Administrator Dropdown Menu

### Step 2.1: Create `frontend/src/api/admin.js`

- Export `exportDatabase()` function:
  - Call `apiClient.get('/admin/export')`
  - Create a Blob from the JSON response (pretty-printed)
  - Generate filename: `task_manager_export_YYYY-MM-DD_HHMMSS.json`
  - Create temporary `<a>` element, set `href` to `URL.createObjectURL(blob)`, set `download` attribute
  - Click programmatically, then revoke the object URL

### Step 2.2: Modify `frontend/src/components/layout/Navbar.jsx`

- Import new icons: `Settings`, `Download`, `ChevronDown` from lucide-react
- Import `exportDatabase` from `api/admin.js`
- Add state for dropdown open/close and export loading state
- **Desktop navbar:**
  - Add "Administrador" button after existing nav items (before theme toggle area)
  - On click, toggle a positioned dropdown panel
  - Dropdown contains "Exportar base de datos" item with Download icon
  - Click outside closes the dropdown (use `useRef` + `useEffect` click-outside listener)
- **Mobile menu:**
  - Add "Administrador" as an expandable section in the mobile drawer
  - Toggle sub-items visibility on click (accordion pattern)
  - Sub-item: "Exportar base de datos"
- **Export handler:**
  - Set loading state to true
  - Call `exportDatabase()`
  - On success: close dropdown, reset loading state
  - On error: log error, show console error, reset loading state

## Phase 3: Version & Changelog

### Step 3.1: Update `frontend/src/lib/version.js`

- Change `minor: 8` → `minor: 10` (feature_010)

### Step 3.2: Update `frontend/src/lib/changelog.js`

- Add new entry at the TOP of the `CHANGELOG` array:
  ```javascript
  {
    version: '1.010',
    feature: 'feature_010',
    title: 'Exportar base de datos',
    summary: 'Nuevo menú Administrador con opción para exportar toda la base de datos en formato JSON.'
  }
  ```

## Phase 4: Documentation Updates

### Step 4.1: Update `specs/architecture/architecture_backend.md`

- Add section for Admin router with the export endpoint

### Step 4.2: Update `specs/architecture/architecture_frontend.md`

- Document the Administrador dropdown menu pattern
- Document the export download functionality

### Step 4.3: Update `README.md`

- Add Admin API section under Backend API documentation
- Mention the export capability

## Implementation Order

1. Backend router (Step 1.1 → 1.2) — can be tested independently via Swagger
2. Frontend API client (Step 2.1)
3. Navbar modification (Step 2.2)
4. Version & changelog (Step 3.1 → 3.2)
5. Documentation (Step 4.1 → 4.2 → 4.3)

## Testing Checkpoints

- **After Phase 1:** Verify `GET /api/v1/admin/export` returns correct JSON with all tables via Swagger UI
- **After Phase 2:** Verify clicking "Exportar base de datos" downloads a valid JSON file
- **After Phase 3:** Verify landing page shows updated version and changelog
- **After Phase 4:** Verify all docs are consistent
