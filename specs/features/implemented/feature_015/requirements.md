# Requirements Prompt for feature_015

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_015/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_015/plan.md' in order to to that.

## Feature Brief

Implement initiative Search in the UI, and the Detail page in the UI

## User Story

As a user, I want to be able to search initiatives using very flexible criteria, and show the data in a grid that will allow me to explore the initiatives, short or filter, export to excel and perform some actions on each initiative.

As a user, I want to be able to see the detail of an initiative.

## Key Requirements

### Requirement 1: Filter criteria

The criteria for searching the initiatives will be a combination of the following filters:

- Portfolio ID. The user can write a portfolio ID, write a list of portfolio ID separated by comma, or select from a dropdown list that will show Portfolio ID + Nombre. It will be used to filter field portfolio_id

- Nombre. The user can write a wildcard expression that will be used to filter field nombre

- Digital Framework. The user can select any of the digital_frameworl_level_1 values (MANDATORY, BUSINESS IMPROVEMENT, RPA/IA, TLC...). The user can select all of them, one of the, or many values. It will be used to filter digital_framework_level_1

- Unidad. The user can select any of the unidad values. The user can select all of them, one of the, or many values. It will be used to filter unidad

- Estado de la iniciativa. The user can select any of the cluster values. The user can select all of them, one of the, or many values. It will be used to filter estado_de_la_iniciativa

- Cluster. The user can select any of the cluster values. The user can select all of them, one of the, or many values. It will be used to filter cluster

- Tipo. The user can select any of the tipo values. The user can select all of them, one of the, or many values. It will be used to filter tipo

### Requirement 2: Output results

The results will be shown in a grid that will be paginated in case there are too many values.

The user can select the page size (25-50-100-200). The default value is 50. The value selected by the user will be persisted to browser local storage.

The columns of the grid will be selectable by the user from a list of all the columns of datos_relevantes. The columns selected by the user and the order of the columns will be persisted to local browser storage. The default value will be: portfolio_id, nombre, unidad, digital_framework_level_1,estado_de_la_iniciativa, fecha_de_ultimo_estado, cluster, tipo, importe_2026. There user can reset selected columns and order to the default values.

The output results can be ordered by clicking on the column header.

### Requirement 3: Actions on the initiatives

On each line of the initiatives displayed in the grid there will be a set of icon buttons with some possible actions to be executed on the initiative. In this feature, the only action will be "View", that will navigate the user to a new home page on /detail/:portfolio_id that will show the detail of the initiative (see requirement below).

But there will be more actions implemented in the future (i.e. Editar, Registrar Hecho, Agregar Justificación, Agregar Descripción, Agregar Notas, Documentación).

### Requirement 4: Actions on the set of initiatives displayed on the grid

The user can export the full list of initiatives selected to tab-delimitted, CSV, JSON or Excel files.

### Requirement 5: View initiative detail

View initiative detail is a page accessible on /detail/:portfolio_id that will display all the information about the initiative in the database, using the following order:

- datos_descriptivos
- hechos
- informacion_economica
- datos_relevantes: importe fields from datos_relevantes organized in a meaningful way
- acciones (if any)
- notas (if any)
- justificaciones (if any)
- descripciones (if any)
- beneficios (if any)
- ltp (if any)
- facturacion (if any)
- datos_ejecucion (if any)
- grupos_iniciativas (if any)
- estado_especial (if any)
- transacciones (if any)
- If I'm missing any information, please let me know and I'll review the specs

Considering that there is so many information to display, consider structuring it in tabs / accordions

The page will have a button on the upper zone for going back to the previous page.

There will be additional buttons for actions to be implemented in the future (i.e. Editar, Registrar Hecho, Agregar Justificación, Agregar Descripción, Agregar Notas, Documentación)

Please display the information in a compact way so it is possible to see as much information on screen as possible, but keep the forma clear and uncluttered.

The detail page is only accesible to registered users.

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
