# Requirements Prompt for feature_059

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_059/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_059/plan.md' in order to do that.

## Feature Brief

Report Enhancements. A batch of UI improvements to the GenericReportPage and report system identified in the feature_052 audit (items D1, D2, D3, D4). Estimated effort: 3-4 days.

## User Story

As a user viewing reports, I want aggregation summaries in table footers, date range presets for quick filtering, helpful suggestions when results are empty, and the ability to save report configurations as templates so that I can analyze data faster and reuse common report setups.

## Key Requirements

### Requirement 1: D1 — Aggregation footer row

Add a configurable aggregation footer row to GenericReportPage. For numeric columns, show sum/count/average as configured per report. The footer should be sticky at the bottom of the visible table area. Each report config should define which columns get which aggregation.

### Requirement 2: D2 — Date range presets

Add date range preset buttons to date filter fields in ReportFilterPanel. Presets should include: "Last 7 Days", "Last 30 Days", "This Month", "This Quarter", "This Year". Clicking a preset fills in the from/to date fields automatically.

**Dependency:** Ideally implemented after feature_058 (F1 datepicker component).

### Requirement 3: D3 — Improved empty state

Replace the generic "No se encontraron resultados" message with context-specific suggestions based on active filters. For example: "No LTPs found with estado 'Completado'. Try removing the estado filter or selecting a different value."

**Dependency:** Ideally implemented after feature_058 (F6 EmptyState component).

### Requirement 4: D4 — Saved report templates

Add "Save as Template" and "Load Template" functionality to GenericReportPage. Users can name a report configuration (filters + columns + sort order) and save it to localStorage. A dropdown shows saved templates for quick recall.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
