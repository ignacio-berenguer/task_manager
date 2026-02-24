# Technical Specification — feature_020: UI Improvements & Bulk Operations

## Overview

This feature covers seven UI improvements spanning the Search page, Detail page, and shared components. Changes are frontend-heavy with one new backend endpoint for bulk operations.

---

## Spec 1: Acciones Ordering & Remove Notas in Search Accordion

**Scope:** `SearchPage.jsx`

**Current behavior:** The accordion already sorts acciones descending by `fecha_accion`. The "Notas Anteriores" section is displayed above the acciones list inside the expanded row.

**Changes:**
- Remove the `notas_anteriores` display block from the `RowWithExpand` component in SearchPage.jsx (the conditional rendering of the "Notas Anteriores" label and `<p>` tag).
- Verify acciones ordering is already descending by `fecha_accion` (it is — no change needed there).

**Files:** `frontend/src/features/search/SearchPage.jsx`

---

## Spec 2: Lighter Tag Colors

**Scope:** `badge.jsx`, `index.css`

**Current behavior:** Badge variants `destructive` (red) and `success` (green) use solid background colors:
- `bg-destructive text-destructive-foreground` → solid `hsl(0 84% 60%)` red with white text
- `bg-success text-white` → solid `hsl(160 84% 36%)` green with white text

**Changes:** Switch from solid bg to a lighter, softer style with colored text on a tinted background:
- `destructive` variant: light red/pink background with dark red text (`bg-destructive/15 text-destructive`)
- `success` variant: light green/teal background with dark green text (`bg-success/15 text-success`)
- `warning` variant: same treatment for consistency (`bg-warning/15 text-warning`)
- Dark mode: slightly increase opacity (`bg-destructive/20`, `bg-success/20`, `bg-warning/20`) for readability

**Files:** `frontend/src/components/ui/badge.jsx`

---

## Spec 3: Estado Dropdown in Tarea Edit Modal

**Scope:** `DetailPage.jsx`

**Current behavior:** The "Estado" field in the edit tarea dialog is a plain `<Input>` allowing arbitrary text.

**Changes:**
- Replace the `<Input>` for estado with a `<select>` dropdown (same pattern as the existing responsable dropdown in the same form).
- Fetch `estados_tareas` from the API (`GET /api/v1/estados-tareas`) on component mount and populate the dropdown.
- The dropdown values come from the `valor` field of each estado, ordered by `orden`.
- Use the existing `estadoOrder.js` or the fetched API data for canonical ordering.

**API used:** `GET /api/v1/estados-tareas` (already exists, returns `[{id, valor, orden, color}]`)

**Files:** `frontend/src/features/detail/DetailPage.jsx`

---

## Spec 4: Fix Close Button on Edit Tarea Modal

**Scope:** `dialog.jsx`

**Root cause:** The `Dialog` component receives `onOpenChange` but does not forward it to `DialogContent` as `onClose`. The `DialogContent` component expects an `onClose` prop for its X button and overlay click, but it's never provided by the parent `Dialog` wrapper.

**Fix:** Modify the `Dialog` component to use React context or clone children to pass `() => onOpenChange(false)` as `onClose` to its `DialogContent` child. This is the cleanest fix since it makes all Dialog usages work automatically without changing every call site.

**Implementation:** Use `React.Children.map` + `cloneElement` to inject `onClose={() => onOpenChange(false)}` into any `DialogContent` child.

**Files:** `frontend/src/components/ui/dialog.jsx`

---

## Spec 5: Multi-Select Tareas in Search Page

**Scope:** `SearchPage.jsx`

**Changes:**
- Add a `selectedIds` state (`Set<number>`) to track selected tarea IDs.
- Add a checkbox column as the first column in the results table:
  - Header: a "select all (visible)" checkbox.
  - Each row: a checkbox bound to `selectedIds.has(row.tarea_id)`.
- Toggle individual selection on checkbox click.
- "Select all" toggles all currently visible/filtered rows.
- Clear selection when search results change (new search executed).
- Show a selection count indicator near the bulk actions toolbar.

**Files:** `frontend/src/features/search/SearchPage.jsx`

---

## Spec 6: Bulk Operations on Selected Tareas

**Scope:** `SearchPage.jsx`, new backend endpoint

### 6a. Bulk Change Date

**UI:** A dialog with a single `DateInput` field for the new date.

**Backend operation (per tarea):**
1. `PUT /tareas/{tarea_id}` with `{ fecha_siguiente_accion: newDate }`
2. For each tarea, fetch its acciones via `GET /acciones/tarea/{tarea_id}`, find those with `estado` matching "Pendiente" (case-insensitive), and `PUT /acciones/{id}` to update their `fecha_accion` to the new date.

**Implementation:** Sequential API calls from the frontend (no new backend endpoint needed since the volume is small and the existing endpoints handle individual updates).

### 6b. Bulk Complete & Create New Action

**UI:** A dialog with:
- Accion description (textarea, required)
- Fecha (DateInput, required)

**Backend operation (per tarea):**
1. Fetch acciones via `GET /acciones/tarea/{tarea_id}`.
2. For each accion with estado matching "Pendiente" (case-insensitive): `PUT /acciones/{id}` with `{ estado: "Completada" }`.
3. `POST /acciones` to create new accion with `{ tarea_id, accion, fecha_accion: date, estado: "Pendiente" }`.
4. The existing sync mechanism will auto-update `fecha_siguiente_accion` on each tarea.

**Implementation:** Sequential API calls from the frontend. A new backend bulk endpoint is added to avoid N+1 API call storms.

### New Backend Endpoint: `POST /api/v1/tareas/bulk-update`

To avoid excessive sequential API calls for bulk operations, add a single bulk endpoint:

```
POST /api/v1/tareas/bulk-update
{
  "tarea_ids": [1, 2, 3],
  "operation": "change_date" | "complete_and_create",
  "fecha": "2026-03-01",           // for both operations
  "accion": "Follow up call"       // only for complete_and_create
}
```

**Backend logic for `change_date`:**
1. For each `tarea_id`: update `fecha_siguiente_accion` to `fecha`.
2. For each tarea's acciones where `estado` is "Pendiente" (case-insensitive): update `fecha_accion` to `fecha`.

**Backend logic for `complete_and_create`:**
1. For each `tarea_id`'s acciones where `estado` is "Pendiente" (case-insensitive): set `estado` to "Completada".
2. Create a new accion for each tarea with the provided `accion` text, `fecha_accion = fecha`, `estado = "Pendiente"`.
3. Sync each tarea's `fecha_siguiente_accion`.

**Response:** `{ "updated_tareas": count, "updated_acciones": count, "created_acciones": count }`

### 6c. Bulk Export to Clipboard

**UI:** Reuse the existing `exportToClipboard` logic but scoped to `selectedIds` instead of all filtered results.

**Implementation:** Filter `filteredData` to only those in `selectedIds`, then apply the same export format.

**Files:**
- `frontend/src/features/search/SearchPage.jsx`
- `backend/app/routers/tareas.py` (new bulk endpoint)
- `backend/app/schemas.py` (new request/response schemas)

---

## Spec 7: "Mark as Completado" Button on Detail Page

**Scope:** `DetailPage.jsx`, new backend endpoint

**UI:** Add a button (e.g., with CheckCircle icon) in the Detail page header actions area (next to the edit and other action buttons). Use a `ConfirmDialog` before executing.

**Backend:** New endpoint `POST /api/v1/tareas/{tarea_id}/complete`

**Logic:**
1. Set tarea's `estado` to "Completado".
2. Find all acciones for this tarea where `estado` is NOT "Completada" and NOT "Completado" (case-insensitive).
3. Set those acciones' `estado` to "Completada".
4. Return the updated tarea and count of updated acciones.

**Response:** `{ "tarea": {...}, "acciones_updated": count }`

**Files:**
- `frontend/src/features/detail/DetailPage.jsx`
- `backend/app/routers/tareas.py` (new complete endpoint)

---

## Summary of Backend Changes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/tareas/bulk-update` | POST | Bulk change date or complete-and-create |
| `/api/v1/tareas/{tarea_id}/complete` | POST | Mark tarea + acciones as completed |

Both new endpoints require authentication (same as existing endpoints).

## Summary of Frontend Changes

| File | Changes |
|------|---------|
| `dialog.jsx` | Fix `onClose` wiring from `Dialog` → `DialogContent` |
| `badge.jsx` | Lighter/softer colors for destructive, success, warning variants |
| `SearchPage.jsx` | Remove notas, add multi-select checkboxes, bulk operations toolbar + dialogs |
| `DetailPage.jsx` | Estado dropdown in edit modal, "Mark as Completado" button |
| `version.js` | Bump minor to 20 |
| `changelog.js` | Add feature_020 entry |
