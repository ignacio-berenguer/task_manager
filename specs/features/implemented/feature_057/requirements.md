# Requirements Prompt for feature_057

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './portfolio_migration/specs/features/feature_057/specs.md' and './portfolio_migration/specs/features/feature_057/plan.md' in order to do that.

## Feature Brief

Detail Page — Tables & Sidebar. A batch of UI improvements to the Detail page identified in the feature_052 audit (items E2, E3, E4). Estimated effort: 2-3 days.

## User Story

As a user viewing initiative details, I want to search sidebar sections by name, sort data in 1:N section tables, and export individual section data so that I can quickly find information and share it.

## Key Requirements

### Requirement 1: E2 — Section search in DetailNav sidebar

Add a text input at the top of the DetailNav/SidebarNav component that filters the visible section links by name. As the user types, only matching sections are shown. Clear button to reset.

### Requirement 2: E3 — Sortable SimpleTable columns

Add sortable column headers to the SimpleTable component used in 1:N detail sections (Hechos, Etiquetas, Acciones, Notas, etc.). Clicking a header should cycle through ascending → descending → unsorted. Use the same visual pattern as the Search DataGrid headers.

### Requirement 3: E4 — Per-section data export

Add an "Export" button to each section's accordion header (or toolbar). When clicked, export that section's data as CSV or JSON. The export should respect the current sort order if E3 is implemented.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
