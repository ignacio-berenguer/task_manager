# Requirements Prompt for feature_041

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_041/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_041/plan.md' in order to do that.

## Feature Brief

UI improvements across multiple areas of the application:

1. **Search Page — LTP Quick Edit Modal**: In the Search page, add the option to quickly edit associated LTPs by displaying a modal that shows a table with the LTPs associated with the selected portfolio_id, with full CRUD capability (when creating, the portfolio_id should be pre-filled with the selected initiative's portfolio_id).

2. **LTP Side Drawer — Missing Top Section Data**: The LTP side drawer does not show the data for the top section (before Hechos). Fix it to display the initiative summary data correctly. Check if this could be happening also in other uses of the side drawer.

3. **Datos Descriptivos — Disable Delete**: The Delete record operation on Datos Descriptivos should not be possible. Remove or disable the delete action for this entity.

4. **Global Search (Top Menu Bar)**: In the top menu bar (accessible from any page) add a search icon that allows searching initiatives by portfolio_id or nombre. The user types a string and sees a dropdown list of initiatives whose portfolio_id or nombre contain that string. Selecting one navigates to the Detail page. The search should be activatable via keyboard shortcut (Ctrl+Shift+F).

5. **Informe LTPs — Default Estado Filter**: In the Informe LTPs report, the default value for the Estado filter should be "Pendiente".

6. **New Report Pages**: Add pages and menu items for:
   - Informe Justificaciones
   - Informe Dependencias
   - Informe Descripciones
   - Informe Notas

   Each with reasonable filter selections. All reports should have access to the Initiative side drawer from an icon before the portfolio_id, and the Detail page from a link in the portfolio_id name, similar to the existing search function.

## User Stories

- As a portfolio manager, I want to quickly edit LTPs associated with an initiative directly from the Search page so I don't have to navigate away to manage LTP data.
- As a user, I want the LTP side drawer to display all initiative summary data so I have full context when reviewing LTPs.
- As an administrator, I want to prevent accidental deletion of Datos Descriptivos records to protect critical reference data.
- As a user, I want a global search bar in the top menu so I can quickly find and navigate to any initiative from any page in the application.
- As a report user, I want the LTP report to default to "Pendiente" estado filter so I can immediately see pending items.
- As a report user, I want dedicated report pages for Justificaciones, Dependencias, Descripciones, and Notas so I can analyze and manage these data types with the same rich filtering and navigation capabilities as existing reports.

## Key Requirements

### Requirement 1: Search Page — LTP Quick Edit Modal

- Add a button/icon on each row in the Search page grid to open an LTP modal for that initiative
- The modal displays a table of LTPs associated with the selected portfolio_id
- CRUD operations within the modal:
  - **Create**: New LTP with portfolio_id pre-filled from the selected initiative
  - **Read**: Display all LTP fields in the table
  - **Update**: Inline or form-based editing of existing LTPs
  - **Delete**: Remove an LTP record (with confirmation)
- All CRUD operations go through the `transacciones_json` system

### Requirement 2: LTP Side Drawer — Fix Top Section

- Identify the missing data in the LTP side drawer's top section (before Hechos)
- Ensure the initiative summary data is fetched and displayed correctly
- Match the same layout/format used in other side drawers
- Check if the same could be happening for other uses o the initiative side drawer

### Requirement 3: Datos Descriptivos — Disable Delete

- Remove or disable the delete button/action for Datos Descriptivos records
- This applies in the Detail page and any other place where Datos Descriptivos CRUD is exposed
- For the time being, the backend should also reject delete requests for this entity if possible... but do not remove the logic just yet

### Requirement 4: Global Search in Top Menu Bar

- Add a search icon to the Navbar component (visible on all pages)
- Clicking the icon (or pressing Ctrl+Shift+F) opens a search input/dropdown
- As the user types, display matching initiatives (portfolio_id or nombre contains the typed string)
- Results show portfolio_id and nombre for easy identification
- Selecting a result navigates to `/detail/:portfolio_id`
- The search should be responsive and handle debounced input
- Use the existing search API endpoint for datos-relevantes or iniciativas

### Requirement 5: Informe LTPs — Default Estado Filter

- Set the default estado filter value to "Pendiente" when the LTP report page loads
- If the user has a saved preference in localStorage, that should take precedence
- Only applies to initial/fresh page load without saved preferences

### Requirement 6: New Report Pages

Add four new report pages following the `GenericReportPage` pattern:

#### Informe Justificaciones

- Filters: portfolio_id, tipo_justificacion (drop down with possible values), estado, date range
- Columns: portfolio_id, nombre (from initiative), tipo_justificacion, justificacion, fecha, estado
- Side drawer + detail link on portfolio_id

#### Informe Dependencias

- Filters: portfolio_id, tipo_dependencia (drop down with possible values), estado
- Columns: portfolio_id, nombre (from initiative), tipo_dependencia, dependencia, estado
- Side drawer + detail link on portfolio_id

#### Informe Descripciones

- Filters: portfolio_id, tipo_descripcion (drop down with possible values)
- Columns: portfolio_id, nombre (from initiative), tipo_descripcion, descripcion
- Side drawer + detail link on portfolio_id

#### Informe Notas

- Filters: portfolio_id, autor, date range
- Columns: portfolio_id, nombre (from initiative), autor, fecha, nota
- Side drawer + detail link on portfolio_id

Each report needs:

- Backend: filter-options endpoint + search endpoint
- Frontend: Route, menu item, GenericReportPage configuration
- Initiative side drawer icon before portfolio_id column
- portfolio_id as clickable link to Detail page

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
