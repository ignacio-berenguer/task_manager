# Plan — feature_025: Completar y Programar pre-fill pending action

## Phase 1: Backend — Accept optional `accion_existente_id`

### Step 1.1: Update schema
**File:** `backend/app/schemas.py`
- Add `accion_existente_id: int | None = None` to `CompleteAndScheduleRequest`.

### Step 1.2: Update endpoint logic
**File:** `backend/app/routers/acciones.py` — `complete_and_schedule()`

Replace the unconditional `accion1 = AccionRealizada(...)` / `db.add(accion1)` block with:

```
if req.accion_existente_id:
    # Fetch existing accion
    accion1 = db.query(AccionRealizada).filter(AccionRealizada.id == req.accion_existente_id).first()
    # Validate: exists + belongs to tarea_id
    if not accion1 or accion1.tarea_id != req.tarea_id:
        raise HTTPException(400, "Accion no encontrada o no pertenece a la tarea")
    # Update in place
    accion1.accion = req.accion_completada
    accion1.fecha_accion = date.today()
    accion1.estado = "Completada"
    accion1.fecha_actualizacion = datetime.now()
else:
    # Current behavior: create new
    accion1 = AccionRealizada(
        tarea_id=req.tarea_id,
        accion=req.accion_completada,
        fecha_accion=date.today(),
        estado="Completada",
    )
    db.add(accion1)
```

The rest of the function (accion2, commit, sync, return) remains unchanged.

### Step 1.3: Verify
- Test via Swagger: call with `accion_existente_id` pointing to a real pending accion → confirm it updates instead of creating.
- Call without `accion_existente_id` → confirm old behavior is preserved.

---

## Phase 2: Frontend — Dialog self-fetches and pre-fills

### Step 2.1: Add pending action detection to `CompleteAndScheduleDialog`
**File:** `frontend/src/features/shared/ActionDialogs.jsx`

Add state and an effect inside `CompleteAndScheduleDialog`:

```jsx
const [pendingAccion, setPendingAccion] = useState(null)

useEffect(() => {
  if (open && tareaId) {
    apiClient.get(`/acciones/tarea/${tareaId}`)
      .then(res => {
        const pending = res.data
          .filter(a => a.estado && ['pendiente', 'en progreso'].includes(a.estado.toLowerCase()))
          .sort((a, b) => (b.fecha_accion || '').localeCompare(a.fecha_accion || ''))
        if (pending.length > 0) {
          setPendingAccion(pending[0])
          setForm(f => ({ ...f, accion_completada: pending[0].accion || '' }))
        }
      })
      .catch(() => setPendingAccion(null))
  }
  if (!open) {
    setPendingAccion(null)
  }
}, [open, tareaId])
```

### Step 2.2: Send `accion_existente_id` in payload
In `handleSave`, add the field when a pending action was pre-filled:

```jsx
const payload = {
  tarea_id: tareaId,
  accion_completada: form.accion_completada.trim(),
  fecha_siguiente: form.fecha_siguiente,
}
if (pendingAccion) {
  payload.accion_existente_id = pendingAccion.id
}
if (form.accion_siguiente.trim()) {
  payload.accion_siguiente = form.accion_siguiente.trim()
}
```

### Step 2.3: Visual indication
Below the "Accion Completada" textarea, conditionally show:

```jsx
{pendingAccion && (
  <p className="text-xs text-muted-foreground italic">
    Accion pendiente actual — edita si es necesario
  </p>
)}
```

Keep the existing helper text ("Se registrara con fecha de hoy y estado Completada") for both cases.

---

## Phase 3: Verification & Docs

### Step 3.1: Test both pages
- **SearchPage:** Click "Completar y Programar" on a task with a pending action → verify pre-fill.
- **DetailPage:** Same test.
- Both: verify tasks WITHOUT pending actions still show empty field.
- Both: verify saving with and without "Siguiente Accion".

### Step 3.2: Update docs
- `frontend/src/lib/version.js` — bump minor to 25.
- `frontend/src/lib/changelog.js` — add entry for feature_025.
- `README.md` — update if needed.
- `specs/architecture/architecture_frontend.md` — note dialog self-fetch pattern.

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `backend/app/schemas.py` | Edit | Add `accion_existente_id` optional field |
| `backend/app/routers/acciones.py` | Edit | Branch logic: update existing vs create new |
| `frontend/src/features/shared/ActionDialogs.jsx` | Edit | Self-fetch pending accion, pre-fill, send ID |
| `frontend/src/lib/version.js` | Edit | Bump version |
| `frontend/src/lib/changelog.js` | Edit | Add changelog entry |
