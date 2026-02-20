# Requirements Prompt for feature_035

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_035/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_035/plan.md' in order to do that.

## Feature Brief

I want to make several improvements to the user interface of the frontend:

1. **Sticky detail header on big screens** — In the Detail page, for big screens, the top section below the navbar (the one with the Portfolio ID and name of the initiative) should be sticky.

2. **Importe hover tooltip with full precision** — In all the tables (search page, detail page, other pages) when the monetary amounts of the importe* fields are shown as "#.### k€", when the user hovers over the field, it should be shown as "#.###,## €".

3. **Transacciones table redesign** — The transacciones table in the Detail page and the Transacciones report, and the Transacciones JSON report should be shown with a similar format to the transacciones_json table in Detail page: estado fields as tags, collapsible additional details.

4. **Full-width layout on wide screens** — The application frontend in big wide screens should try to use all the screen space.

5. **Empty default date filters** — In the Acciones report, Transacciones report, and Transacciones JSON report, the date filter fields default value is "dd/mm/aa"; the default value should be empty instead.

6. **Favorites system in Search page** — Add the capability to mark any initiative as "Favorite" (with a star or heart icon). "Favorite" initiatives should be persisted to local browser storage, not to database. Operations with Favorites:
   a) Copy portfolio IDs of favorite initiatives as a comma-separated list to clipboard
   b) Edit the favorite list in a modal dialog
   c) Empty the favorite list

7. **Initiative quick-view side drawer in Search page** — A button on each initiative that opens a side drawer (popping from the right side of the screen) displaying:
   - Portfolio ID, nombre, origen, digital_framework_level_1
   - Estado de la iniciativa, priorizacion, cluster
   - Fecha de estado de la iniciativa
   - Importe (in the current year)
   - List of hechos in ascending ID order with: estado, fecha, importe
   - Close button and "Go to initiative" button

## User Story

As a portfolio analyst, I want a more polished and functional UI with sticky headers, full-precision amount tooltips, consistent transaction formatting, better screen usage, proper date defaults, initiative favorites, and a quick-view drawer so that I can work more efficiently with portfolio data without constantly navigating between pages.

## Key Requirements

### Requirement 1: Sticky Detail Header

- On large screens (e.g., `lg` or `xl` breakpoints), the top section of the Detail page (containing Portfolio ID and initiative name) should become sticky below the navbar when scrolling down.
- On small/medium screens, the header should scroll normally (no sticky behavior).
- The sticky header should have appropriate z-index and visual styling (e.g., shadow) to indicate it's floating above content.

### Requirement 2: Importe Hover Tooltip

- All columns in data tables whose name starts with `importe` (or similar monetary fields shown as `#.### k€`) should display a tooltip on hover showing the full-precision value formatted as `#.###,## €`.
- This applies to: Search page tables, Detail page tables, Report page tables.
- The tooltip should use European number formatting (period for thousands, comma for decimals).

### Requirement 3: Transacciones Table Redesign

- The Transacciones section in the Detail page should adopt the same visual format as the Transacciones JSON section: estado shown as colored tags/badges, and collapsible rows for additional details.
- The Transacciones report page and Transacciones JSON report page should also adopt this format.
- Maintain all existing data and functionality; only the presentation changes.

### Requirement 4: Full-Width Layout

- On wide screens (e.g., `2xl` and above), the main content area should expand to use available screen width rather than being constrained to a fixed max-width.
- This should apply globally across all pages (Dashboard, Search, Reports, Detail).
- Ensure content remains readable and well-spaced at very wide resolutions.

### Requirement 5: Empty Default Date Filters

- In the Acciones report, Transacciones report, and Transacciones JSON report, date filter input fields should default to empty (blank) instead of showing "dd/mm/aa".
- The date inputs should still accept dates in the expected format when the user interacts with them.

### Requirement 6: Favorites System

- Add a star (or heart) icon button on each initiative row in the Search page to toggle favorite status.
- Favorite state persisted to localStorage using the existing `createStorage` utility.
- Toolbar actions for favorites:
  - **Copy to clipboard**: Copy all favorite portfolio IDs as a comma-separated string.
  - **Edit favorites**: Open a modal dialog listing all favorites with the ability to remove individual items.
  - **Clear all favorites**: Empty the entire favorites list (with confirmation).
- Visual indicator on rows that are favorited (e.g., filled star icon).

### Requirement 7: Initiative Quick-View Side Drawer

- Add an "eye" or "info" icon button on each initiative row in the Search page.
- Clicking opens a slide-in drawer from the right side of the screen.
- Drawer displays:
  - Header: portfolio_id, nombre
  - Key fields: origen, digital_framework_level_1, estado de la iniciativa, priorizacion, cluster, fecha de estado de la iniciativa
  - Current year importe value
  - Hechos table: list of hechos sorted by ascending ID, showing estado, fecha, importe columns
- Drawer actions:
  - Close button (X) in top-right corner
  - "Go to initiative" button that navigates to `/detail/:portfolio_id`
- Requires a backend call to fetch hechos data for the selected initiative.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
