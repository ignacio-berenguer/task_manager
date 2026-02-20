# Requirements Prompt for feature_022

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_022/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_022/plan.md' in order to to that.

## Feature Brief

Improvements to the dashboard

## User Story

As a user, I want to display the initiatives that are part of any chart element. Also I want some improvements in the dashboard page.

## Key Requirements

### Requirement 1: Access to Search from the charts

It should be possible to double_click on any of the chart elements and be taken to the Search page displaying exactly the initiatives that are included in the chart. All the filters and the chart element should be considered.

### Requirement 3: I want to add some lists of relevant intiatives to the dashboard page

I'd like to add the following chart-tables to the dashboard:

- "Iniciativas más importantes": a card with a list of the portfolio_id, nombre, importe of the top value iniciativas. Clicking on the portfolio_id should take to the detail page. The card should have a selector for moving the filter on what means top value... default value = 1 M€

- "Iniciativas con cambios recientes": a card that should list the portfolio_id, nombre, estado, fecha_ultimo_estado of the initiatives that have changed in the last week. Clicking on the portfolio_id should take you to the detail_page. The card should have a navigation button to the Informe Hechos, and clicking on it it should navigate to the informe hechos opening it withthe same criteria as displayed in the dashboard.

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md and specs/architecture_frontend.md

### Requirement 4: Sticky sidebar navigation for Dashboard

Add a sticky sidebar navigation (left side, visible only on xl+ screens) with links to each dashboard section (KPIs, chart pairs, initiative cards). Uses IntersectionObserver to highlight the active section. Smooth scroll on click.

### Requirement 5: Fix RecentChangesCard sort order

Change the sort order of recent changes from descending to ascending (oldest-first within the recent window).

### Requirement 6: Fix SearchPage auto-execute on navigation from Dashboard

When navigating from Dashboard to Search with filters in location state, the search should execute immediately with the passed filters. The previous implementation had a race condition where `setTimeout(() => executeSearch(true), 0)` captured stale filter state from the `useCallback` closure. Fix: add `overrideFilters` parameter to `executeSearch` and pass filters directly.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
