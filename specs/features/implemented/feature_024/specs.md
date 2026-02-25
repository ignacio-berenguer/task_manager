# Feature 024 — Technical Specification

## Overview

Fix and enhance the Create Task and Edit Task dialogs to properly handle estado defaults, next-action fields, and estado dropdown population.

Three issues to address:

1. **Create Task dialog** — Default estado to "En curso", add next-action fields, auto-create an accion on task creation.
2. **Edit Task dialog** — Fix estado dropdown to reflect the current value and include "En curso" as a selectable option.
3. **Estado seed data** — Add "En curso" to `estados_tareas` parametric table so it appears in dropdowns backed by that table.

## Current State Analysis

### Create Task Dialog (SearchPage.jsx)

- Located in `frontend/src/features/search/SearchPage.jsx` (lines 1046-1104).
- Fields: `tarea` (required), `responsable`, `tema`, `estado` — all optional except tarea.
- Initial form state: `{ tarea: '', responsable: '', tema: '', estado: '' }` — no default estado.
- Estado dropdown populated from `filterOptions.estados` (distinct values from existing tareas via `GET /tareas/filter-options`).
- Handler `handleNewTarea` calls `POST /tareas` with the form data — no accion is created.
- After creation, form resets to all-empty values.

### Edit Task Dialog (DetailPage.jsx)

- Located in `frontend/src/features/detail/DetailPage.jsx` (lines 448-510).
- Fields: `tarea`, `responsable`, `descripcion`, `fecha_siguiente_accion`, `tema`, `estado`.
- Estado dropdown populated from `estadosTarea` fetched via `GET /estados-tareas` (parametric table).
- **Bug**: The parametric table `estados_tareas` was seeded with: Pendiente, En Progreso, Completada, Cancelada. The actual active-task estado used throughout the app is "En curso" — which is NOT in the seed data. If a tarea has `estado = "En curso"`, the dropdown shows "-- Seleccionar --" instead of the correct value, and "En curso" is not available for selection.
- The `openEdit` function correctly copies `tarea.estado` into `editForm.estado`, but since no `<option>` has `value="En curso"`, the `<select>` falls back to the empty placeholder.

### Backend

- `POST /tareas` — Creates a tarea only. No accion is created. No combined endpoint exists.
- `POST /acciones` — Creates an accion and **auto-syncs** `tarea.fecha_siguiente_accion` to the max `fecha_accion` of all pending acciones via `_sync_fecha_siguiente_accion()`.
- `GET /estados-tareas` — Returns all rows from `estados_tareas` ordered by `orden`.
- `GET /tareas/filter-options` — Returns distinct estado values from existing tareas.

### estadoOrder.js

- Current order: `['Pendiente', 'En Progreso', 'Completada', 'Cancelada']`.
- Does NOT include "En curso".

## Technical Design

### Change 1: Add "En curso" to estados_tareas seed data

**File**: `db/schema.sql`

Add "En curso" to the `INSERT INTO estados_tareas` seed data with `orden = 2`, shifting existing values:

```
Pendiente (1), En curso (2), En Progreso (3), Completada (4), Cancelada (5)
```

This ensures that new database instances include "En curso" and that the `GET /estados-tareas` endpoint returns it.

> **Note for existing databases**: If "En curso" already exists in the `estados_tareas` table (added manually), no migration is needed. The `ON CONFLICT DO NOTHING` clause prevents duplicates.

### Change 2: Update estadoOrder.js

**File**: `frontend/src/lib/estadoOrder.js`

Add "En curso" to the `ESTADO_ORDER` array after "Pendiente":

```js
export const ESTADO_ORDER = [
  'Pendiente',
  'En curso',
  'En Progreso',
  'Completada',
  'Cancelada'
]
```

### Change 3: Enhance Create Task dialog

**File**: `frontend/src/features/search/SearchPage.jsx`

#### 3a. Default estado

Change the initial `newTareaForm` state to default `estado: 'En curso'`.

Change the reset after creation to also default `estado: 'En curso'`.

#### 3b. Add next-action fields

Add two new fields to the create dialog (below the Estado field):

- **Próxima Acción** — Text input for the action description (optional but recommended).
- **Fecha Próxima Acción** — Date input using the existing `DateInput` component (optional but recommended).

These fields are stored in local form state only (e.g., `proxima_accion` and `fecha_proxima_accion`) and are NOT sent to the `POST /tareas` endpoint directly.

#### 3c. Auto-create accion after tarea creation

After `POST /tareas` succeeds and returns the new `tarea_id`:

1. If `proxima_accion` or `fecha_proxima_accion` have values:
   - Call `POST /acciones` with:
     ```json
     {
       "tarea_id": <new tarea_id>,
       "accion": "<proxima_accion text>",
       "fecha_accion": "<fecha_proxima_accion>",
       "estado": "Pendiente"
     }
     ```
   - The backend's `_sync_fecha_siguiente_accion()` will automatically update the tarea's `fecha_siguiente_accion`.
2. If both fields are empty, skip accion creation (tarea is created without an initial action).

#### 3d. Estado dropdown source

Change the estado dropdown in the create dialog to use the `estados-tareas` parametric table (same as the edit dialog) instead of `filterOptions.estados`. This ensures all valid estados are shown — including "En curso" even if no existing tarea has that estado yet.

To do this, add a fetch for `GET /estados-tareas` in SearchPage (or reuse filterOptions but augment the create dialog's dropdown). The simplest approach: fetch `/estados-tareas` once and use it for the create dialog's estado dropdown.

### Change 4: Fix Edit Task dialog estado dropdown

**File**: `frontend/src/features/detail/DetailPage.jsx`

The dropdown code is already correct structurally — it binds `value={editForm.estado}` and maps `estadosTarea` from `/estados-tareas`. The bug is that "En curso" is missing from the `estados_tareas` table.

After Change 1 (adding "En curso" to seed data / parametric table), the dropdown will:
- Include "En curso" as an option.
- Correctly show the current tarea's estado as selected (since the value now matches an option).

**Defensive fallback**: Additionally, if the current tarea's estado is not found in the fetched `estadosTarea` list (e.g., due to custom/legacy values), ensure it still appears as a selected option by adding it to the dropdown options dynamically.

## Files to Modify

| File | Change |
|------|--------|
| `db/schema.sql` | Add "En curso" to estados_tareas seed data |
| `frontend/src/lib/estadoOrder.js` | Add "En curso" to ESTADO_ORDER |
| `frontend/src/features/search/SearchPage.jsx` | Default estado, add accion fields, fetch estados-tareas, auto-create accion |
| `frontend/src/features/detail/DetailPage.jsx` | Defensive fallback for estado dropdown |
| `frontend/src/lib/version.js` | Increment minor version |
| `frontend/src/lib/changelog.js` | Add changelog entry |

## No Backend Changes Required

All required backend functionality already exists:
- `POST /tareas` — Create tarea with estado.
- `POST /acciones` — Create accion with auto-sync of `fecha_siguiente_accion`.
- `GET /estados-tareas` — Returns all valid estados.

The frontend will use two sequential API calls (create tarea, then create accion) which is simple and follows existing patterns.
