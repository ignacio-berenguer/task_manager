# Requirements Prompt for feature_042

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_042/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_042/plan.md' in order to do that.

## Feature Brief

Some of the Etiquetas represent a tag for the initiative. At least the etiquetas "Enabler para Aumento de Inversión 2026", "Plan de Eficiencias 2025", "Plan Director Centro de Control". More "hard-coded" values may be added to this list in the future. A new parametric table `etiquetas_destacadas` should be created and populated with those 3 etiquetas. Full CRUD operations should be supported on this parametric table.

The navigation should be updated to add a "Parametricas" menu with "Etiquetas Destacadas" and the current "Parametricas" as subitems.

When a portfolio_id has one of the etiquetas present in the `etiquetas_destacadas` parametric table, the information should be shown in a prominent place (top section of the page or side drawer) in the Detail page and in the initiative side drawer, displayed as tag elements.

## User Story

As a portfolio manager, I want to define a set of "highlighted etiquetas" (etiquetas destacadas) so that when an initiative has one of those tags, it is prominently displayed in the Detail page and initiative side drawer, making it easy to identify initiatives belonging to key strategic programs.

## Key Requirements

### Requirement 1: New `etiquetas_destacadas` parametric table

- Create a new database table `etiquetas_destacadas` to store the list of highlighted etiqueta values.
- Pre-populate the table with 3 initial values:
  - "Enabler para Aumento de Inversión 2026"
  - "Plan de Eficiencias 2025"
  - "Plan Director Centro de Control"
- The table should support being extended with additional values in the future.

### Requirement 2: CRUD API for `etiquetas_destacadas`

- Expose standard CRUD endpoints for the `etiquetas_destacadas` table through the backend API.
- Follow the existing router factory pattern for consistency.

### Requirement 3: Navigation — "Parametricas" menu

- Add a "Parametricas" parent menu item in the frontend navigation.
- Include "Etiquetas Destacadas" and the current parametric items as subitems.
- Provide a management page for Etiquetas Destacadas allowing users to view, add, edit, and delete entries.

### Requirement 4: Prominent display in Detail page and side drawer

- When a portfolio_id in the etiquetas table has etiquetas matching entries in `etiquetas_destacadas`, display them prominently:
  - **Detail page**: Show as tag/badge elements in a top section or dedicated area.
  - **Initiative side drawer**: Show as tag/badge elements in a visible position.
- Tags should be visually distinct (e.g., colored badges) to draw attention.

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
