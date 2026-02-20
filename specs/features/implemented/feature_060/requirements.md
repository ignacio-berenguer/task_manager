# Requirements Prompt for feature_060

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_060/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_060/plan.md' in order to do that.

## Feature Brief

Dashboard — Advanced Features. A batch of advanced dashboard improvements identified in the feature_052 audit (items B1, B2, B7). Estimated effort: 3-5 days. Requires new API endpoints.

## User Story

As a dashboard user, I want KPI cards to show trend indicators compared to previous periods, the ability to export charts as images for presentations, and the landing page stats to reflect real data so that I can track progress and share insights.

## Key Requirements

### Requirement 1: B1 — KPI trend indicators

Add delta arrows and percentages to KPI cards showing the change compared to the previous period (e.g., previous year). This requires:
- A new API endpoint to fetch previous-period KPI values
- Frontend delta calculation and display (↑5%, ↓3%, or "unchanged")
- Color coding: green for improvement, red for decline

### Requirement 2: B2 — Chart export as PNG

Add an "Export as PNG" button to each chart card on the Dashboard. Use `html2canvas` or recharts' built-in export capabilities to capture the chart and download it as a PNG image.

### Requirement 3: B7 — Dynamic landing page stats

The HeroSection currently shows hardcoded stats (800+ initiatives, €50M+ budget, etc.). Replace with dynamic values fetched from a new API endpoint (e.g., `/api/v1/stats/overview`) that returns current initiative count, total budget, and other KPIs.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- New API endpoints must follow the existing backend patterns (router, service, CORS config).

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
