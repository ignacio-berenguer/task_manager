# Specs — feature_006: Implement Actions (Añadir Acción & Cambiar Fecha)

## Overview

Add two actionable operations — "Añadir Acción" and "Cambiar Fecha Siguiente Acción" — accessible from both the **Detail Page** and the **Search Page** results. These replace the current placeholder "Proximamente" toasts in the Search Page and enhance the Detail Page with a dedicated date-change button.

## Current State Analysis

### Detail Page (`DetailPage.jsx`)
- Already has a "Nueva Accion" button and dialog that creates acciones via `POST /acciones`
- The dialog collects: accion (textarea), fecha_accion (date), estado (text input)
- **Does NOT** auto-update `fecha_siguiente_accion` on the tarea when creating an accion
- No dedicated "Cambiar Fecha Siguiente Acción" button exists (date is editable only through the full "Editar Tarea" dialog)

### Search Page (`SearchPage.jsx`)
- Each result row has two icon buttons in the last column:
  - `ListPlus` icon with tooltip "Añadir Accion" → currently shows `toast.info('Proximamente')`
  - `CalendarClock` icon with tooltip "Cambiar Fecha Siguiente Accion" → currently shows `toast.info('Proximamente')`
- Row component `RowWithExpand` receives `row` data including `tarea_id` and `fecha_siguiente_accion`

### Backend APIs (Already Sufficient)
- `POST /acciones` — Creates accion with `{tarea_id, accion, fecha_accion, estado}`
- `PUT /tareas/{tarea_id}` — Updates tarea fields including `fecha_siguiente_accion`
- No new endpoints needed

### UI Components Available
- `Dialog` (custom portal-based, sizes: sm/md/lg/xl/full)
- `DatePicker` (react-day-picker, Spanish locale, ISO format, clear button)
- `Button`, `Input`, `Select`, `Tooltip`, `EstadoBadge`
- `toast` from sonner for success/error notifications

## Feature Specification

### 1. Añadir Acción

**Trigger Points:**
- **Detail Page:** Existing "Nueva Accion" button (already present in acciones card header)
- **Search Page:** ListPlus icon button in each result row

**Modal Dialog Fields:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| Acción | textarea | Yes | empty |
| Fecha | DatePicker | Yes | today's date |

**On Submit (two API calls):**
1. `POST /acciones` with `{tarea_id, accion: <text>, fecha_accion: <date>, estado: "PENDIENTE"}`
2. `PUT /tareas/{tarea_id}` with `{fecha_siguiente_accion: <date>}`

**Post-Submit Behavior:**
- Detail Page: Refresh acciones list and tarea data
- Search Page: Refresh search results (re-run current search) and update accionesCache if row was expanded
- Show `toast.success('Acción creada exitosamente')`
- Close the dialog

**On Cancel:** Close dialog, no changes.

**Error Handling:** Show `toast.error('Error al crear la acción')`, keep dialog open.

### 2. Cambiar Fecha Siguiente Acción

**Trigger Points:**
- **Detail Page:** New button in the sticky header, near the existing fecha_siguiente_accion badge
- **Search Page:** CalendarClock icon button in each result row

**Modal Dialog Fields:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| Fecha Siguiente Acción | DatePicker | Yes | current tarea's `fecha_siguiente_accion` |

**On Submit:**
1. `PUT /tareas/{tarea_id}` with `{fecha_siguiente_accion: <new_date>}`

**Post-Submit Behavior:**
- Detail Page: Refresh tarea data
- Search Page: Refresh search results (re-run current search)
- Show `toast.success('Fecha actualizada exitosamente')`
- Close the dialog

**On Cancel:** Close dialog, no changes.

**Error Handling:** Show `toast.error('Error al actualizar la fecha')`, keep dialog open.

## Component Design

### Shared Modal Components (New File)

Create a shared module `frontend/src/features/shared/ActionDialogs.jsx` containing two reusable dialog components that can be used from both Search and Detail pages:

#### `AddAccionDialog`
```
Props:
  - open: boolean
  - onOpenChange: (boolean) => void
  - tareaId: string
  - onSuccess: () => void  (callback to refresh parent data)
```

#### `CambiarFechaDialog`
```
Props:
  - open: boolean
  - onOpenChange: (boolean) => void
  - tareaId: string
  - currentFecha: string | null  (ISO date for pre-fill)
  - onSuccess: () => void  (callback to refresh parent data)
```

### Integration Points

**Detail Page Changes:**
- Replace existing "Nueva Accion" dialog logic with `AddAccionDialog` component
- Add "Cambiar Fecha" button (CalendarClock icon + text) in header next to fecha badge
- Add `CambiarFechaDialog` component

**Search Page Changes:**
- Import and mount both dialog components
- Add state for: `addAccionTarget` (tarea for accion dialog), `cambiarFechaTarget` (tarea for fecha dialog)
- Replace `toast.info('Proximamente')` handlers with dialog open logic
- On success callback: re-run search to refresh results

## UI/UX Details

### Dialog Styling
- Size: `sm` for Cambiar Fecha (single field), `md` for Añadir Acción (two fields)
- Spanish labels throughout
- Buttons: "Cancelar" (outline) + "Guardar" (default)
- Loading state on Guardar button during API call (disabled + "Guardando...")
- Auto-focus on first control when dialog opens (textarea for AddAccion, DatePicker for CambiarFecha)
- **Ctrl+Enter** submits the form (equivalent to "Guardar")
- **ESC** closes the dialog (equivalent to "Cancelar")

### Detail Page Button Placement
- "Cambiar Fecha Siguiente Acción" button: In the header row, as an icon button (CalendarClock) next to the fecha_siguiente_accion badge, with tooltip

### Search Page Icon Buttons
- Keep existing ListPlus and CalendarClock icons
- Keep existing tooltips
- Remove "Proximamente" toast, open respective dialogs instead

## Data Flow

```
User clicks "Añadir Acción" →
  Dialog opens (accion text + fecha picker) →
  User fills and clicks "Guardar" →
  POST /acciones (create accion with estado "Pendiente") →
  PUT /tareas/{id} (update fecha_siguiente_accion) →
  Refresh parent data →
  Toast success →
  Dialog closes

User clicks "Cambiar Fecha" →
  Dialog opens (fecha picker pre-filled) →
  User selects new date and clicks "Guardar" →
  PUT /tareas/{id} (update fecha_siguiente_accion) →
  Refresh parent data →
  Toast success →
  Dialog closes
```

## Files Affected

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/features/shared/ActionDialogs.jsx` | **New** | Shared AddAccionDialog + CambiarFechaDialog components |
| `frontend/src/features/detail/DetailPage.jsx` | Modify | Use shared dialogs, add Cambiar Fecha button in header |
| `frontend/src/features/search/SearchPage.jsx` | Modify | Use shared dialogs, replace placeholder toasts |
| `frontend/src/lib/version.js` | Modify | Bump minor version to 6 |
| `frontend/src/lib/changelog.js` | Modify | Add feature_006 changelog entry |
| `specs/architecture/architecture_frontend.md` | Modify | Document shared ActionDialogs components |
| `README.md` | Modify | Update feature list |

## No Backend Changes Required

All necessary endpoints already exist:
- `POST /acciones` for creating actions
- `PUT /tareas/{tarea_id}` for updating fecha_siguiente_accion
