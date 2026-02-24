# Technical Specification: feature_017 — Complete & Schedule Next Action

## 1. Overview

This feature adds a "Complete & Schedule Next" workflow that allows users to complete a current action and schedule a follow-up action for a tarea in a single modal interaction. It performs three operations atomically:

1. Creates **accion1** (completed) with `estado = "Completada"`, `fecha_accion = today`
2. Creates **accion2** (scheduled) with `estado = "Pendiente"`, `fecha_accion = user-specified future date`
3. Updates the parent tarea's `fecha_siguiente_accion` to accion2's date

## 2. Backend

### 2.1 New Endpoint

**`POST /api/v1/acciones/complete-and-schedule`**

A new endpoint on the existing acciones router that performs all three operations in a single database transaction.

**Request body (Pydantic schema: `CompleteAndScheduleRequest`):**

```json
{
  "tarea_id": 42,
  "accion_completada": "Called the client and confirmed the order",
  "accion_siguiente": "Follow up on delivery status",
  "fecha_siguiente": "2026-03-10"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tarea_id` | int | Yes | Parent tarea ID |
| `accion_completada` | str | Yes | Description of the action being completed |
| `accion_siguiente` | str | Yes | Description of the next scheduled action |
| `fecha_siguiente` | date | Yes | Date for the next action and tarea's fecha_siguiente_accion |

**Response (201):**

```json
{
  "accion_completada": { "id": 101, "tarea_id": 42, "accion": "...", "fecha_accion": "2026-02-24", "estado": "Completada", ... },
  "accion_siguiente": { "id": 102, "tarea_id": 42, "accion": "...", "fecha_accion": "2026-03-10", "estado": "Pendiente", ... },
  "tarea": { "tarea_id": 42, "fecha_siguiente_accion": "2026-03-10", ... }
}
```

**Error responses:**
- `404`: Tarea not found
- `422`: Validation error (missing fields, invalid date)

### 2.2 Implementation Details

- The endpoint is defined in `routers/acciones.py`, placed **before** the `GET /{id}` dynamic route (FastAPI route ordering rule)
- Uses a single database session with explicit transaction control: create both acciones and update tarea, then commit once
- `fecha_accion` for accion1 is set server-side to `date.today()` (not client-supplied) for consistency
- Estado values use the canonical database values: `"Completada"` for accion1, `"Pendiente"` for accion2
- The tarea's `fecha_actualizacion` is set to `datetime.now()` when updating `fecha_siguiente_accion`
- Validates that `tarea_id` exists before performing any operations

### 2.3 Schema Addition

Add `CompleteAndScheduleRequest` to `schemas.py`:

```python
class CompleteAndScheduleRequest(BaseModel):
    tarea_id: int
    accion_completada: str
    accion_siguiente: str
    fecha_siguiente: date
```

## 3. Frontend

### 3.1 New Dialog Component

**`CompleteAndScheduleDialog`** — added to `features/shared/ActionDialogs.jsx` alongside existing dialogs.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls dialog visibility |
| `onOpenChange` | function | Callback to toggle open state |
| `tareaId` | number | Parent tarea ID |
| `onSuccess` | function | Callback after successful save (to refresh data) |

**Form fields:**

1. **Accion Completada** — textarea (required), description of the completed action
2. **Siguiente Accion** — textarea (required), description of the next action
3. **Fecha Siguiente Accion** — DatePicker (required), date for the next action

**Behavior:**

- On open: resets form, focuses the first textarea
- Ctrl+Enter submits the form
- Calls `POST /acciones/complete-and-schedule` with all fields
- Shows toast on success/error (using sonner)
- Calls `onSuccess` callback on success to refresh parent data

**UI layout:**

- Dialog title: "Completar y Programar Siguiente"
- Two sections visually separated:
  - Section 1: "Accion Completada" label + textarea (with hint: "Se registrara con fecha de hoy")
  - Section 2: "Siguiente Accion" label + textarea + DatePicker
- Footer: "Cancelar" (outline) + "Guardar" (primary, disabled while saving or if required fields empty)

### 3.2 Search Page Integration

Add a new action button in the `RowWithExpand` component's action column, alongside the existing "Añadir Accion" and "Cambiar Fecha" buttons.

- **Icon:** `CheckSquare` (from lucide-react) or similar icon that conveys "complete + schedule"
- **Tooltip:** "Completar y Programar Siguiente"
- **State:** `completeScheduleTarget` (same pattern as `addAccionTarget`)
- **onSuccess:** triggers `doSearch(page)` to refresh results

### 3.3 Detail Page Integration

Add a new button in the "Acciones Realizadas" card header, next to the existing "Nueva Accion" button.

- **Button label:** "Completar y Programar" (hidden on mobile, icon-only)
- **Icon:** `CheckSquare` or `ListChecks`
- **State:** `completeScheduleOpen` boolean (same pattern as `addAccionOpen`)
- **onSuccess:** triggers `fetchData()` to refresh detail data

### 3.4 Estado Values

The feature uses the canonical estado values from the `estados_acciones` table:
- `"Completada"` for the action being completed
- `"Pendiente"` for the next scheduled action

Note: The existing `AddAccionDialog` uses `'PENDIENTE'` (all caps). This is an existing inconsistency in the codebase — this feature will use the correct cased values matching the database.

## 4. No Configuration Changes

No new environment variables or configuration is required. The feature uses existing API authentication and logging infrastructure.

## 5. Version & Changelog

- Increment `APP_VERSION.minor` to 17 in `frontend/src/lib/version.js`
- Add changelog entry at the top of `frontend/src/lib/changelog.js`:
  - version: "1.017"
  - feature: 17
  - title: "Completar y Programar Siguiente Accion"
  - summary: Description of the feature

## 6. Files Modified

| File | Change |
|------|--------|
| `backend/app/schemas.py` | Add `CompleteAndScheduleRequest` schema |
| `backend/app/routers/acciones.py` | Add `POST /complete-and-schedule` endpoint |
| `frontend/src/features/shared/ActionDialogs.jsx` | Add `CompleteAndScheduleDialog` component |
| `frontend/src/features/search/SearchPage.jsx` | Add button + state for new dialog |
| `frontend/src/features/detail/DetailPage.jsx` | Add button + state for new dialog |
| `frontend/src/lib/version.js` | Bump to minor 17 |
| `frontend/src/lib/changelog.js` | Add feature 17 entry |
| `specs/architecture/architecture_backend.md` | Document new endpoint |
| `specs/architecture/architecture_frontend.md` | Document new dialog and integration |
| `README.md` | Update feature list |
