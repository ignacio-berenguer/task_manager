# Requirements Prompt for feature_016

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_016/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_016/plan.md' in order to to that.

## Feature Brief

Report for identifying the initiatives that have changed in the last period

## User Story

As a user, I want to be able to query the database to identify the initiatives that have changed in a period of time, also with the possibility of consulting the details of that initiative.

## Key Requirements

### Requirement 1: "Informes" navbar item

Create a "Informes" navbar item, after Search. It will contain in a dropdown menu additional items. All of them should only be visible for logged users.

### Requirement 2: Report "Iniciativas Cambiadas en el Periodo"

In the Informes item, there should be an option for "Iniciativas cambiadas en el Periodo", it will take the user to a new route for the page.

The user should be able to define the criteria of the report with a combination of the following filters:

- Digital Framework. The user can select any of the digital_frameworl_level_1 values (MANDATORY, BUSINESS IMPROVEMENT, RPA/IA, TLC...). The user can select all of them, one of the, or many values. It will be used to filter digital_framework_level_1

- Unidad. The user can select any of the unidad values. The user can select all of them, one of the, or many values. It will be used to filter unidad

- Cluster. The user can select any of the cluster values. The user can select all of them, one of the, or many values. It will be used to filter cluster

- Tipo. The user can select any of the tipo values. The user can select all of them, one of the, or many values. It will be used to filter tipo

- Fecha Inicio and Fecha Fin. The user can selecte the starting and ending date of the changes considered dd/mm/yyyy

### Requirement 3: Output results

The results will be shown in a grid that will be paginated in case there are too many values.

The user can select the page size (25-50-100-200). The default value is 50. The value selected by the user will be persisted to browser local storage.

The results will be all the hecho that have happeded between Fecha Inicio and Fecha Fin (both included). For each of the hecho records it will be shown:

- Portfolio ID, with a link to the details page
- Fecha
- Estado
- Nombre
- Nota
- Importe (from hechos table)
- ID (from hechos table)
- refernte_bi (from hechos table)
- Digital Framework Level 1 of the portfolio_id
- Unidad of the portfolio_id
- Cluster of the portfolio_id
- Tipo of the portfolio_id

Additional columns of the grid will be selectable by the user from a list of all the columns of datos_relevantes. The columns selected by the user and the order of the columns will be persisted to local browser storage. The default value will be the ones mentioned before. The user can reset selected columns and order to the default values.

The output results can be ordered by clicking on the column header.

### Requirement 4: Change application to Spanish

Some application titles, the home page, the nav items, the buttons, sections, the footer names are in English, they should be changed to Spanish. Please add this to the architecture_frontend.md document: the application frontend should be in Spanish.

### Requirement 5: Sections of Detail Page should be more visible

Currently the Detail page is a little flat. Please make the sections more visible by higlighting the section titles with a bigger font and background color that stands out both in light and dark background.

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
