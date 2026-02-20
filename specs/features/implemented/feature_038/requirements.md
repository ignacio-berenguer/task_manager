# Requirements Prompt for feature_038

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_038/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_038/plan.md' in order to do that.

## Feature Brief

UI improvements across multiple report pages, detail page, and a new Parametricas page:

1. **Hechos Report — Side Drawer**: Add a button to display the side drawer (initiative detail panel) similar to the Search page.
2. **Estado Tag Display**: In the Hechos report, Etiquetas report, and the Hechos table in the Detail page, render the Estado field as a styled tag/badge instead of plain text.
3. **Hechos Report — Expandable Rows**: Make Hechos report rows expandable to reveal full Hecho record details (Nota, and all other Hecho fields).
4. **LTP Report — Estado Tag**: In the LTP report, display the Estado field as a styled tag/badge.
5. **LTP Report — Expandable Rows**: Make LTP report rows expandable to show the Comentarios field (note: Comentarios can also be displayed as a regular column in the table).
6. **New "Parametricas" Page**: Add a new menu item "Parametricas" that navigates to a new page providing full CRUD operations on the `parametros` table.

## User Story

As a portfolio manager, I want enhanced report views with styled estado tags, expandable row details, a side drawer in the Hechos report, and a new Parametricas management page, so that I can more efficiently review initiative data and manage system parameters without leaving the application.

## Key Requirements

### Requirement 1: Hechos Report — Side Drawer Button

- Add a button (similar to the one in the Search page) that opens a side drawer showing initiative detail
- The drawer should display relevant portfolio data for the selected row
- Follow the same UX pattern already implemented in the Search page

### Requirement 2: Estado Field as Tag (Hechos, Etiquetas, Detail/Hechos)

- In the Hechos report, Etiquetas report, and the Hechos accordion table in the Detail page, render the Estado column as a colored tag/badge
- Tag colors should follow the estado workflow conventions used elsewhere in the app
- Replace plain text estado values with the styled tag component

### Requirement 3: Hechos Report — Expandable Rows

- Each row in the Hechos report should be expandable (click to expand/collapse)
- The expanded area should show all Hecho record details: Nota, and any other fields not visible in the main table columns
- Provide a clean layout for the expanded content

### Requirement 4: LTP Report — Estado Tag

- In the LTP report, render the Estado column as a colored tag/badge
- Use the same tag component/styling as Requirement 2

### Requirement 5: LTP Report — Expandable Rows

- Each row in the LTP report should be expandable to show the Comentarios field
- Note: Comentarios can also optionally be configured as a visible column in the table
- The expanded area should display the full Comentarios text

### Requirement 6: New "Parametricas" Page with CRUD

- Add a new navigation menu item called "Parametricas"
- Create a new protected route and page for managing the `parametros` table
- Implement full CRUD operations: Create, Read, Update, Delete
- The page should display parametros records in a table format
- Provide inline editing or a form/dialog for create and update operations
- Include confirmation for delete operations
- Follow existing patterns for CRUD (transacciones_json system)

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
