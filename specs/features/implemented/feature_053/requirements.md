# Requirements Prompt for feature_053

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_053/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_053/plan.md' in order to do that.

## Feature Brief

Quick Wins — Polish & Fixes. A batch of small, high-impact UI improvements identified in the feature_052 audit (items F7, C3, E1, F3). Estimated effort: < 1 day total.

## User Story

As a user of the Portfolio Digital application, I want small but impactful polish improvements (searchable dropdowns, persistent filter state, collapse/expand all, landing page CTA) so that common interactions are smoother and more intuitive.

## Key Requirements

### Requirement 1: F7 — Enable searchable on all MultiSelect instances

The `multi-select.jsx` component already supports case-insensitive search via its `searchable` prop, but not all instances pass `searchable={true}`. Enable the `searchable` prop on all MultiSelect usages across:

- `FilterPanel.jsx` (Search page)
- `FilterBar.jsx` (Dashboard)
- `ReportFilterPanel.jsx` (all report pages)

### Requirement 2: C3 — Persist FilterPanel collapsed state

The Search page's FilterPanel has an `isOpen` state (defaults to `true`). Persist the collapsed/expanded state to localStorage so it is remembered across page reloads and navigation. Use the existing `createStorage` pattern from `lib/storage.js`.

### Requirement 3: E1 — Collapse All / Expand All for Detail page

The Detail page has 21 accordion sections that are independently managed. Add "Collapse All" and "Expand All" buttons in the page header area. This requires lifting the accordion open/close state to the DetailPage level so all sections can be controlled globally.

In addition, there are many initiatives portfolio_id for which the accordion sections have no data, because that entity is not present in the database. In those cases, replace all the accordions with no data with a new section at the bottom of the page that mentions that the initiavive have no data for the entities, and provides the user with the capability (for those entities that allow it) to create a new entity (using the existing CRUD functionality). Please note that if the acordion is not present, it should not show in the lateral navbar.

### Requirement 4: F3 — CTA button on landing page hero

The HeroSection on the landing page has no call-to-action button. Add a prominent button:

- If the user is authenticated (Clerk): "Go to Dashboard" linking to `/dashboard`
- If the user is not authenticated: "Sign In" linking to `/sign-in`

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
