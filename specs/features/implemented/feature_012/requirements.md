# Requirements Prompt for feature_012

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_012/specs.md' and './specs/features/feature_012/plan.md' in order to do that.

## Feature Brief

Search persistent state. When moving from the Search page to another page and back, the status of the Search page should be preserved. This includes preserving search filters, search results, pagination state, scroll position, and any other UI state so the user can seamlessly return to where they left off.

## User Story

As a user, I want to navigate away from the Search page (e.g., to view a task detail) and return to find my search filters, results, and scroll position exactly as I left them, so I don't have to re-enter my search criteria every time I navigate back.

## Key Requirements

### Requirement 1: Preserve search filters and query state

When the user navigates away from the Search page and returns, all active search filters (responsable, estado, tema, text search, etc.) must be restored to their previous values. The search query parameters should be persisted so they survive navigation.

### Requirement 2: Preserve search results and pagination

The search results list and current pagination state (offset, page number) should be restored when returning to the Search page, avoiding unnecessary re-fetching if the filters haven't changed.

### Requirement 3: Preserve scroll position

The scroll position within the search results should be restored when navigating back to the Search page, so the user returns to the same place in the list they were viewing.

### Requirement 4: State persistence scope

The persistent state should survive in-app navigation (e.g., going to a detail page and back) but should be cleared on explicit actions like page refresh or logout. Use an appropriate client-side storage mechanism (e.g., React state, context, sessionStorage, or the existing `createStorage` utility).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This is a frontend-only feature; no backend changes should be required.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
