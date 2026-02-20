# Requirements Prompt for feature_054

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_054/specs.md' and './specs/features/feature_054/plan.md' in order to do that.

## Feature Brief

Navigation Enhancements. A batch of UI improvements to navigation and routing identified in the feature_052 audit (items A1, A2, A6, A7). Estimated effort: 2-3 days.

## User Story

As a user navigating the Portfolio Digital application, I want breadcrumbs, contextual back buttons, recent initiative history, and deep-linkable detail sections so that I can orient myself and move between pages efficiently.

## Key Requirements

### Requirement 1: A1 — Breadcrumb navigation

Create a `Breadcrumb` component and add it to the Layout for all protected routes. Breadcrumbs should show the navigation path (e.g., "Dashboard > Search > SPA_25_11"). Route metadata should be defined in App.jsx or a route config.

### Requirement 2: A2 — Enhanced back button in DetailHeader

`DetailHeader.jsx` already has a back button using `navigate(-1)`. Enhance it to show context text based on `location.state`:

- If navigated from Search: "Back to Search"
- If navigated from Dashboard: "Back to Dashboard"
- If navigated from a Report: "Back to [Report Name]"
- Fallback: "Back" (current behavior)

### Requirement 3: A6 — Recent Initiatives dropdown

Track recently viewed initiatives in localStorage (last 5-10 portfolio_ids with names). Add a dropdown to the Navbar showing this history for quick navigation. Use the existing `createStorage` pattern from `lib/storage.js`.

### Requirement 4: A7 — Section URL anchors in Detail page

Update the URL hash when a section is scrolled to or clicked in the Detail page sidebar. On page mount, if the URL contains a hash (e.g., `/detail/SPA_25_11#hechos`), auto-scroll to and expand that section.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
