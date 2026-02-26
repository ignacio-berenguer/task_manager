# Requirements Prompt for feature_028

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_028/specs.md' and './specs/features/feature_028/plan.md' in order to do that.

## Feature Brief

Improve the UI of the Detail page with two main enhancements:

1. **Backspace navigation**: In the Detail page, when the user presses Backspace, it should navigate back to the Search page with the filters and selected item persisted.
2. **Keyboard shortcuts for actions**: In the Detail page, add keyboard shortcuts for common actions with visual hints on buttons and in the help dialog:
   - `e` = Editar
   - `c` = Completar
   - `a` = Nueva Accion
   - `p` = Completar y Programar
   - `f` = Change fecha (make the current icon a real button next to "Completar")

The keyboard shortcuts should show a hint in the buttons (e.g., underlined letter or `Kbd` badge), and also appear in the Ayuda / Atajos de Teclado help dialog.

## User Story

As a user, I want to quickly perform common actions on the Detail page using keyboard shortcuts, and easily navigate back to Search with my context preserved, so I can work through tasks more efficiently without relying on mouse clicks.

## Key Requirements

### Requirement 1: Backspace navigates back to Search

- When on the Detail page, pressing the `Backspace` key should navigate back to the Search page.
- The Search page should restore the previously active filters and selected item (these are already persisted via localStorage/state).
- Backspace should only trigger navigation when no input/textarea/editable element is focused (to avoid interfering with text editing).

### Requirement 2: Keyboard shortcuts for Detail page actions

- Add the following keyboard shortcuts on the Detail page:
  - `e` — Editar (edit the tarea)
  - `c` — Completar (mark tarea as completed)
  - `a` — Nueva Accion (open new action dialog)
  - `p` — Completar y Programar (complete and schedule)
  - `f` — Change fecha (change fecha_siguiente_accion)
- Shortcuts should only activate when no input/textarea/editable element is focused.
- Shortcuts should not activate when a dialog/modal is open.

### Requirement 3: Visual keyboard hints on buttons

- Each button that has a keyboard shortcut should display a visual hint (e.g., a `Kbd` component or underlined letter) showing the shortcut key.
- The hints should be subtle but visible, consistent with the existing UI design.

### Requirement 4: Fecha button next to Completar

- The current fecha icon should become a proper button placed next to the "Completar" button.
- This button should be clearly labeled and have the `f` keyboard shortcut.

### Requirement 5: Update Ayuda / Atajos de Teclado help

- Add all new keyboard shortcuts to the existing keyboard shortcuts help dialog.
- Group them under a "Detail Page" section or similar.
- Include the Backspace shortcut in the help as well.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Keyboard shortcuts must not interfere with browser defaults when inputs are focused.
- The implementation should reuse existing UI components (Kbd, Button, etc.) where possible.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
