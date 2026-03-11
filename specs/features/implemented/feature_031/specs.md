# Technical Specification — feature_029

## Overview

Five UX and data-consistency improvements across the frontend (and one backend change):

1. **Auto-focus first control** in all modal dialogs
2. **Tab order fix** in CompleteAndScheduleDialog: Tab from last field → Aceptar button
3. **Search refresh** after tarea changes in Detail page
4. **"Completar acción" icon button** on accion list items in Detail page
5. **Fecha propagation** to minimum-fecha pending acciones when changing tarea's fecha_siguiente_accion from Search

---

## Requirement 1: Auto-focus First Control in Modal Forms

### Current State

Some dialogs already auto-focus via `setTimeout(() => ref.current?.focus(), 50)`:
- `AddAccionDialog` → focuses textarea ✓
- `CompleteAndScheduleDialog` → focuses textarea ✓
- `CambiarFechaDialog` → focuses DatePicker button ✓
- `BulkCompleteCreateDialog` → focuses textarea ✓

Missing auto-focus:
- **Edit Tarea dialog** (in DetailPage, inline) — no auto-focus
- **Edit Accion dialog** (in DetailPage, inline) — no auto-focus
- **Nueva Tarea dialog** (in SearchPage, inline) — no auto-focus
- **BulkChangeDateDialog** (in SearchPage) — no auto-focus
- **ColumnConfigurator** — no auto-focus (but this is not a form, skip)
- **ConfirmDialog** — no auto-focus on confirm button

### Design Decision

Add auto-focus to each dialog individually using `useEffect` + `useRef` + `setTimeout(…, 50)` pattern already established in the codebase. This is consistent with the existing approach and avoids changes to the base `Dialog` component.

### Dialogs to Update

| Dialog | File | First Control | Focus Target |
|--------|------|---------------|--------------|
| Edit Tarea | `DetailPage.jsx` | `tarea` input | input ref |
| Edit Accion | `DetailPage.jsx` | `accion` textarea | textarea ref |
| Nueva Tarea | `SearchPage.jsx` | `tarea` input | input ref |
| BulkChangeDateDialog | `SearchPage.jsx` | DatePicker button | datePickerRef → button |
| ConfirmDialog | `confirm-dialog.jsx` | Confirm button | button ref |

---

## Requirement 2: Tab from Next Action Description → Aceptar Button

### Current State

In `CompleteAndScheduleDialog`, the form layout is:
1. "Accion Completada" textarea
2. "Fecha Siguiente Accion" DateInput (DatePicker button in tab order, ± buttons have tabIndex={-1})
3. "Siguiente Accion" textarea
4. DialogFooter: Cancel button → Aceptar button

After typing in the "Siguiente Accion" textarea and pressing Tab, focus currently moves to the Cancel button (DOM order). The user wants Tab to go directly to the Aceptar button.

### Design Decision

Set `tabIndex={-1}` on the Cancel button in `CompleteAndScheduleDialog` so Tab from the last textarea skips Cancel and lands on Aceptar. The Cancel button remains clickable and accessible via Escape key (which already closes all dialogs). This is a minimal, targeted change.

Apply this same pattern to `AddAccionDialog` as well — after the DateInput, Tab should reach Aceptar directly.

---

## Requirement 3: Refresh Search Results After Tarea Changes in Detail Page

### Current State

- SearchPage uses a **module-level cache** (`searchStateCache`) to persist results across navigation
- DetailPage modifies tareas/acciones via API, then calls `fetchData()` locally
- When user navigates back via `navigate(-1)`, SearchPage restores from cache — showing **stale data**
- React Query is configured but **not used** for data fetching

### Design Decision

Introduce a **module-level dirty flag** in SearchPage (`searchDirtyFlag`). When DetailPage performs any mutation (edit tarea, add/edit/delete accion, complete & schedule, change fecha, mark complete), it sets this flag before navigating back. On mount, SearchPage checks the flag — if dirty, it re-executes the current search to get fresh data.

**Implementation:**
- Export a `markSearchDirty()` function from SearchPage (sets module-level boolean)
- In DetailPage, call `markSearchDirty()` inside every `onSuccess` callback (the callbacks that run after successful mutations)
- In SearchPage mount logic, check the dirty flag → if true, clear flag and call `doSearch(page)` instead of restoring from cache

This approach is simple, requires no new dependencies, and fits the existing module-level caching pattern.

---

## Requirement 4: "Completar acción" Icon Button on Accion List Items

### Current State

In DetailPage, each accion row (desktop table and mobile card) has:
- **Edit button** (Pencil icon)
- **Delete button** (Trash icon)

No quick-complete button exists.

### Design Decision

Add a **CheckCircle icon button** to each accion row that is NOT already in "Completada" estado. Clicking it:

1. Calls `PUT /acciones/{id}` with `{ estado: "Completada" }` (no confirmation dialog needed — it's a single-field update)
2. On success, calls `fetchData()` to refresh the accion list
3. Shows a success toast

**Placement:** Before the Edit button (leftmost action), using a green/check-themed icon.

**Visibility:** Only shown when `accion.estado !== "Completada"` — already-completed acciones don't show the button.

**Backend:** No changes needed — `PUT /acciones/{id}` already supports partial updates including estado. The `_sync_fecha_siguiente_accion` helper auto-recalculates the tarea's fecha after accion estado changes.

---

## Requirement 5: Propagate Fecha Changes to Minimum-Fecha Pending Acciones

### Current State

**CambiarFechaDialog** (used in both Search and Detail):
- Calls `PUT /tareas/{tarea_id}` with `{ fecha_siguiente_accion: new_fecha }`
- Does NOT touch any acciones

**Bulk update endpoint** (`POST /tareas/bulk-update` with `operation="change_date"`):
- Updates tarea's fecha AND **ALL** pending acciones to the same date
- This is too broad for the requirement

### Requirement Clarification

When changing a tarea's `fecha_siguiente_accion`:
1. Find all acciones with `estado = "Pendiente"`
2. Among those, find the **minimum** `fecha_accion` value
3. Update only the pending acciones that have that minimum fecha to the **new** fecha
4. The result: `tarea.fecha_siguiente_accion = min(pending acciones' fecha_accion) = new_fecha`

This ensures consistency: the tarea's next-action date matches the earliest pending accion date.

### Design Decision

**Backend approach** — create a new endpoint or modify existing behavior to handle this atomically:

Add a new endpoint: `PUT /tareas/{tarea_id}/cambiar-fecha` that:
1. Updates `tarea.fecha_siguiente_accion` to the new fecha
2. Queries pending acciones for this tarea
3. Finds the minimum `fecha_accion` among pending acciones
4. Updates all pending acciones with that minimum fecha to the new fecha
5. Returns `{ updated_tarea: true, updated_acciones: int }`

**Frontend:** Modify `CambiarFechaDialog` to call this new endpoint instead of the generic `PUT /tareas/{id}`.

**Why a new endpoint instead of frontend logic:**
- Atomic operation (no partial failure states)
- Single HTTP round-trip
- Business logic stays server-side
- Consistent with existing patterns (e.g., `complete-and-schedule`, `bulk-update`)

---

## Files to Modify

### Backend
| File | Change |
|------|--------|
| `backend/app/routers/tareas.py` | Add `PUT /{tarea_id}/cambiar-fecha` endpoint |
| `backend/app/schemas.py` | Add `CambiarFechaRequest` and `CambiarFechaResponse` schemas |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/features/shared/ActionDialogs.jsx` | Update CambiarFechaDialog API call; adjust tab order in CompleteAndScheduleDialog and AddAccionDialog |
| `frontend/src/features/detail/DetailPage.jsx` | Add auto-focus to Edit Tarea/Accion dialogs; add "Completar acción" button; call `markSearchDirty()` on mutations |
| `frontend/src/features/search/SearchPage.jsx` | Add dirty flag mechanism; add auto-focus to Nueva Tarea and BulkChangeDateDialog; export `markSearchDirty()` |
| `frontend/src/components/ui/confirm-dialog.jsx` | Add auto-focus on confirm button |
| `frontend/src/lib/version.js` | Increment minor version |
| `frontend/src/lib/changelog.js` | Add changelog entry |

### Docs
| File | Change |
|------|--------|
| `README.md` | Document new endpoint |
| `specs/architecture/architecture_backend.md` | Document `PUT /tareas/{id}/cambiar-fecha` |
| `specs/architecture/architecture_frontend.md` | Document dirty flag pattern, new UI button |
