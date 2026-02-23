# Requirements Prompt for feature_014

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_014/specs.md' and './specs/features/feature_014/plan.md' in order to do that.

## Feature Brief

Add a quick filter button to the Search page: "Próxima semana" that should filter the tareas that have fecha siguiente acción between today (included) and 6 more days.

## User Story

As a user, I want to quickly filter tasks whose "fecha siguiente acción" falls within the next 7 days (today + 6 days) by clicking a single "Próxima semana" button on the Search page, so I can focus on upcoming actions without manually configuring date filters.

## Key Requirements

### Requirement 1: Quick filter button "Próxima semana"

- Add a clearly visible button labeled "Próxima semana" to the Search page filter area.
- When clicked, the button should apply a date range filter on the `fecha_siguiente_accion` field:
  - **From**: today's date (inclusive)
  - **To**: today + 6 days (inclusive), covering a full 7-day window
- The filter should use the existing backend search API (`POST /api/v1/tareas/search`) with appropriate `gte` and `lte` operators on the `fecha_siguiente_accion` field.
- The button should have a visually distinct active/inactive state so the user knows when the filter is applied.
- When the quick filter is active and the user clicks it again, it should toggle off (remove the date filter).
- The quick filter should integrate with any other active filters (responsable, estado, etc.) — it adds to existing filters, not replaces them.

### Requirement 2: Date calculation

- The date range must be computed client-side at the moment the user clicks the button.
- "Today" is determined by the user's local date (browser timezone).
- Dates should be sent to the API in ISO 8601 format (YYYY-MM-DD).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This is a frontend-only feature — no backend changes should be needed since the search API already supports `gte`/`lte` operators on date fields.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
