# Implementation Plan — feature_026

## Phase 1: Compact Filter Layout

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Modify `renderFilterPanel` to accept a `variant` parameter (`'sidebar'` | `'inline'`).
2. In the `'inline'` variant (used inside the `<xl` accordion):
   - Replace the outer `space-y-2` with a wrapper that uses two rows:
     - Row 1: `grid grid-cols-1 md:grid-cols-5 gap-2` containing ID Tarea, Tarea, Responsable, Tema, Estado.
     - Row 2: `flex flex-wrap items-center gap-2` containing 2 días button, Semana button, a spacer (`flex-1`), Buscar button, Limpiar button.
   - On `<md` screens, `grid-cols-1` keeps the stacked mobile layout.
3. In the `'sidebar'` variant (used in the `xl` sidebar):
   - Keep the current stacked `space-y-2` layout unchanged (sidebar is only 288px wide).
4. Update the two call sites: `renderFilterPanel(sidebarTareaRef)` → `renderFilterPanel(sidebarTareaRef, 'sidebar')` and `renderFilterPanel(mobileTareaRef)` → `renderFilterPanel(mobileTareaRef, 'inline')`.

## Phase 2: Keyboard Shortcuts — Buscar & Limpiar

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add two new entries to the `useKeyboardShortcuts` array:
   ```js
   {
     id: 'search.ctrlShiftB',
     keys: 'Ctrl+Shift+B',
     key: 'B',
     modifiers: { ctrl: true, shift: true },
     description: 'Ejecutar búsqueda',
     category: 'Búsqueda',
     action: () => doSearch(0),
     alwaysActive: true,
   },
   {
     id: 'search.ctrlShiftX',
     keys: 'Ctrl+Shift+X',
     key: 'X',
     modifiers: { ctrl: true, shift: true },
     description: 'Limpiar filtros',
     category: 'Búsqueda',
     action: handleClear,
     alwaysActive: true,
   }
   ```
2. Add `<Kbd>` hints to the Buscar and Limpiar buttons (visible on `lg+`, hidden otherwise), matching the existing pattern used in DetailPage.

## Phase 3: Auto-Focus Results After Search

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add a `tableContainerRef` (or reuse if one exists) attached to the `div[role="grid"]` wrapper around the results table.
2. After `doSearch` completes successfully with results:
   - Set `selectedRowIndex` to `0` (instead of `-1`).
   - Call `tableContainerRef.current?.focus()` to move DOM focus to the table so arrow keys work immediately.
3. If results are empty, keep `selectedRowIndex` at `-1` and don't move focus.

## Phase 4: Quick Actions on Focused Result

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Compute an `anyDialogOpen` boolean from the dialog target states:
   ```js
   const anyDialogOpen = !!addAccionTarget || !!cambiarFechaTarget || !!completeScheduleTarget || !!drawerTarea
   ```
2. Extend `handleTableKeyDown` with new key handlers (only when `selectedRowIndex >= 0` and `!anyDialogOpen`):
   ```js
   case ' ':  // Space — open drawer
     e.preventDefault()
     openDrawer(null, filteredData[selectedRowIndex])
     break
   case 'a':  // Add acción
     e.preventDefault()
     setAddAccionTarget({ tarea_id: row.tarea_id })
     break
   case 'c':  // Complete & schedule
     e.preventDefault()
     setCompleteScheduleTarget({ tarea_id: row.tarea_id })
     break
   case 'f':  // Change fecha
     e.preventDefault()
     setCambiarFechaTarget({ tarea_id: row.tarea_id, fecha_siguiente_accion: row.fecha_siguiente_accion })
     break
   ```
3. Register these as display-only shortcuts in `useKeyboardShortcuts` so they appear in the Help overlay:
   ```js
   { id: 'search.space',  keys: 'Space', key: ' ', description: 'Vista previa (drawer)', category: 'Búsqueda', action: () => {}, enabled: false },
   { id: 'search.enter',  keys: 'Enter', key: 'Enter', description: 'Ir a detalle', category: 'Búsqueda', action: () => {}, enabled: false },
   { id: 'search.a',      keys: 'A', key: 'a', description: 'Añadir acción', category: 'Búsqueda', action: () => {}, enabled: false },
   { id: 'search.c',      keys: 'C', key: 'c', description: 'Completar y programar', category: 'Búsqueda', action: () => {}, enabled: false },
   { id: 'search.f',      keys: 'F', key: 'f', description: 'Cambiar fecha', category: 'Búsqueda', action: () => {}, enabled: false },
   ```
   These are `enabled: false` so the global handler doesn't intercept them — the actual handling is in `handleTableKeyDown` which is local to the table's `onKeyDown`.

## Phase 5: Version & Changelog

1. **`frontend/src/lib/version.js`** — Bump `APP_VERSION.minor` to `26`.
2. **`frontend/src/lib/changelog.js`** — Add entry at TOP of `CHANGELOG` array:
   ```js
   {
     version: '0.26',
     feature: 'feature_026',
     title: 'Búsqueda: filtros compactos y atajos de teclado',
     summary: 'Filtros en dos líneas en pantallas medianas, atajos Ctrl+Shift+B/X para Buscar/Limpiar, auto-foco en resultados, y acciones rápidas por teclado (Space, Enter, A, C, F).',
   }
   ```

## Phase 6: Documentation Updates

1. **`specs/architecture/architecture_frontend.md`** — Add section documenting the new keyboard shortcuts and compact filter layout.
2. **`README.md`** — Update the frontend keyboard shortcuts section if one exists.

## Testing

- Build check: `cd frontend && npm run build` — verify no errors.
- Manual verification:
  - On a medium screen (`md`–`lg`): filters display in two rows.
  - On `xl`: sidebar layout unchanged.
  - On mobile (`<md`): stacked layout unchanged.
  - `Ctrl+Shift+B` triggers search from any context on the page.
  - `Ctrl+Shift+X` clears filters from any context on the page.
  - After search, first result is selected and arrow keys work.
  - Space opens drawer, Enter goes to detail, A/C/F open respective dialogs.
  - F1 / "Atajos de teclado" shows all new shortcuts in the Búsqueda category.
