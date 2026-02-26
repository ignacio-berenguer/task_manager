# Specs — feature_025: Completar y Programar pre-fill pending action

## Overview

Enhance the "Completar y Programar" dialog so that when a task has a pending action, the dialog pre-fills the "Accion Completada" field with that action's text. On save, the existing action is **updated** to "Completada" instead of creating a duplicate. A new action is only created when the user fills in "Siguiente Accion".

## Current Behavior

1. Dialog opens with an empty "Accion Completada" textarea.
2. On save, backend **always creates** a new `AccionRealizada` with estado="Completada".
3. If "Siguiente Accion" is provided, a second new `AccionRealizada` is created with estado="Pendiente".
4. Any pre-existing pending action remains untouched (not completed).

## Target Behavior

1. When opening the dialog, the frontend identifies the most recent pending action for the task.
2. If a pending action exists:
   - Pre-fill "Accion Completada" with the pending action's text.
   - Show a subtle visual hint (e.g., small info text) indicating this is an existing action.
   - On save, the backend **updates** the existing action (sets estado="Completada", updates text if edited, sets fecha_accion to today).
3. If no pending action exists:
   - Dialog behaves exactly as before (empty field, creates a new completed action).
4. "Siguiente Accion" behavior is unchanged — always creates a new pendiente action.

## Technical Design

### Frontend Changes

#### `CompleteAndScheduleDialog` (ActionDialogs.jsx)

**New prop:**
- `pendingAccion` — object `{ id, accion }` or `null`. Passed by the parent component. When non-null, pre-fills the form and enables update-mode.

**Form state changes:**
- On open (via `useEffect` on `open` + `pendingAccion`):
  - If `pendingAccion` is provided: set `accion_completada` to `pendingAccion.accion`.
  - Otherwise: set `accion_completada` to `''` (current behavior).

**Payload changes:**
- If `pendingAccion` is present, include `accion_existente_id: pendingAccion.id` in the API payload.
- Otherwise: payload is unchanged (no `accion_existente_id` field).

**Visual indication:**
- When pre-filled from a pending action, show a small helper text below the textarea: "Accion pendiente actual — edita si es necesario" (muted color, italic).
- When no pending action: show current helper text unchanged.

#### `SearchPage.jsx`

Currently stores `completeScheduleTarget` as `{ tarea_id }`. Change to also resolve the pending action:

- The SearchPage already has acciones data in the expanded rows (`RowWithExpand` fetches acciones). However, acciones are fetched per-row only on expand and not always available.
- **Approach:** Store `{ tarea_id, pendingAccion }` in `completeScheduleTarget`. When triggering the dialog, find the pending action from the expanded row's acciones if available, or pass `null` and let the dialog fetch it.
- **Simpler approach (chosen):** Have the dialog itself fetch the pending action when it opens, using `GET /acciones/tarea/{tarea_id}`. This avoids coupling with the parent's data and works consistently for both SearchPage and DetailPage.

#### `DetailPage.jsx`

The DetailPage already fetches acciones in `fetchData()`. The pending action can be derived from the `acciones` state.

- **However**, for consistency with SearchPage (where acciones may not be loaded), the dialog will self-fetch.

#### Dialog Self-Fetch Strategy (chosen approach)

When the dialog opens (`open` transitions to `true`):
1. Call `GET /acciones/tarea/{tareaId}`.
2. Filter for acciones with estado matching "Pendiente" or "En Progreso" (case-insensitive).
3. Sort by `fecha_accion` descending, take the first one.
4. If found: pre-fill `accion_completada` and store `pendingAccionId` in local state.
5. If not found: leave empty (current behavior).

This keeps both parents simple — they just pass `tareaId` as before, no new props needed.

### Backend Changes

#### `POST /acciones/complete-and-schedule` (acciones.py)

**Schema change** — add optional field to `CompleteAndScheduleRequest`:
```python
accion_existente_id: int | None = None  # ID of existing accion to update
```

**Logic change:**
- If `accion_existente_id` is provided:
  - Fetch the existing `AccionRealizada` by ID.
  - Validate it belongs to the given `tarea_id` (security check).
  - Update it: `accion = req.accion_completada`, `fecha_accion = date.today()`, `estado = "Completada"`.
  - Do NOT create a new accion1.
- If `accion_existente_id` is not provided:
  - Create a new `AccionRealizada` as before (current behavior preserved).
- The rest (accion2 for siguiente, sync fecha) remains unchanged.

### No Other Backend Changes Needed

- `GET /acciones/tarea/{tarea_id}` already returns all acciones for a task (including estado).
- `_sync_fecha_siguiente_accion` already recalculates correctly after any mutation.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Task has multiple pending acciones | Dialog picks the most recent by `fecha_accion` |
| Pending accion was deleted between dialog open and save | Backend returns 404 for the accion_existente_id; dialog shows error toast |
| User clears the pre-filled text entirely | Validation prevents save (accion_completada is required) |
| accion_existente_id doesn't belong to tarea_id | Backend returns 400 (security validation) |
| Dialog opened, closed, reopened | State resets and re-fetches on each open |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/shared/ActionDialogs.jsx` | Self-fetch pending accion on open, pre-fill form, send `accion_existente_id` |
| `backend/app/schemas.py` | Add `accion_existente_id` optional field to `CompleteAndScheduleRequest` |
| `backend/app/routers/acciones.py` | Handle `accion_existente_id` — update existing vs create new |
