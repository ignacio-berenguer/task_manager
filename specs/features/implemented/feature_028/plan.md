# Implementation Plan — feature_028

## Detail Page UI Improvements: Keyboard Shortcuts & Navigation

### Phase 1: Add missing keyboard shortcuts to DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. Add 4 new entries to the `useKeyboardShortcuts` array:

   ```javascript
   {
     id: 'detail.backspace',
     keys: '⌫',
     key: 'Backspace',
     description: 'Volver a Búsqueda',
     category: 'Detalle',
     action: () => navigate('/search'),
     enabled: !anyDialogOpen,
   },
   {
     id: 'detail.completar',
     keys: 'c',
     key: 'c',
     description: 'Completar tarea',
     category: 'Detalle',
     action: () => { if (!anyDialogOpen && tarea) setCompleteConfirmOpen(true) },
     enabled: !anyDialogOpen && !!tarea && tarea.estado?.toLowerCase() !== 'completado',
   },
   {
     id: 'detail.completeSchedule',
     keys: 'p',
     key: 'p',
     description: 'Completar y programar',
     category: 'Detalle',
     action: () => { if (!anyDialogOpen) setCompleteScheduleOpen(true) },
     enabled: !anyDialogOpen,
   },
   {
     id: 'detail.cambiarFecha',
     keys: 'f',
     key: 'f',
     description: 'Cambiar fecha',
     category: 'Detalle',
     action: () => { if (!anyDialogOpen) setCambiarFechaOpen(true) },
     enabled: !anyDialogOpen,
   },
   ```

2. Update dependency array to include `tarea.estado` (for `c` shortcut conditional).

### Phase 2: Promote Cambiar Fecha to a proper button

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. **Remove** the CalendarClock tooltip-icon from the metadata badges area (lines ~299–309).

2. **Add** a new `<Button variant="outline">` in the header button group (between Completar and Editar):
   ```jsx
   <Button variant="outline" onClick={() => setCambiarFechaOpen(true)}>
     <CalendarClock className="sm:mr-2 h-4 w-4" />
     <span className="hidden sm:inline">Fecha</span>
     <Kbd className="ml-2 hidden lg:inline-flex">F</Kbd>
   </Button>
   ```

### Phase 3: Add Kbd hints to remaining buttons

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. **Completar button** — add `<Kbd className="ml-2 hidden lg:inline-flex">C</Kbd>` inside the Button, after the label span.

2. **Completar y Programar button** — add `<Kbd className="ml-2 hidden lg:inline-flex">P</Kbd>` inside the Button, after the label span.

3. **Editar button** — already has `<Kbd>E</Kbd>` (no change).

4. **Nueva Accion button** — already has `<Kbd>A</Kbd>` (no change).

### Phase 4: Version & Changelog

1. **`frontend/src/lib/version.js`** — Update `APP_VERSION` minor to `028`.

2. **`frontend/src/lib/changelog.js`** — Add entry at top of `CHANGELOG` array:
   ```javascript
   {
     version: '1.028',
     feature: 'feature_028',
     title: 'Detail page keyboard shortcuts & navigation',
     summary: 'Backspace to return to Search. Keyboard shortcuts: e=Editar, c=Completar, a=Nueva Acción, p=Completar y Programar, f=Cambiar Fecha. Visual Kbd hints on all action buttons.',
   },
   ```

### Phase 5: Documentation updates

1. Update `specs/architecture/architecture_frontend.md` — document Detail page keyboard shortcuts.
2. Update `README.md` if keyboard shortcuts section exists.

---

### Summary of files changed

| File | Type of change |
|------|---------------|
| `frontend/src/features/detail/DetailPage.jsx` | Add shortcuts, promote Fecha button, add Kbd hints |
| `frontend/src/lib/version.js` | Version bump |
| `frontend/src/lib/changelog.js` | Changelog entry |
| `specs/architecture/architecture_frontend.md` | Document new shortcuts |
| `README.md` | Update if applicable |
