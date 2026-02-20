# Requirements Prompt for feature_056

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_056/specs.md' and './specs/features/feature_056/plan.md' in order to do that.

## Feature Brief

Search Page Enhancements. A batch of UI improvements to the Search page identified in the feature_052 audit (items C1, C2, C6, C7, C8). Estimated effort: 2-3 days.

## User Story

As a user who searches for initiatives daily, I want to save and reload filter configurations, see active filters as removable chips, have exports match my column setup, keep selections across pages, and get warnings on invalid portfolio IDs, so that my search workflow is faster and less error-prone.

## Key Requirements

### Requirement 1: C1 — Saved searches

Add "Save Search" and "Load Search" functionality. Users can name a filter configuration and save it to localStorage. A dropdown shows saved searches for quick recall. Include a delete option for each saved search.

### Requirement 2: C2 — Filter chips bar

Show active filters as removable chip/badge elements above the data grid. Clicking the X on a chip removes that specific filter and re-triggers the search. Show only when filters are active.

### Requirement 3: C6 — Export respects column configuration

Fix the export functionality (TSV, CSV, JSON, Excel) to respect the user's current column order and selection from the ColumnConfigurator, instead of exporting all columns in default order.

### Requirement 4: C7 — Persistent row selection across pagination

Currently, changing pages clears row selection. Persist selected rows (by portfolio_id) across pagination so that users can select items on multiple pages and then perform bulk actions (copy, export) on the full selection.

### Requirement 5: C8 — Portfolio ID paste validation

When pasting portfolio IDs into the filter input, validate the format against the expected pattern (e.g., `SPA_YY_NNN`). Show a warning for any IDs that don't match the expected format, but still allow the search to proceed.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
