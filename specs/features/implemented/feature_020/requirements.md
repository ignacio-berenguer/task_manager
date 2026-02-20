# Requirements Prompt for feature_020

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_020/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_020/plan.md' in order to to that.

## Feature Brief

Implement a new estado "Cierre económico iniciativa"

## User Story

As a user, I want to be able to deal with a new estado in table hechos called "Cierre económico iniciativa". This will mean considering it in datos_relevantes calculation and export to excel, in the frontend

## Key Requirements

### Requirement 1: Add a new calculated field to datos_relevantes

Datos relevantes is going to have a new columna called iniciativa_cerrada_economicamente of type boolean.

The calculation of iniciativa_cerrada_economicamente is as follows: if the iniciativa has a register in hechos with the estado = "Cierre económico iniciativa", then it is TRUE, otherwise it is FALSE.

In the export to the Excel it will map to the column "Iniciativa cerrada económicamente".

### Requirement 2: Modify the backend and frontend to consider the new field of datos_relevantes

The backend and frontend should be modified to consider the new field of datos_relevantes called iniciativa_cerrada_economicamente.

In addition to adding it to the API and to the search columns, the following should be done:

- Add it as a filter criteria for the dashboard page. By default, the criteria should be iniciativa_cerrada_economicamente = false. Also consider that the default criteria for the estado filter on the dashboard page should be estado <> "Cancelado"

- Add it as a filter criteria for the search page. By default, the criteria should be iniciativa_cerrada_economicamente = false

- Show the new filter to the detail page

### Requirement 3: the new value of estado "Cierre económico iniciativa" should not be considered for the calculation of estado_iniciativa, estado_aprobacion_iniciativa, estado_ejecucion_iniciativa of importe field

The new value of estado "Cierre económico iniciativa" should not be considered for the calculation of estado_iniciativa, estado_aprobacion_iniciativa, estado_ejecucion_iniciativa of importe fields... so it should be always in the list of excluded fields.

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md and specs/architecture_frontend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
