# Requirements Prompt for feature_062

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './portfolio_migration/specs/features/feature_062/specs.md' and './portfolio_migration/specs/features/feature_062/plan.md' in order to do that.

## Feature Brief

Mobile & Accessibility. A batch of mobile responsiveness and accessibility improvements identified in the feature_052 audit (items A8, A9, G1, G2, G3, G5, C4, C5, F5). Estimated effort: 5-8 days. This is the largest batch and can be split into sub-features if needed.

## User Story

As a user accessing the application from various devices, I want mobile-friendly views, accessible components, and advanced data grid features so that the application is usable on tablets and phones, and accessible to users with different abilities.

## Key Requirements

### Requirement 1: A8 — Cross-report navigation

Add "View in [Other Report]" links per row in report tables. For example, from a Hechos report row, provide a link to see the LTPs or Acciones for the same initiative.

### Requirement 2: A9 — GlobalSearch in mobile menu

The GlobalSearch component (Ctrl+Shift+F) is only available in the desktop Navbar. Add it to the mobile menu so mobile users can access quick search.

### Requirement 3: G1 — Card-based mobile view for Search

Create an alternative card layout for the Search DataGrid on small screens. Instead of a horizontal table with tiny text, show each initiative as a card with key fields (portfolio_id, nombre, estado, importe). Include a toggle to switch between table and card view.

### Requirement 4: G2 — Mobile Detail page navigation

The Detail page sidebar (SidebarNav) is hidden on mobile (xl+ only). Add a floating action button (FAB) that opens a bottom sheet or dropdown with section links for mobile navigation.

### Requirement 6: G5 — Enhanced focus ring visibility

Visual focus indicators on some custom components (buttons, inputs) are too subtle. Enhance focus ring visibility across all interactive components for keyboard navigation users.

### Requirement 7: C4 — Column-level filtering in DataGrid

Add a funnel icon in DataGrid column headers. Clicking it opens a dropdown filter specific to that column (e.g., text search, select from unique values). This provides Excel-like column filtering.

### Requirement 8: C5 — Row grouping in DataGrid

Add a "Group by" toggle to the Search page that groups rows by a selected field (Estado, Unidad, Cluster). Grouped view shows collapsible group headers with row counts.

### Requirement 9: F5 — Page-specific loading skeletons

Replace the generic loading spinner for lazy-loaded routes with page-specific skeleton screens (e.g., SearchPageSkeleton with filter and table placeholders, DashboardPageSkeleton with KPI card and chart placeholders).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_frontend.md) after all the changes are done.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- This batch can be split into sub-features if the scope is too large for a single implementation cycle.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
