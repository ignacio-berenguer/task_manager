# Requirements Prompt for feature_015

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_015/specs.md' and './specs/features/feature_015/plan.md' in order to do that.

## Feature Brief

When scrolling the Search page, the **results/filters bar** and the **table header row** should become sticky so they remain visible at the top of the viewport as the user scrolls through the task list.

The results/filters bar contains: the result count (e.g., "65 resultados"), active filter chips (e.g., "Estado: En Curso", "Proxima semana: 23/02 – 01/03"), and the "Columnas" toggle button.

The table header row contains the column titles: ID, Tarea, Fecha Sig. Accion, Estado, Responsable, Tema, Acciones (with their respective filter/sort icons).

Reference screenshot: `.cp-images/pasted-image-2026-02-23T21-59-54-886Z.png`

## User Story

As a user, I want the search results bar and table header to stay pinned at the top of the screen when I scroll down through a long list of tasks, so that I can always see my active filters, result count, and column headers without scrolling back up.

## Key Requirements

### Requirement 1: Sticky results/filters bar

When the user scrolls the Search page past the results/filters bar (the row showing result count, active filter chips, and the Columnas button), it should stick to the top of the viewport and remain visible.

### Requirement 2: Sticky table header row

When the user scrolls past the table header row (ID, Tarea, Fecha Sig. Accion, Estado, Responsable, Tema, Acciones), it should stick to the top of the viewport below the results/filters bar and remain visible.

### Requirement 3: Visual consistency

The sticky elements should maintain their current styling (background color, spacing, borders) and look consistent in both light and dark mode. A subtle shadow or border may be added to indicate the sticky state.

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
