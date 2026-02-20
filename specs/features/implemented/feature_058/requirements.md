# Requirements Prompt for feature_058

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_058/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_058/plan.md' in order to do that.

## Feature Brief

UI Components. A batch of new and improved UI components identified in the feature_052 audit (items F1, F2, F4, F6). Estimated effort: 2-3 days.

## User Story

As a user interacting with forms and dialogs, I want a proper datepicker for date fields, appropriately sized dialogs, a searchable changelog, and helpful empty states so that the application feels polished and professional.

## Key Requirements

### Requirement 1: F1 — Datepicker component

Add a datepicker component with a calendar popup for date fields. Consider using `react-day-picker` or a similar lightweight library. Integrate it into `EntityFormModal.jsx` for date-type fields. The datepicker should support the existing date format patterns used in the application.

### Requirement 2: F2 — Dialog size variants

Add a `size` prop to the Dialog component (`components/ui/dialog.jsx`) supporting variants: `sm` (400px), `md` (600px, current default), `lg` (800px), `xl` (1000px), `full` (95vw). Update existing dialog usages if a different size is more appropriate.

### Requirement 3: F4 — Changelog improvements

The landing page ChangelogSection shows 50+ entries in a single scrollable list. Improve by:
- Adding collapsible version ranges (e.g., "v0.040-0.050" group)
- And/or adding a search/filter input to find features by keyword

### Requirement 4: F6 — EmptyState component

Create a reusable `EmptyState` component (`components/shared/EmptyState.jsx`) that displays:
- An icon (configurable)
- A title message
- An optional description
- An optional action button

Use it to replace plain text "No results" messages across the app (Search, Reports, Detail sections).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Note: F1 (datepicker) should ideally be done before feature_059's D2 (date presets). F6 (EmptyState) should be done before feature_059's D3 (improved empty states).

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
