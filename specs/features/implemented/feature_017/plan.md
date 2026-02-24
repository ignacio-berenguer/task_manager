# Implementation Plan: feature_017 — Complete & Schedule Next Action

## Phase 1: Backend — New Composite Endpoint

### Step 1.1: Add Pydantic Schema

**File:** `backend/app/schemas.py`

Add `CompleteAndScheduleRequest` after the existing `AccionUpdate` class:

```python
class CompleteAndScheduleRequest(BaseModel):
    tarea_id: int
    accion_completada: str
    accion_siguiente: str
    fecha_siguiente: date
```

### Step 1.2: Add Endpoint to Acciones Router

**File:** `backend/app/routers/acciones.py`

Add `POST /complete-and-schedule` route. Must be placed **before** `GET /{id}` to avoid FastAPI route conflicts.

Implementation:
1. Import `date`, `datetime`, `Tarea` model, and `CompleteAndScheduleRequest` schema
2. Fetch tarea by `tarea_id` — return 404 if not found
3. Create accion1: `AccionRealizada(tarea_id=..., accion=accion_completada, fecha_accion=date.today(), estado="Completada")`
4. Create accion2: `AccionRealizada(tarea_id=..., accion=accion_siguiente, fecha_accion=fecha_siguiente, estado="Pendiente")`
5. Update tarea: `fecha_siguiente_accion = fecha_siguiente`, `fecha_actualizacion = datetime.now()`
6. `db.add(accion1)`, `db.add(accion2)`, then `db.commit()`, then `db.refresh()` all three
7. Return the three objects as a dict with `status_code=201`
8. Log the operation

### Step 1.3: Verify Backend

Run a quick import check to verify no syntax errors:
```bash
cd backend && uv run python -c "from app.main import app; print('OK')"
```

---

## Phase 2: Frontend — New Dialog Component

### Step 2.1: Add CompleteAndScheduleDialog

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

Add a third exported dialog component following the same patterns as `AddAccionDialog`:

- Props: `open`, `onOpenChange`, `tareaId`, `onSuccess`
- Form state: `{ accion_completada: '', accion_siguiente: '', fecha_siguiente: getTodayISO() }`
- Reset form and focus first textarea on open
- Ctrl+Enter keyboard shortcut to submit
- API call: `POST /acciones/complete-and-schedule`
- Toast success/error notifications
- UI: Two visually separated sections in the modal for the two actions

---

## Phase 3: Frontend — Search Page Integration

### Step 3.1: Add State and Button

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Import `CompleteAndScheduleDialog` from `ActionDialogs`
2. Import `ListChecks` icon from lucide-react
3. Add state: `const [completeScheduleTarget, setCompleteScheduleTarget] = useState(null)`
4. In `RowWithExpand` component: add `onCompleteSchedule` prop and render a new icon button with tooltip "Completar y Programar Siguiente" in the actions column
5. Pass the prop from SearchPage: `onCompleteSchedule={() => setCompleteScheduleTarget({ tarea_id: row.tarea_id })}`
6. Render `CompleteAndScheduleDialog` at the bottom of the component alongside existing dialogs, with `onSuccess={() => doSearch(page)}`

---

## Phase 4: Frontend — Detail Page Integration

### Step 4.1: Add State and Button

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. Import `CompleteAndScheduleDialog` from `ActionDialogs`
2. Import `ListChecks` icon from lucide-react
3. Add state: `const [completeScheduleOpen, setCompleteScheduleOpen] = useState(false)`
4. Add a button next to "Nueva Accion" in the Acciones Realizadas card header
5. Render `CompleteAndScheduleDialog` with `onSuccess={fetchData}`

---

## Phase 5: Version, Changelog & Documentation

### Step 5.1: Update Version

**File:** `frontend/src/lib/version.js`

Change `minor: 16` to `minor: 17`.

### Step 5.2: Update Changelog

**File:** `frontend/src/lib/changelog.js`

Add at the top of the `CHANGELOG` array:
```javascript
{
  version: "1.017",
  feature: 17,
  title: "Completar y Programar Siguiente Accion",
  summary: "Nueva funcionalidad para completar una accion actual y programar la siguiente en un solo paso. Un modal permite registrar la accion completada (con fecha de hoy y estado Completada) y la proxima accion (con fecha futura y estado Pendiente), actualizando automaticamente la fecha siguiente accion de la tarea. Accesible desde la pagina de busqueda y la pagina de detalle."
}
```

### Step 5.3: Update Architecture Docs

**File:** `specs/architecture/architecture_backend.md`
- Add new endpoint to the Acciones section (6.2)

**File:** `specs/architecture/architecture_frontend.md`
- Document CompleteAndScheduleDialog in the Shared Feature Components section
- Update SearchPage and DetailPage descriptions

### Step 5.4: Update README.md

Brief mention of the new feature in the project overview if applicable.

---

## Implementation Order Summary

| # | Phase | Files | Depends On |
|---|-------|-------|------------|
| 1 | Backend schema | `schemas.py` | — |
| 2 | Backend endpoint | `routers/acciones.py` | Phase 1 |
| 3 | Backend verify | — | Phase 2 |
| 4 | Frontend dialog | `ActionDialogs.jsx` | Phase 2 |
| 5 | Search integration | `SearchPage.jsx` | Phase 4 |
| 6 | Detail integration | `DetailPage.jsx` | Phase 4 |
| 7 | Version + changelog | `version.js`, `changelog.js` | Phase 5-6 |
| 8 | Architecture docs | `architecture_*.md`, `README.md` | Phase 5-6 |
