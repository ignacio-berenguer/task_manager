# Implementation Plan — feature_006: Implement Actions (Añadir Acción & Cambiar Fecha)

## Phase 1: Create Shared Dialog Components

### Step 1.1: Create `ActionDialogs.jsx`

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

Create a new file with two exported dialog components:

**`AddAccionDialog`:**
- Props: `open`, `onOpenChange`, `tareaId`, `onSuccess`
- State: `form` (`{accion: '', fecha_accion: todayISO}`), `saving` (boolean)
- Render: Dialog (size md) with:
  - Title: "Nueva Acción"
  - Acción textarea (required)
  - Fecha DatePicker (required, default today)
  - Footer: Cancelar (outline) + Guardar (disabled when saving or accion empty)
- `handleSave`:
  1. Set saving=true
  2. `POST /acciones` with `{tarea_id: tareaId, accion: form.accion, fecha_accion: form.fecha_accion, estado: 'Pendiente'}`
  3. `PUT /tareas/{tareaId}` with `{fecha_siguiente_accion: form.fecha_accion}`
  4. `toast.success('Acción creada exitosamente')`
  5. Call `onSuccess()`
  6. Close dialog, reset form
  - On error: `toast.error('Error al crear la acción')`, keep dialog open, set saving=false

**`CambiarFechaDialog`:**
- Props: `open`, `onOpenChange`, `tareaId`, `currentFecha`, `onSuccess`
- State: `fecha` (initialized from `currentFecha`), `saving` (boolean)
- Effect: sync `fecha` state when `currentFecha` prop changes (when dialog opens)
- Render: Dialog (size sm) with:
  - Title: "Cambiar Fecha Siguiente Acción"
  - DatePicker (required, pre-filled with currentFecha)
  - Footer: Cancelar (outline) + Guardar (disabled when saving or no fecha)
- `handleSave`:
  1. Set saving=true
  2. `PUT /tareas/{tareaId}` with `{fecha_siguiente_accion: fecha}`
  3. `toast.success('Fecha actualizada exitosamente')`
  4. Call `onSuccess()`
  5. Close dialog
  - On error: `toast.error('Error al actualizar la fecha')`, keep dialog open, set saving=false

## Phase 2: Integrate into Detail Page

### Step 2.1: Refactor Detail Page to use shared AddAccionDialog

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Import `AddAccionDialog` and `CambiarFechaDialog` from `@/features/shared/ActionDialogs`
- Replace the existing "Nueva Accion" dialog (accionOpen/accionForm state + inline Dialog JSX) with `AddAccionDialog`:
  - Keep `accionOpen` state for the add dialog
  - Remove `accionForm` state (managed internally by shared component)
  - The "Nueva Accion" button (Plus icon) in acciones card header opens `AddAccionDialog`
  - `onSuccess` callback: re-fetch tarea + acciones
- Keep the existing edit accion dialog as-is (different fields: includes estado editing)
- Note: The existing "Nueva Accion" flow does NOT set estado to "Pendiente" automatically nor update fecha_siguiente_accion. The new shared dialog handles both.

### Step 2.2: Add Cambiar Fecha button to Detail Page header

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Add a CalendarClock icon button next to the `fecha_siguiente_accion` badge in the sticky header
- Wrap with Tooltip: "Cambiar Fecha Siguiente Acción"
- State: `cambiarFechaOpen` (boolean)
- Mount `CambiarFechaDialog` with:
  - `tareaId={tarea.tarea_id}`
  - `currentFecha={tarea.fecha_siguiente_accion}`
  - `onSuccess` → re-fetch tarea data

## Phase 3: Integrate into Search Page

### Step 3.1: Add dialog state and components to SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Import `AddAccionDialog` and `CambiarFechaDialog` from `@/features/shared/ActionDialogs`
- Add state:
  - `addAccionTarget` (object `{tarea_id}` or null) — when set, opens AddAccionDialog
  - `cambiarFechaTarget` (object `{tarea_id, fecha_siguiente_accion}` or null) — when set, opens CambiarFechaDialog
- Mount both dialogs at the bottom of the JSX (outside the table):
  - `AddAccionDialog` open when `addAccionTarget !== null`, tareaId from target
  - `CambiarFechaDialog` open when `cambiarFechaTarget !== null`, tareaId + currentFecha from target
- `onSuccess` callbacks: re-run the current search (`handleSearch()`) to refresh results

### Step 3.2: Wire up icon buttons in RowWithExpand

**File:** `frontend/src/features/search/SearchPage.jsx`

- Pass two new props to `RowWithExpand`: `onAddAccion(row)`, `onCambiarFecha(row)`
- Replace the ListPlus button onClick from `toast.info('Proximamente')` → `onAddAccion(row)`
- Replace the CalendarClock button onClick from `toast.info('Proximamente')` → `onCambiarFecha(row)`
- In parent, handlers set the respective target state:
  - `onAddAccion`: `setAddAccionTarget({tarea_id: row.tarea_id})`
  - `onCambiarFecha`: `setCambiarFechaTarget({tarea_id: row.tarea_id, fecha_siguiente_accion: row.fecha_siguiente_accion})`

## Phase 4: Version & Changelog

### Step 4.1: Update version

**File:** `frontend/src/lib/version.js`
- Set `minor` to `6` in `APP_VERSION`

### Step 4.2: Update changelog

**File:** `frontend/src/lib/changelog.js`
- Add new entry at TOP of `CHANGELOG` array:
  ```js
  {
    version: '0.6.0',
    feature: 'feature_006',
    title: 'Acciones Rápidas',
    summary: 'Añadir acciones y cambiar fecha siguiente acción desde la página de búsqueda y detalle.'
  }
  ```

## Phase 5: Documentation Updates

### Step 5.1: Update architecture_frontend.md

- Document the new `features/shared/ActionDialogs.jsx` module
- Describe the shared dialog pattern (reusable across pages)

### Step 5.2: Update README.md

- Add feature_006 to the feature list

## Implementation Order

```
1. ActionDialogs.jsx (shared component — no dependencies)
2. DetailPage.jsx (integrate shared dialogs + add Cambiar Fecha button)
3. SearchPage.jsx (integrate shared dialogs + wire icon buttons)
4. version.js + changelog.js
5. Architecture docs + README
```

## Testing Checklist

- [ ] Detail Page: "Nueva Accion" button opens dialog, creates accion with estado "Pendiente", updates fecha_siguiente_accion
- [ ] Detail Page: "Cambiar Fecha" button opens dialog, updates fecha_siguiente_accion
- [ ] Detail Page: Acciones list and tarea header refresh after both operations
- [ ] Search Page: ListPlus icon opens add accion dialog for the correct tarea
- [ ] Search Page: CalendarClock icon opens cambiar fecha dialog with current date pre-filled
- [ ] Search Page: Results refresh after both operations
- [ ] Both pages: Cancel closes dialog without changes
- [ ] Both pages: Error handling shows toast, keeps dialog open
- [ ] Both pages: Guardar button disabled during save
- [ ] Both pages: Toast success messages appear correctly
