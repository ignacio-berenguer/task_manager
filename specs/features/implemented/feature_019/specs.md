# Technical Specification: feature_019

## Auto-update `fecha_siguiente_accion` on Accion CRUD

### 1. Overview

When any action (accion) is created, edited, or deleted, the parent tarea's `fecha_siguiente_accion` field must be automatically recalculated as the **maximum `fecha_accion`** among all acciones linked to that tarea that have `estado = 'Pendiente'` (case-insensitive). If no pending acciones exist, `fecha_siguiente_accion` is set to `NULL`.

This logic is currently handled inconsistently:
- **AddAccionDialog** (frontend): Makes a second PUT call to set `fecha_siguiente_accion` to the new accion's date — this is naive (doesn't consider other pending acciones).
- **complete-and-schedule** (backend): Sets `fecha_siguiente_accion` to `req.fecha_siguiente` directly — also naive.
- **Edit accion / Delete accion**: No `fecha_siguiente_accion` update at all.

### 2. Design Decision: Backend-Side Logic

The recalculation will be implemented **entirely in the backend** as a reusable helper function. This ensures consistency regardless of the client (frontend, MCP server, AI agent, direct API calls).

The frontend will be simplified to remove the redundant second PUT call in `AddAccionDialog`.

### 3. Backend Changes

#### 3.1 New Helper Function

**File:** `backend/app/routers/acciones.py`

A module-level helper function:

```python
def _sync_fecha_siguiente_accion(db: Session, tarea_id: int):
    """Recalculate and update the tarea's fecha_siguiente_accion
    based on the max fecha_accion of pending acciones."""
    from sqlalchemy import func

    max_fecha = (
        db.query(func.max(AccionRealizada.fecha_accion))
        .filter(
            AccionRealizada.tarea_id == tarea_id,
            func.lower(AccionRealizada.estado) == 'pendiente'
        )
        .scalar()
    )

    tarea = db.query(Tarea).filter(Tarea.tarea_id == tarea_id).first()
    if tarea:
        tarea.fecha_siguiente_accion = max_fecha  # None if no pending acciones
        tarea.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(tarea)

    return tarea
```

#### 3.2 Endpoints Modified

| Endpoint | Current Behavior | New Behavior |
|----------|-----------------|--------------|
| `POST /acciones` | Creates accion, returns it | Creates accion, calls `_sync_fecha_siguiente_accion`, returns accion + updated tarea |
| `PUT /acciones/{id}` | Updates accion, returns it | Updates accion, calls `_sync_fecha_siguiente_accion`, returns accion + updated tarea |
| `DELETE /acciones/{id}` | Deletes accion, returns message | Deletes accion, calls `_sync_fecha_siguiente_accion`, returns message + updated tarea |
| `POST /acciones/complete-and-schedule` | Sets `fecha_siguiente_accion = req.fecha_siguiente` | Uses `_sync_fecha_siguiente_accion` instead of naive assignment |

**Response format change:** The create, update, and delete endpoints will return the updated tarea in the response so the frontend knows the new `fecha_siguiente_accion` value without an extra GET call. The existing `fetchData()` call already refreshes both tarea and acciones, so this is informational.

#### 3.3 Transaction Handling

The `_sync_fecha_siguiente_accion` helper will commit within the same session. For the `complete-and-schedule` endpoint, the existing transaction flow will be adapted: the helper is called after the acciones are created but before the final commit (or the helper replaces the manual assignment).

### 4. Frontend Changes

#### 4.1 `AddAccionDialog` (`frontend/src/features/shared/ActionDialogs.jsx`)

**Remove** the second API call that manually updates `fecha_siguiente_accion`:
```javascript
// REMOVE this line:
await apiClient.put(`/tareas/${tareaId}`, { fecha_siguiente_accion: form.fecha_accion })
```

The backend now handles this automatically when the accion is created.

#### 4.2 No other frontend changes needed

- `saveEditAccion` (DetailPage): Already calls `fetchData()` after PUT, which will pick up the updated tarea.
- `deleteAccion` (DetailPage): Already calls `fetchData()` after DELETE.
- `CompleteAndScheduleDialog`: Already calls `onSuccess()` which triggers `fetchData()`.

### 5. Edge Cases

| Scenario | Expected Result |
|----------|----------------|
| All acciones are Completada/Cancelada | `fecha_siguiente_accion = NULL` |
| No acciones exist for tarea | `fecha_siguiente_accion = NULL` |
| Single pending accion with fecha | `fecha_siguiente_accion = that fecha` |
| Multiple pending acciones | `fecha_siguiente_accion = max(fecha_accion)` |
| Pending accion with NULL fecha_accion | Ignored by MAX (SQL MAX ignores NULLs) |
| Estado comparison: "PENDIENTE", "pendiente", "Pendiente" | All match (case-insensitive via `func.lower()`) |
| Edit accion: change estado from Pendiente to Completada | Recalculates — may set to NULL or lower date |
| Edit accion: change fecha_accion | Recalculates with new date |
| Delete the only pending accion | `fecha_siguiente_accion = NULL` |

### 6. Logging

- Log at INFO level when `fecha_siguiente_accion` is recalculated: include `tarea_id`, old value, new value.
- Log at DEBUG level the query details (number of pending acciones found).

### 7. No Schema Changes

No database schema changes are needed. The existing `fecha_siguiente_accion` DATE column on `tareas` and `estado` TEXT column on `acciones_realizadas` are sufficient.

### 8. No Configuration Changes

No new environment variables or configuration is needed.
