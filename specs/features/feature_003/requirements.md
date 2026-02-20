# Requirements Prompt for feature_003

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_003/specs.md' and './specs/features/feature_003/plan.md' in order to do that.

## Feature Brief

Comprehensive UI improvements to the Search and Detail pages, including filter enhancements, keyboard shortcuts, sortable/reorderable columns, sticky headers, colored estado tags, responsive layouts, side-drawer quick view, and better navigation state preservation.

## User Story

As a task manager user, I want a polished and efficient search and detail experience — with labeled filters, keyboard shortcuts, sortable columns, colored status tags, sticky headers, and a quick-view side drawer — so that I can find, review, and manage tareas faster without losing my place.

## Key Requirements

### Requirement 1: Search Filter Labels

In the Search page, filter criteria inputs do not have labels. Add visible labels above or beside each filter input.

### Requirement 2: Default Estado Filter Value

The default value for the estado filter should be "En Curso". When "Limpiar" (clear) is clicked, the estado filter should reset to "En Curso" (not empty).

### Requirement 3: Keyboard Shortcut — Ctrl+F to Focus Tarea Filter

Ctrl+Shift+F should be intercepted and focus the Tarea filter input box in the Search page. Display the shortcut somewhere so the user remembers.

### Requirement 4: Keyboard Shortcut — Enter to Search

Pressing Enter in any filter input should trigger the "Buscar" (search) action.

### Requirement 5: Default Sort by Fecha Siguiente Accion Ascending

By default, the search results list should be sorted by "Fecha Siguiente Accion" ascending.

### Requirement 6: Sortable Results Columns

The results list should be sortable by clicking on any column header. Click toggles ascending/descending.

### Requirement 7: Inline Tarea Detail Accordion in Search Results

Each record in the Search results should have an expandable accordion row that shows tarea details inline.

### Requirement 8: Date Format DD/MM/YYYY

"Fecha Siguiente Accion" should be displayed as DD/MM/YYYY format throughout the app.

### Requirement 9: Sticky Column Headers

The column headers in the Search results table should be sticky (remain visible when scrolling).

### Requirement 10: Sticky Filter Panel as Accordion

The filter panel should be sticky (always visible) and wrapped in a collapsible accordion.

### Requirement 11: Colored Estado Tags

Estado values should be shown as colored tags/badges in all pages:

- **Red**: "En Curso"
- **Green**: "Completado" or "Continuar en otra tarea"
- **Gray**: "Cancelado"

### Requirement 12: New Tarea Button with Keyboard Shortcut

In the Search page, add a button for creating a new tarea. Keyboard shortcut: Ctrl+Shift+N. Display shortcut when hovering over the button.

### Requirement 13: Full-Width Layout on Wide Screens

On wide screens, the Search filters and results should take the full available width.

### Requirement 14: Reorderable Columns with localStorage Persistence

Columns in the Search results can be reordered (drag-and-drop), and the order should be stored in browser localStorage for future visits.

### Requirement 15: Detail Page — Acciones Ordered by Fecha Descending with Sticky Headers

In the Detail page, the Acciones table should be ordered by fecha_accion descending. The table headers should be sticky.

### Requirement 16: Detail Page — Notas Anteriores After Acciones

In the Detail page, "Notas Anteriores" should be displayed after "Acciones Realizadas" (not before).

### Requirement 17: Detail Page — Responsable Tag in Header + Datos Tarea Accordion

In the Detail page:

- Display the Responsable as a tag in the tarea header
- "Datos de la Tarea" should be a collapsible accordion, collapsed by default
- "Datos de la Tarea" should be positioned after "Acciones Realizadas"

### Requirement 18: Search State Preservation on Back Navigation

When pressing the Back button from the Detail page to return to Search, the full state of Search (filters, results, scroll position, pagination) should be recovered and shown as it was.

### Requirement 19: Lateral Filter Navbar on Wide Screens

In the Search page, on wide screens (e.g., xl breakpoint and above), display all filters in a lateral sidebar/navbar on the left side, with the results taking the remaining space.

### Requirement 20: Side Drawer Quick View per Tarea

In the Search screen, each tarea row should have a button next to the Tarea ID that opens a side drawer (from the right) displaying:

- Tarea ID, Nombre, Responsable, Tema, Estado, Fecha Siguiente Accion
- List of acciones ordered by fecha descending

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This is a frontend-only feature. No backend changes should be needed (all data is already available via existing API endpoints).

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
