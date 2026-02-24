# Requirements Prompt for feature_016

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_016/specs.md' and './specs/features/feature_016/plan.md' in order to do that.

## Feature Brief

Improvements to the Search page user interface with three enhancements:

1. **New quick filter "Next 2 days"**: Add a quick filter button that filters tareas with `fecha_siguiente_accion` between today and today + 6 days (i.e., the next week including today).
2. **Condense the filter section**: The filter section currently takes too much vertical space. Reduce its height as much as possible while keeping all functionality accessible.
3. **Export to clipboard button**: Add a button that copies the currently displayed tasks to the clipboard in the format: `tarea + ": " + list of actions not completed separated by "/"`.

## User Story

As a user, I want a more compact and functional Search page so that I can quickly filter tasks for the upcoming days, see more results without scrolling past filters, and easily copy task summaries to share with others.

## Key Requirements

### Requirement 1: Quick filter "Next 2 days" (actually next 7 days including today)

- Add a new quick filter button labeled "Proximos 2 dias" (or similar) to the existing quick filter bar on the Search page.
- When activated, it should filter tareas where `fecha_siguiente_accion` is between today and today + 6 days (7-day window).
- Should work consistently with the existing quick filter pattern (e.g., "Proxima semana").

### Requirement 2: Condense the filter section

- Reduce the vertical space used by the filter/search section on the Search page.
- Keep all existing filter functionality (search box, dropdowns, quick filters, etc.) accessible.
- Consider strategies like: reducing padding/margins, making filters more compact, using horizontal layouts, collapsible sections, or smaller typography for filter controls.

### Requirement 3: Export tasks to clipboard

- Add a button (e.g., with a clipboard/copy icon) on the Search page.
- When clicked, it copies the currently visible tasks to the clipboard.
- Format for each task: `tarea_name: action1 not completed / action2 not completed / ...`
- Only include actions that are NOT in "Completada" status.
- Each task should be on a separate line.
- Show a brief visual confirmation (e.g., toast or button state change) after copying.

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
