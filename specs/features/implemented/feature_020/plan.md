# Implementation Plan — feature_020: UI Improvements & Bulk Operations

## Phase 1: Bug Fixes & Small UI Tweaks (no new endpoints)

### Step 1.1: Fix Dialog close button (`dialog.jsx`)
- In the `Dialog` component, use `React.Children.map` + `cloneElement` to inject `onClose={() => onOpenChange(false)}` into `DialogContent` children.
- This automatically fixes the X button and overlay click for ALL dialog usages.
- **File:** `frontend/src/components/ui/dialog.jsx`

### Step 1.2: Lighter tag colors (`badge.jsx`)
- Change badge variant classes:
  - `destructive`: `bg-destructive text-destructive-foreground` → `bg-destructive/15 text-destructive dark:bg-destructive/25`
  - `success`: `bg-success text-white` → `bg-success/15 text-success dark:bg-success/25`
  - `warning`: `bg-warning text-white` → `bg-warning/15 text-warning dark:bg-warning/25`
- **File:** `frontend/src/components/ui/badge.jsx`

### Step 1.3: Remove Notas from Search accordion (`SearchPage.jsx`)
- Locate the `notas_anteriores` conditional block in the `RowWithExpand` section (approximately around the expanded row content area).
- Delete the entire block that renders "Notas Anteriores" label and content.
- **File:** `frontend/src/features/search/SearchPage.jsx`

### Step 1.4: Estado dropdown in edit Tarea modal (`DetailPage.jsx`)
- Add state: `const [estadosTarea, setEstadosTarea] = useState([])`
- Fetch `GET /api/v1/estados-tareas` on mount (alongside responsables fetch), store in `estadosTarea`.
- Replace the `<Input>` for estado with a `<select>` dropdown populated from `estadosTarea.map(e => e.valor)`, same pattern as the responsable dropdown above it.
- **File:** `frontend/src/features/detail/DetailPage.jsx`

---

## Phase 2: Backend — New Endpoints

### Step 2.1: Add `POST /tareas/{tarea_id}/complete` endpoint
- **File:** `backend/app/routers/tareas.py`
- Add route BEFORE the `/{tarea_id}` dynamic routes (FastAPI route ordering).
- Logic:
  1. Fetch tarea by ID (404 if not found).
  2. Update tarea `estado` to "Completado".
  3. Query all acciones for this tarea where `estado NOT IN ('Completada', 'Completado')` (case-insensitive).
  4. Update each matching accion's `estado` to "Completada".
  5. Set tarea's `fecha_actualizacion` to now.
  6. Commit and return `{ tarea: {...}, acciones_updated: count }`.

### Step 2.2: Add `POST /tareas/bulk-update` endpoint
- **File:** `backend/app/routers/tareas.py`
- **File:** `backend/app/schemas.py` (add `BulkUpdateRequest` and `BulkUpdateResponse` schemas)
- Add route BEFORE dynamic `/{tarea_id}` routes.
- Schema:
  ```python
  class BulkUpdateRequest(BaseModel):
      tarea_ids: list[int]
      operation: Literal["change_date", "complete_and_create"]
      fecha: date
      accion: str | None = None  # required for complete_and_create

  class BulkUpdateResponse(BaseModel):
      updated_tareas: int
      updated_acciones: int
      created_acciones: int
  ```
- Logic for `change_date`:
  1. For each tarea_id: update `fecha_siguiente_accion = fecha`.
  2. For each tarea's pending acciones: update `fecha_accion = fecha`.
- Logic for `complete_and_create`:
  1. Validate `accion` is provided (400 if not).
  2. For each tarea_id: find pending acciones, set `estado = "Completada"`.
  3. Create new accion per tarea with `estado = "Pendiente"`, `fecha_accion = fecha`, `accion = accion`.
  4. Sync each tarea's `fecha_siguiente_accion` via `_sync_fecha_siguiente_accion`.

---

## Phase 3: Frontend — Multi-Select & Bulk Operations

### Step 3.1: Add multi-select state and checkbox column (`SearchPage.jsx`)
- Add state: `const [selectedIds, setSelectedIds] = useState(new Set())`
- Add helper functions: `toggleSelect(id)`, `toggleSelectAll()`, `clearSelection()`.
- Clear selection on new search execution (`handleSearch`).
- Add checkbox column as the first column in the table:
  - Header: checkbox with `checked = selectedIds.size === filteredData.length && filteredData.length > 0`, `indeterminate` if partial.
  - Row: checkbox with `checked = selectedIds.has(row.tarea_id)`.
- Show selection count badge when `selectedIds.size > 0`.

### Step 3.2: Add bulk operations toolbar (`SearchPage.jsx`)
- When `selectedIds.size > 0`, show a floating/sticky toolbar below the header (or above the table) with buttons:
  - "Cambiar Fecha" (CalendarClock icon) → opens `BulkChangeDateDialog`
  - "Completar y Crear" (ListChecks icon) → opens `BulkCompleteCreateDialog`
  - "Exportar" (ClipboardCopy icon) → calls modified export function
  - "Deseleccionar" (X icon) → clears selection
- Display: `"{n} tarea(s) seleccionada(s)"`

### Step 3.3: Add bulk dialogs (`SearchPage.jsx`)
- **BulkChangeDateDialog** (inline in SearchPage or as a new component):
  - Field: DateInput for new date.
  - On submit: `POST /tareas/bulk-update` with `operation: "change_date"`.
  - On success: toast, clear selection, refresh results.
- **BulkCompleteCreateDialog**:
  - Fields: Accion description (textarea), Date (DateInput).
  - On submit: `POST /tareas/bulk-update` with `operation: "complete_and_create"`.
  - On success: toast, clear selection, refresh results.

### Step 3.4: Modify export for selection (`SearchPage.jsx`)
- When selection is active, the bulk "Exportar" button exports only selected tareas.
- Reuse the existing `exportToClipboard` logic but filter to `selectedIds`.

---

## Phase 4: Detail Page — Mark as Completado

### Step 4.1: Add "Marcar Completado" button (`DetailPage.jsx`)
- Add a button with `CheckCircle2` icon in the header actions area (next to edit, cambiar fecha, etc.).
- Only show when tarea's estado is NOT already "Completado".
- On click: show `ConfirmDialog` with message "Se marcara la tarea y todas sus acciones pendientes como completadas."
- On confirm: `POST /tareas/{tarea_id}/complete`.
- On success: toast, refresh data.

---

## Phase 5: Version & Docs

### Step 5.1: Version bump and changelog
- `frontend/src/lib/version.js`: Set `minor: 20`
- `frontend/src/lib/changelog.js`: Add entry at top:
  ```javascript
  {
    version: "1.020",
    feature: 20,
    title: "UI Improvements & Bulk Operations",
    summary: "Lighter tag colors, fixed edit modal close, estado dropdown, multi-select with bulk date change/complete/export, and mark-as-complete on detail page."
  }
  ```

### Step 5.2: Documentation updates
- Update `README.md` with new endpoints.
- Update `specs/architecture/architecture_backend.md` with bulk-update and complete endpoints.
- Update `specs/architecture/architecture_frontend.md` with multi-select and bulk operations.

---

## File Change Summary

| File | Phase | Changes |
|------|-------|---------|
| `frontend/src/components/ui/dialog.jsx` | 1.1 | Fix onClose wiring |
| `frontend/src/components/ui/badge.jsx` | 1.2 | Lighter tag colors |
| `frontend/src/features/search/SearchPage.jsx` | 1.3, 3.x | Remove notas, add multi-select, bulk toolbar & dialogs |
| `frontend/src/features/detail/DetailPage.jsx` | 1.4, 4.1 | Estado dropdown, mark-as-completado button |
| `backend/app/routers/tareas.py` | 2.x | New complete and bulk-update endpoints |
| `backend/app/schemas.py` | 2.2 | New bulk request/response schemas |
| `frontend/src/lib/version.js` | 5.1 | Version bump |
| `frontend/src/lib/changelog.js` | 5.1 | Changelog entry |
| `README.md` | 5.2 | Docs |
| `specs/architecture/architecture_backend.md` | 5.2 | Docs |
| `specs/architecture/architecture_frontend.md` | 5.2 | Docs |

## Estimated Complexity

- **Phase 1** (bug fixes & small tweaks): Low — ~4 small edits
- **Phase 2** (backend endpoints): Medium — 2 new endpoints with DB operations
- **Phase 3** (multi-select & bulk): High — significant SearchPage changes, new dialogs
- **Phase 4** (mark as completado): Low — 1 button + confirm dialog + API call
- **Phase 5** (docs): Low — standard post-feature updates
