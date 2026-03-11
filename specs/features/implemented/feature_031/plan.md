# Implementation Plan — feature_029

## Phase 1: Backend — New `cambiar-fecha` Endpoint

### Step 1.1: Add Pydantic schemas

**File:** `backend/app/schemas.py`

Add:
```python
class CambiarFechaRequest(BaseModel):
    fecha: date

class CambiarFechaResponse(BaseModel):
    updated_tarea: bool
    updated_acciones: int
```

### Step 1.2: Add endpoint

**File:** `backend/app/routers/tareas.py`

Add `PUT /tareas/{tarea_id}/cambiar-fecha` **before** the `PUT /{tarea_id}` route (FastAPI route ordering).

Logic:
1. Get tarea by ID (404 if not found)
2. Update `tarea.fecha_siguiente_accion = req.fecha`
3. Update `tarea.fecha_actualizacion = now()`
4. Query `acciones_realizadas` where `tarea_id = tarea_id` AND `estado ILIKE 'pendiente'`
5. If pending acciones exist:
   - Find `min_fecha = min(acc.fecha_accion for acc in pending_acciones)`
   - For each pending accion where `fecha_accion == min_fecha`: set `fecha_accion = req.fecha`, set `fecha_actualizacion = now()`
   - Count updated acciones
6. Commit and return response

---

## Phase 2: Frontend — Auto-focus First Control (Req 1)

### Step 2.1: Add auto-focus to Edit Tarea dialog in DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Add a `useRef` for the tarea name input
- In the `useEffect` that runs when `editOpen` changes to true, add `setTimeout(() => ref.current?.focus(), 50)`

### Step 2.2: Add auto-focus to Edit Accion dialog in DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Add a `useRef` for the accion textarea
- In the `useEffect` that runs when `editAccionOpen` changes to true, add `setTimeout(() => ref.current?.focus(), 50)`

### Step 2.3: Add auto-focus to Nueva Tarea dialog in SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Add a `useRef` for the tarea name input
- In the `useEffect` that runs when `newTareaOpen` changes to true, add `setTimeout(() => ref.current?.focus(), 50)`

### Step 2.4: Add auto-focus to BulkChangeDateDialog in SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Add a `useRef` for the date container
- In the `useEffect` that runs when `bulkChangeDateOpen` changes to true, focus the first button inside the date picker ref

### Step 2.5: Add auto-focus to ConfirmDialog

**File:** `frontend/src/components/ui/confirm-dialog.jsx`

- Add a `useRef` for the confirm button
- When `open` is true, focus the confirm button after 50ms delay

---

## Phase 3: Frontend — Tab Order Fix (Req 2)

### Step 3.1: Fix tab order in CompleteAndScheduleDialog

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

In the `CompleteAndScheduleDialog` component:
- Add `tabIndex={-1}` to the Cancel button in `DialogFooter`
- This makes Tab from "Siguiente Accion" textarea skip Cancel and land on Aceptar

### Step 3.2: Fix tab order in AddAccionDialog

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

In the `AddAccionDialog` component:
- Add `tabIndex={-1}` to the Cancel button in `DialogFooter`
- Tab from DateInput → Aceptar directly

---

## Phase 4: Frontend — Search Refresh After Detail Changes (Req 3)

### Step 4.1: Add dirty flag to SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Add module-level variable: `let searchDirtyFlag = false`
- Export function: `export function markSearchDirty() { searchDirtyFlag = true }`
- In the component mount/restore logic: if `searchDirtyFlag` is true, clear it and call `doSearch(page)` to refresh results instead of just using cached data

### Step 4.2: Call markSearchDirty from DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Import `markSearchDirty` from SearchPage
- Call `markSearchDirty()` in every mutation success handler:
  - `handleSaveTarea` (edit tarea)
  - `handleSaveAccion` (edit accion)
  - `handleDeleteAccion` (delete accion)
  - `handleMarkComplete` (mark tarea completada)
  - `onSuccess` callbacks for: AddAccionDialog, CambiarFechaDialog, CompleteAndScheduleDialog

---

## Phase 5: Frontend — "Completar acción" Button (Req 4)

### Step 5.1: Add complete button to accion rows

**File:** `frontend/src/features/detail/DetailPage.jsx`

Desktop table rows and mobile card actions:
- Add a `CheckCircle` icon button (from lucide-react) before the Edit button
- Only render when `accion.estado !== "Completada"`
- `onClick`: call `PUT /acciones/{id}` with `{ estado: "Completada" }`
- On success: `fetchData()` to refresh + `toast.success()` + `markSearchDirty()`
- Style: green tint or muted, same size as other icon buttons
- Title/tooltip: "Completar acción"

---

## Phase 6: Frontend — Update CambiarFechaDialog for Fecha Propagation (Req 5)

### Step 6.1: Update CambiarFechaDialog API call

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

In `CambiarFechaDialog`:
- Change API call from `PUT /tareas/${tareaId}` to `PUT /tareas/${tareaId}/cambiar-fecha`
- Request body changes from `{ fecha_siguiente_accion: fecha }` to `{ fecha: fecha }`
- On success, optionally show toast with number of updated acciones from response
- The `onSuccess` callback remains the same (triggers search refresh or detail refresh)

---

## Phase 7: Version & Changelog

### Step 7.1: Update version

**File:** `frontend/src/lib/version.js`

- Increment `APP_VERSION.minor` to `29`

### Step 7.2: Add changelog entry

**File:** `frontend/src/lib/changelog.js`

- Add entry at TOP of `CHANGELOG` array with version, feature number, title, and summary

---

## Phase 8: Documentation

### Step 8.1: Update architecture docs

- `specs/architecture/architecture_backend.md` — Document `PUT /tareas/{id}/cambiar-fecha` endpoint
- `specs/architecture/architecture_frontend.md` — Document dirty flag pattern, completar acción button

### Step 8.2: Update README.md

- Add `PUT /tareas/{tarea_id}/cambiar-fecha` to the API endpoints section

---

## Implementation Order

1. **Phase 1** (Backend) — New endpoint, independent of frontend changes
2. **Phase 2** (Auto-focus) — Independent, can be done in any order
3. **Phase 3** (Tab order) — Independent
4. **Phase 4** (Dirty flag) — Must be before Phase 5 (which calls markSearchDirty)
5. **Phase 5** (Completar button) — Depends on Phase 4
6. **Phase 6** (CambiarFecha update) — Depends on Phase 1
7. **Phase 7** (Version) — After all code changes
8. **Phase 8** (Docs) — After all code changes

## Testing Checklist

- [ ] Open each dialog → verify first control is focused
- [ ] CompleteAndScheduleDialog: fill "Siguiente Accion", press Tab → Aceptar gets focus
- [ ] AddAccionDialog: fill fields, Tab past DateInput → Aceptar gets focus
- [ ] Edit a tarea in Detail → go back to Search → results are refreshed
- [ ] Add/edit/delete accion in Detail → go back to Search → results are refreshed
- [ ] Click "Completar acción" on a pending accion → estado changes to Completada, list refreshes
- [ ] "Completar acción" button NOT shown on already-completed acciones
- [ ] Cambiar Fecha on a tarea with pending acciones → pending acciones with min fecha updated
- [ ] Cambiar Fecha on a tarea with NO pending acciones → only tarea fecha updated
- [ ] Cambiar Fecha on a tarea with multiple pending acciones at different dates → only min-fecha ones updated
- [ ] Backend: `PUT /tareas/{id}/cambiar-fecha` returns correct counts
- [ ] Version number shows 29 in navbar
- [ ] Changelog entry appears on landing page
