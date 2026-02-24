# Implementation Plan: feature_019

## Auto-update `fecha_siguiente_accion` on Accion CRUD

### Phase 1: Backend — Helper Function

**File:** `backend/app/routers/acciones.py`

1. Add a `_sync_fecha_siguiente_accion(db, tarea_id)` helper function at module level (after imports, before route handlers):
   - Query `MAX(fecha_accion)` from `acciones_realizadas` where `tarea_id` matches and `LOWER(estado) = 'pendiente'`
   - Fetch the parent `Tarea` by `tarea_id`
   - Log the old and new `fecha_siguiente_accion` values at INFO level
   - Update `tarea.fecha_siguiente_accion` to the computed max (or `None`)
   - Update `tarea.fecha_actualizacion` to `datetime.now()`
   - Do NOT commit — let the caller control the transaction

### Phase 2: Backend — Modify Accion Endpoints

**File:** `backend/app/routers/acciones.py`

2. **`POST /acciones` (create_accion):**
   - After `crud_acciones.create(db, ...)`, call `_sync_fecha_siguiente_accion(db, accion_in.tarea_id)`
   - Note: `CRUDBase.create` already commits, so the helper should commit separately or we restructure slightly. Simplest: call the helper after create (it reads the freshly-committed accion), and the helper does its own commit.

3. **`PUT /acciones/{id}` (update_accion):**
   - After `crud_acciones.update(db, ...)`, call `_sync_fecha_siguiente_accion(db, item.tarea_id)`
   - The `tarea_id` is obtained from the existing `item` (the accion being updated)

4. **`DELETE /acciones/{id}` (delete_accion):**
   - Before deleting, capture the `tarea_id` from the accion record
   - After `crud_acciones.delete(db, id)`, call `_sync_fecha_siguiente_accion(db, tarea_id)`

5. **`POST /acciones/complete-and-schedule` (complete_and_schedule):**
   - Replace the line `tarea.fecha_siguiente_accion = req.fecha_siguiente` with a call to `_sync_fecha_siguiente_accion(db, req.tarea_id)`
   - The helper will compute the correct max date from all pending acciones (including the newly created one)
   - Adjust transaction: the existing endpoint does a single commit at the end. Call `_sync_fecha_siguiente_accion` after `db.commit()` and `db.refresh()` so the new acciones are visible to the query.

### Phase 3: Frontend — Remove Redundant PUT Call

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

6. In `AddAccionDialog.handleSave`:
   - Remove the second API call: `await apiClient.put(`/tareas/${tareaId}`, { fecha_siguiente_accion: form.fecha_accion })`
   - The backend now handles `fecha_siguiente_accion` update automatically on accion creation

### Phase 4: Testing

7. Manual verification scenarios:
   - Create a new accion with estado Pendiente → verify tarea's `fecha_siguiente_accion` updates
   - Edit an accion: change fecha_accion → verify recalculation
   - Edit an accion: change estado from Pendiente to Completada → verify `fecha_siguiente_accion` changes or becomes NULL
   - Delete the last pending accion → verify `fecha_siguiente_accion` becomes NULL
   - Complete & Schedule → verify `fecha_siguiente_accion` reflects the new pending accion's date
   - Case insensitivity: create accion with estado "PENDIENTE" vs "Pendiente" → both should count

### Phase 5: Documentation & Versioning

8. Update `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 19
9. Update `frontend/src/lib/changelog.js` — add entry for feature_019
10. Update `specs/architecture/architecture_backend.md` — document the `_sync_fecha_siguiente_accion` behavior in the Acciones section
11. Update `README.md` if needed

### Files Modified

| File | Change |
|------|--------|
| `backend/app/routers/acciones.py` | Add helper function, modify 4 endpoints |
| `frontend/src/features/shared/ActionDialogs.jsx` | Remove redundant PUT call in AddAccionDialog |
| `frontend/src/lib/version.js` | Bump minor to 19 |
| `frontend/src/lib/changelog.js` | Add feature_019 entry |
| `specs/architecture/architecture_backend.md` | Document auto-sync behavior |
| `README.md` | Minor update if needed |

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `CRUDBase.create/update/delete` already commits — calling helper after may create separate transactions | Acceptable: the helper reads committed data and does its own commit. If the helper fails, the accion change is saved but fecha is stale — next operation will fix it. |
| `complete-and-schedule` transaction flow change | Call helper after the existing commit, ensuring new acciones are visible |
| Frontend still has the old code if not updated | Phase 3 removes it — but even without it, the backend ensures correctness |
