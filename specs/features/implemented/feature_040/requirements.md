# Requirements Prompt for feature_040

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_040/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_040/plan.md' in order to do that.

## Feature Brief

Improvements to the UI. (1) The table header in Search should be sticky. Please be careful not to hide it with the navbar. (2) Add to the side drawer in Search and other pages the following: table with Notas, table with Justificaciones, table with Descripciones, table with Dependencias. (3) In the different tables in the application, it would be much nicer if the estado tags were of the same width and the text was centered within the tag (see screenshot: the tags currently have variable widths and left-aligned text, making them look inconsistent).

## User Story

As a user, I want a polished and usable table experience: sticky headers so I don't lose context while scrolling, more initiative data in the side drawer without navigating to the detail page, and consistent fixed-width estado tags across all tables for visual clarity.

## Key Requirements

### Requirement 1: Sticky table header in Search page

- Make the table header row (`<thead>`) sticky so it remains visible when scrolling down through results
- The sticky header must account for the navbar height so it doesn't overlap or get hidden behind it
- The header should have a solid background (matching the current theme) so content scrolling beneath it is not visible through it
- This applies to the main data grid on the Search page (`/search`)

### Requirement 2: Expand the initiative side drawer with additional data tables

Add the following data tables to the `InitiativeDrawer` component (used in Search and report pages):
- **Notas** — show all notas for the initiative (fields: fecha, registrado_por, nota)
- **Justificaciones** — show all justificaciones (fields: tipo_justificacion, valor, comentarios)
- **Descripciones** — show all descripciones (fields: tipo_descripcion, descripcion)
- **Dependencias** — show all dependencias (fields: descripcion_dependencia, fecha_dependencia, comentarios)

Each table should:
- Fetch data from the existing portfolio API endpoint (`GET /api/v1/portfolio/{pid}`)
- Display in a compact format appropriate for the drawer width
- Show a count badge or indicator (similar to existing sections)
- Only render if the initiative has data for that section

### Requirement 3: Fixed-width estado tags with centered text

- All `EstadoTag` components across the application should have a consistent fixed width
- Text inside the tag should be centered (currently appears left-aligned with variable width)
- This applies everywhere EstadoTag is used: Search results, Report tables, Detail page, Side drawer
- The width should accommodate the longest estado text without truncation

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
