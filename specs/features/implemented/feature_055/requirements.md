# Requirements Prompt for feature_055

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_055/specs.md' and './specs/features/feature_055/plan.md' in order to do that.

## Feature Brief

Dashboard Polish. A batch of UI improvements to the Dashboard page identified in the feature_052 audit (items B3, B4, B5). Estimated effort: 1-2 days.

## User Story

As a user viewing the Dashboard, I want chart tooltips to show percentages, truncated labels to be readable, and the filter bar to be collapsible so that I can read data more easily and reclaim screen space after filtering.

## Key Requirements

### Requirement 1: B3 — Chart tooltip percentages

Add percentage of total to chart tooltips. When hovering a bar in any dashboard chart, the tooltip should show both the value and the percentage of the total (e.g., "€2.5M (15% of total)").

### Requirement 2: B4 — Truncated label tooltips

When bar chart labels are truncated due to limited space, add a tooltip on hover showing the full label text. This prevents information loss on long names like "Pendiente de Unidad Solicitante".

### Requirement 3: B5 — Collapsible FilterBar

Wrap the Dashboard FilterBar in a collapsible panel with a toggle button. Persist the collapsed/expanded state to localStorage so it's remembered across sessions. Show an active filter count badge when collapsed.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
