# Requirements Prompt for feature_004

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_004/specs.md' and './specs/features/feature_004/plan.md' in order to do that.

## Feature Brief

UI/UX improvements across the Search and Detail pages to improve information hierarchy, compactness, and usability:

1. **Column filters on Search page** — Add inline column filters to the search results table.
2. **Smaller tarea_id in Search results** — Display `tarea_id` in a smaller, de-emphasized font in the results table.
3. **Detail page header hierarchy** — In the Detail page header, show `tarea_id` in smaller font and the task name (`tarea`) in a larger, prominent font.
4. **Side drawer header hierarchy** — Same treatment for `tarea_id` and `tarea` in the task detail side drawer.
5. **Compact Acciones Realizadas list** — Make the acciones list much more compact; on wide screens it should expand to full width.
6. **Colored estado tags in side drawer** — Display estado labels for acciones in the side drawer as colored tags (green for Completada, red for Pendiente, etc.).
7. **Colored estado tags in Detail page** — Same colored tag treatment for acciones on the Detail page.
8. **fecha_siguiente_accion in Detail header** — Display `fecha_siguiente_accion` as a relevant value next to the estado and responsable tags in the detail header.
9. **Notas Anteriores accordion** — "Notas anteriores" section should be a collapsible accordion, closed by default.
10. **Ctrl+Shift+F keyboard shortcut** — On the Detail page, pressing Ctrl+Shift+F navigates back to Search page with focus on the tarea filter input.
11. **Sticky search title** — In the Search page, the title "Busqueda de Tareas" should be sticky (remain visible when scrolling).
12. **Action buttons per tarea in Search** — For each tarea in the search results, display icon buttons on the right: "Añadir Accion", "Cambiar Fecha Siguiente Accion". These are placeholder buttons for now (functionality will be implemented in a later feature).

## User Story

As a user, I want an improved, more compact, and visually clear UI so that I can quickly scan tasks, distinguish their statuses at a glance, and navigate efficiently between search and detail views.

## Key Requirements

### Requirement 1: Column Filters on Search Page

Add inline column filters to the search results table, allowing users to filter results by individual columns directly from the table header area.

### Requirement 2: Information Hierarchy — tarea_id vs tarea Name

De-emphasize `tarea_id` (smaller font, muted color) and prominently display the task name (`tarea`) in:
- The Search results table
- The Detail page header
- The side drawer header

### Requirement 3: Compact Acciones Realizadas

Redesign the acciones list to be significantly more compact. On wide screens (desktop), the list should expand to use the full available width.

### Requirement 4: Colored Estado Tags

Display estado values as colored badge/tag components:
- **Completada**: Green
- **Pendiente**: Red
- **En Progreso**: Yellow/amber (or appropriate color)

Apply this treatment consistently in:
- The side drawer acciones list
- The Detail page acciones list

### Requirement 5: fecha_siguiente_accion in Detail Header

Show the `fecha_siguiente_accion` value prominently in the Detail page header, alongside the existing estado and responsable information.

### Requirement 6: Notas Anteriores Accordion

Convert the "Notas anteriores" section into a collapsible accordion component, defaulting to the closed/collapsed state.

### Requirement 7: Keyboard Shortcut — Ctrl+Shift+F

On the Detail page, register a keyboard shortcut (Ctrl+Shift+F) that navigates the user back to the Search page and auto-focuses the tarea filter input.

### Requirement 8: Sticky Search Page Title

Make the "Busqueda de Tareas" title sticky so it remains visible as the user scrolls through search results.

### Requirement 9: Placeholder Action Buttons in Search Results

For each tarea row in the search results table, add icon-only action buttons on the right side:
- **Añadir Accion** (add action icon)
- **Cambiar Fecha Siguiente Accion** (calendar/date icon)

These buttons should be visible but are placeholders only — no functionality yet. They will be implemented in a future feature.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This feature is frontend-only — no backend changes expected.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
