# Technical Specification — feature_028

## Detail Page UI Improvements: Keyboard Shortcuts & Navigation

### 1. Overview

Enhance the Detail page with comprehensive keyboard shortcuts for all primary actions, Backspace navigation back to Search, a promoted "Cambiar Fecha" button, and visual Kbd hints on all shortcut-enabled buttons. All shortcuts are registered through the existing `useKeyboardShortcuts` hook and automatically appear in the ShortcutHelpOverlay.

### 2. Current State Analysis

#### Already implemented
- `e` shortcut for Editar (registered + Kbd hint on button)
- `a` shortcut for Nueva Accion (registered + Kbd hint on button)
- `Ctrl+Shift+F` shortcut to go to Search
- `Ctrl+Enter` display-only entry for "Guardar cambios"
- `anyDialogOpen` guard that disables shortcuts when any dialog is open
- `navigate(-1)` back button (ArrowLeft icon)
- Search page module-level cache that persists filters/results across navigation

#### Not yet implemented
- `c` shortcut for Completar
- `p` shortcut for Completar y Programar
- `f` shortcut for Cambiar Fecha
- Backspace shortcut for back navigation
- Kbd hints on Completar, Completar y Programar, and Cambiar Fecha buttons
- Cambiar Fecha promoted from tooltip-icon to proper button

### 3. Design Decisions

#### 3.1 Backspace Navigation
- Register as a shortcut in DetailPage (category: "Detalle"), NOT in Layout (global).
- Use `navigate('/search')` instead of `navigate(-1)` to guarantee landing on Search. The module-level cache in SearchPage already restores filters/results/scroll position when revisiting `/search`.
- Guard: `enabled: !anyDialogOpen` — the `useKeyboardShortcuts` provider already skips shortcuts when an input/textarea is focused, so Backspace won't fire during text editing.

#### 3.2 Keyboard Shortcuts
All shortcuts are single-key, lowercase, no modifiers. They follow the existing pattern in DetailPage:

| Key | Action | Handler |
|-----|--------|---------|
| `Backspace` | Navigate to Search | `navigate('/search')` |
| `e` | Editar tarea | `openEdit()` (already exists) |
| `c` | Completar | `setCompleteConfirmOpen(true)` |
| `a` | Nueva Accion | `setAddAccionOpen(true)` (already exists) |
| `p` | Completar y Programar | `setCompleteScheduleOpen(true)` |
| `f` | Cambiar Fecha | `setCambiarFechaOpen(true)` |

- `c` is conditionally enabled only when `tarea.estado !== 'Completado'` (same condition as the Completar button visibility).
- All shortcuts use `enabled: !anyDialogOpen` (plus any additional conditions).

#### 3.3 Visual Kbd Hints
Use the existing `<Kbd>` component (`@/components/ui/kbd`) with the established pattern:
```jsx
<Kbd className="ml-2 hidden lg:inline-flex">KEY</Kbd>
```
- Hidden on mobile/tablet (`hidden lg:inline-flex`).
- Applied to: Completar, Editar (already has), Cambiar Fecha, Completar y Programar, Nueva Accion (already has).

#### 3.4 Cambiar Fecha Button Promotion
- Move the current CalendarClock tooltip-icon out of the metadata badges area.
- Place it as a proper `<Button variant="outline">` in the header button group, between Completar and Editar.
- Label: "Fecha" (hidden on mobile, icon always visible).
- Add `<Kbd>F</Kbd>` hint.

### 4. Component Changes

#### 4.1 `DetailPage.jsx`

**Shortcut registration** (expand the existing `useKeyboardShortcuts` array):
- Add `detail.completar` — key `c`, conditional on `tarea.estado !== 'Completado'`
- Add `detail.completeSchedule` — key `p`
- Add `detail.cambiarFecha` — key `f`
- Add `detail.backspace` — key `Backspace`, navigates to `/search`

**Header button group** — reorder to:
1. Completar (conditional) — add `<Kbd>C</Kbd>`
2. Cambiar Fecha (new button) — `<Kbd>F</Kbd>`
3. Editar — already has `<Kbd>E</Kbd>`

**Remove** the CalendarClock tooltip-icon from the metadata badges row.

**Acciones section buttons** — add Kbd hints:
- Completar y Programar — add `<Kbd>P</Kbd>`
- Nueva Accion — already has `<Kbd>A</Kbd>`

#### 4.2 ShortcutHelpOverlay

No changes needed. The overlay auto-renders all registered shortcuts grouped by `category`. Since we use category "Detalle" for all new shortcuts, they appear in the existing "Detalle" section automatically.

### 5. Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/detail/DetailPage.jsx` | Add 4 shortcuts, promote Cambiar Fecha button, add Kbd hints |
| `frontend/src/lib/version.js` | Bump to 1.028 |
| `frontend/src/lib/changelog.js` | Add feature_028 entry |

### 6. No Backend Changes

This feature is purely frontend. No API or database changes required.
