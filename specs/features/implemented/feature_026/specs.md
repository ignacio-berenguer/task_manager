# Technical Specifications — feature_026

## Overview

UI improvements to the Search page: compact filter layout, global keyboard shortcuts for Buscar/Limpiar, auto-focus on results after search, and keyboard-driven quick actions on selected rows.

**Scope:** Frontend only. No backend changes required.

## Current State Analysis

### Filter Layout
- `renderFilterPanel()` in `SearchPage.jsx` produces the same markup for both the `xl` sidebar and the mobile/tablet accordion.
- Fields are stacked vertically in a `space-y-2` container: ID Tarea, Tarea, Responsable, Tema, Estado, then a `flex gap-2` row for "2 días" / "Semana", and another `flex gap-2` row for Buscar / Limpiar buttons.
- On `xl+` screens: rendered in a 288px-wide sticky sidebar.
- On `<xl` screens: rendered inside a collapsible `Accordion`, taking full width but still stacked vertically — this wastes vertical space.

### Keyboard Shortcuts
- `useKeyboardShortcuts` hook registers shortcuts per-page via the global `KeyboardShortcutProvider`.
- SearchPage currently has 4 shortcuts: `/`, `n`, `Ctrl+Shift+F`, `Ctrl+Shift+N`.
- `ShortcutHelpOverlay` auto-collects all registered shortcuts and groups by `category`.

### Results List Keyboard Navigation
- `handleTableKeyDown` already handles: `ArrowDown`, `ArrowUp`, `Enter` (go to detail), `Escape` (deselect).
- `selectedRowIndex` state tracks the keyboard-selected row, with visual highlight via `ring-2 ring-inset ring-primary bg-primary/5`.
- No auto-focus after search — user must manually click or tab into the table.

### Side Drawer
- Already implemented: `drawerTarea` / `drawerAcciones` state + `Sheet` component.
- Opened via `openDrawer(e, row)` from the row's drawer icon button.

### Action Dialogs
- `AddAccionDialog`, `CompleteAndScheduleDialog`, `CambiarFechaDialog` already mounted in SearchPage.
- Triggered via target state: `addAccionTarget`, `completeScheduleTarget`, `cambiarFechaTarget`.

---

## Specification

### Spec 1: Compact Filter Layout (medium screens)

**Goal:** On `md`–`lg` screens (where the sidebar is hidden and filters appear in the accordion), arrange filter fields in two rows instead of a vertical stack.

**Design:**
- The `renderFilterPanel(tareaInputRef)` function currently returns all fields in `space-y-2`. Introduce a responsive grid layout:
  - **Row 1 (md+):** `grid grid-cols-5 gap-2` — ID Tarea, Tarea, Responsable, Tema, Estado
  - **Row 2 (md+):** `flex items-center gap-2` — 2 días, Semana, flex spacer, Buscar, Limpiar
- On `<md` (mobile): keep the current stacked layout via `grid-cols-1`.
- The `xl` sidebar continues to use `renderFilterPanel` — since the sidebar is narrow (288px), the grid will collapse to single column there too via responsive classes. Alternatively, pass a `compact` boolean to the render function to only apply the grid on the accordion version.

**Approach:** Pass a `variant` parameter (`'sidebar'` | `'inline'`) to `renderFilterPanel`. The `'inline'` variant (used in the accordion on `<xl`) uses the two-row grid. The `'sidebar'` variant keeps the current stacked layout.

### Spec 2: Keyboard Shortcut — Limpiar (Ctrl+Shift+X)

- Register via `useKeyboardShortcuts` with:
  - `id: 'search.ctrlShiftX'`
  - `keys: 'Ctrl+Shift+X'`
  - `key: 'X'`
  - `modifiers: { ctrl: true, shift: true }`
  - `alwaysActive: true` (works even when an input is focused)
  - `category: 'Búsqueda'`
  - `description: 'Limpiar filtros'`
  - `action: handleClear` (the existing clear handler)
- Display `Kbd` hint on the Limpiar button (hidden on small screens, visible on `lg+`).

### Spec 3: Keyboard Shortcut — Buscar (Ctrl+Shift+B)

- Register via `useKeyboardShortcuts` with:
  - `id: 'search.ctrlShiftB'`
  - `keys: 'Ctrl+Shift+B'`
  - `key: 'B'`
  - `modifiers: { ctrl: true, shift: true }`
  - `alwaysActive: true`
  - `category: 'Búsqueda'`
  - `description: 'Ejecutar búsqueda'`
  - `action: () => doSearch(0)` (search from page 0)
- Display `Kbd` hint on the Buscar button (hidden on small screens, visible on `lg+`).

### Spec 4: Auto-Focus Results After Search

- After `doSearch` completes (results loaded), auto-set `selectedRowIndex` to `0` (first result) instead of `-1`.
- Move DOM focus to the table container (`div[role="grid"]`) so arrow keys work immediately.
- Add a `tableContainerRef` to the `div[role="grid"]` wrapper and call `.focus()` after results arrive.
- If no results, don't focus (keep focus on filters).

### Spec 5: Quick Actions on Focused Result

Extend `handleTableKeyDown` with additional key handlers when `selectedRowIndex >= 0` and no dialog is open:

| Key | Action | Implementation |
|-----|--------|----------------|
| `Space` | Open side drawer | Call `openDrawer(null, filteredData[selectedRowIndex])` |
| `Enter` | Go to detail | Already implemented — no change needed |
| `a` | Add Acción | `setAddAccionTarget({ tarea_id: row.tarea_id })` |
| `c` | Complete & Schedule | `setCompleteScheduleTarget({ tarea_id: row.tarea_id })` |
| `f` | Change Fecha | `setCambiarFechaTarget({ tarea_id: row.tarea_id, fecha_siguiente_accion: row.fecha_siguiente_accion })` |

Guard: all single-letter shortcuts (`a`, `c`, `f`, Space) must be suppressed when any dialog is open (check `anyDialogOpen` state).

### Spec 6: Update Help Menu

- No code change needed for the overlay itself — `ShortcutHelpOverlay` automatically reads all registered shortcuts via `getShortcuts()`.
- Ensure the new shortcuts use `category: 'Búsqueda'` so they appear in the correct group.
- For the result-list shortcuts (Space, Enter, A, C, F), register them with descriptive labels so they show in the overlay. These are contextual (only active when results focused), but should still appear in the help overlay for discoverability.

---

## Files Affected

| File | Changes |
|------|---------|
| `frontend/src/features/search/SearchPage.jsx` | Filter layout refactor, new shortcuts, auto-focus, quick actions |
| `frontend/src/lib/changelog.js` | New changelog entry |
| `frontend/src/lib/version.js` | Bump minor version |
| `specs/architecture/architecture_frontend.md` | Document new shortcuts and layout |
| `README.md` | Update if needed |
