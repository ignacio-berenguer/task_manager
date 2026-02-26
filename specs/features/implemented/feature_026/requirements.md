# Requirements Prompt for feature_026

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_026/specs.md' and './specs/features/feature_026/plan.md' in order to do that.

## Feature Brief

UI Improvements for the Search page: compact filter layout, keyboard shortcuts, and keyboard-driven result navigation with quick actions.

1. **Compact filter layout for medium screens** — The filter section is too tall on medium screens. Collapse fields onto two lines:
   - Line 1: ID tarea, Tarea, Responsable, Tema, Estado
   - Line 2: Días, Semana, Buscar, Limpiar

2. **Keyboard shortcut Ctrl+Shift+X for "Limpiar"** — Add Ctrl+Shift+X to trigger the Limpiar (clear filters) button on the Search page. Register this shortcut in the Help menu "Atajos de teclado" item.

3. **Keyboard shortcut Ctrl+Shift+B for "Buscar"** — Add Ctrl+Shift+B to trigger the Buscar (search) button on the Search page. Register this shortcut in the Help menu "Atajos de teclado" item.

4. **Auto-focus search results after search** — After executing a search, focus should move to the search results list. The user should be able to navigate results with Up/Down arrow keys.

5. **Quick actions from focused search result** — When a result row is focused/selected via keyboard:
   - **Space** → Open the side-drawer preview of the selected tarea
   - **Enter** → Navigate to the Detail page of the selected tarea
   - **A** → Open the "Añadir Acción" dialog for the selected tarea
   - **C** → Open the "Completar y Programar Siguiente" dialog for the selected tarea
   - **F** → Open the "Cambiar Fecha" dialog for the selected tarea
   - Update the "Atajos de teclado" Help menu item with all new shortcuts.

## User Story

As a user, I want a compact search filter layout and keyboard-driven navigation so I can efficiently search, browse results, and perform quick actions without reaching for the mouse.

## Key Requirements

### Requirement 1: Compact Filter Layout

- Reorganize the Search page filter section to use a two-line layout on medium+ screens:
  - Row 1: ID tarea, Tarea, Responsable, Tema, Estado (all on one line)
  - Row 2: Días, Semana, Buscar button, Limpiar button (all on one line)
- On small screens the current stacked layout can remain as a fallback.

### Requirement 2: Keyboard Shortcut — Limpiar (Ctrl+Shift+X)

- Bind Ctrl+Shift+X globally on the Search page to trigger the "Limpiar" (clear filters) action.
- Add this shortcut to the "Atajos de teclado" section in the Ayuda (Help) menu.

### Requirement 3: Keyboard Shortcut — Buscar (Ctrl+Shift+B)

- Bind Ctrl+Shift+B globally on the Search page to trigger the "Buscar" (search) action.
- Add this shortcut to the "Atajos de teclado" section in the Ayuda (Help) menu.

### Requirement 4: Auto-Focus Results After Search

- After a search completes, automatically move focus to the results list.
- Support Up/Down arrow key navigation to move between result rows.
- Visually highlight the currently selected row.

### Requirement 5: Quick Actions on Focused Result

- When a result row is selected via keyboard navigation:
  - **Space**: Open the side-drawer preview for the selected tarea.
  - **Enter**: Navigate to the Detail page (`/detail/:tarea_id`).
  - **A**: Open the "Añadir Acción" (Add Action) dialog for the selected tarea.
  - **C**: Open the "Completar y Programar Siguiente" (Complete & Schedule) dialog for the selected tarea.
  - **F**: Open the "Cambiar Fecha" (Change Date) dialog for the selected tarea.
- These shortcuts should only be active when focus is on the results list and no dialog is open.

### Requirement 6: Update Help Menu

- Add all new keyboard shortcuts to the "Atajos de teclado" item in the Ayuda menu.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
