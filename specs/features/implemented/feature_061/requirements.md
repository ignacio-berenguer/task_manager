# Requirements Prompt for feature_061

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './portfolio_migration/specs/features/feature_061/specs.md' and './portfolio_migration/specs/features/feature_061/plan.md' in order to do that.

## Feature Brief

Detail Page — Advanced Features. A batch of advanced detail page improvements identified in the feature_052 audit (items E6, E7, E8). Estimated effort: 4-6 days. Requires new API endpoints.

## User Story

As a user viewing initiative details, I want to see the edit history of each section, discover related initiatives, and view a unified timeline of all activity so that I have full context about an initiative's lifecycle.

## Key Requirements

### Requirement 1: E6 — Section edit history

Add a "History" button to each editable section in the Detail page. When clicked, open a modal showing the transacciones_json records for that specific entity type (e.g., all "notas" transactions for the current portfolio_id). Display timestamp, user, action (create/update/delete), and a JSON diff view.

### Requirement 2: E7 — Related initiatives widget

Add a "Related Initiatives" section at the bottom of the Detail page. Show initiatives that share the same cluster, etiquetas, or unidad. This requires a new API endpoint (e.g., `/api/v1/portfolio/{pid}/related`) that returns related portfolio_ids with names and the reason for relatedness (same cluster, shared tag, etc.).

### Requirement 3: E8 — Unified activity timeline

Add an "Activity" tab or section that combines hechos, notas, and transacciones into a single chronological timeline. Each entry shows: timestamp, type (hecho/nota/transaction), summary text, and optional state change badge. This requires a new API endpoint that merges and sorts data from multiple tables.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- New API endpoints must follow the existing backend patterns.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
