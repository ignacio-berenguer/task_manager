# Requirements Prompt for feature_014

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_014/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_014/plan.md' in order to to that.

## Feature Brief

Improve the dashboard on the frontend application

## User Story

As a user, I want to be able to view the most important metrics and datos from the Portfolio Digital with a simple dashboard vision.

## Key Requirements

### Requirement 1: Year selector

On the upper part of the dashboard the user should be able to select a Year (2025, 2026, 2027, 2028). The year will be used as a filter criteria for all dashboard information. Initially, the year selected will be equal to the current year.

### Requirement 2: Digital Framework Level 1 selector

On the upper part of the dashboard the user should be able to select a "Digital Framework" selector, that will set the kind of digital_framework_level_1 that will be included in the dashboard. It can be MANDATORY, BUSINESS IMPROVEMENT, TLC, DISTRIBUTED SERVICES, OPEX CAPITALIZATION or CYBERSECUTIRY. The user can simultaneously choosed one or more values, or choose all of the values. all the data in the dashboard will be filtered accordingly to the Digital Framework selected.

### Requirement 3: Business Unit selector

On the upper part of the dashboard the user should be able to select a "Unidad" selector, that will set the kind of unidad that will be included in the dashboard. It can be any of the values of the business units in the database. The user can simultaneously choosed one or more values, or choose all of the values. all the data in the dashboard will be filtered accordingly to the unidad selected.

### Requirement 4: Cluster selector

On the upper part of the dashboard the user should be able to select a "Cluster" selector, that will set the kind of cluster that will be included in the dashboard. It can be any of the values of the clusters in the database. The user can simultaneously choosed one or more values, or choose all of the values. all the data in the dashboard will be filtered accordingly to the unidad selected.

### Requirement 5: Initiatives by Status (number)

The initiatives by status chart will remain as it is, filtered by the selectors. Change the title to "Iniciativas por Estado (número). Get the data from datos_relevantes.

### Requirement 6: Initiatives by Status (value)

Create a horizontal bar chart displaying the total importe of initiatives, filtered by the selectors. Change the title to "Iniciativas por Estado (importe). Get the data from datos_relevantes.

## Requirement 7: Initiatives by Unit (number)

The initiatives by status chart will remain as it is, filtered by the selectors. Change title to "Iniciativas por Unidad (número)". Get the data from datos_relevantes.

## Requirement 8: Initiatives by Unit (importe)

Create a horizontal bar chart displaying the total importe of initiatives by unidad, filtered by the selectors. Change the title to "Iniciativas por Unidad (importe). Get the data from datos_relevantes.

## Requirement 9: Initiatives by Cluster (number)

Create a horizontal bar chart displaying the total number of initiatives by cluster, filtered by the selectors. Change the title to "Iniciativas por Cluster (cluster). Get the data from datos_relevantes.

## Requirement 10: Initiatives by Cluster (importe)

Create a horizontal bar chart displaying the total importe of initiatives by cluster, filtered by the selectors. Change the title to "Iniciativas por Unidad (importe). Get the data from datos_relevantes.

### Requirement 11: Persistency of selector

The values of the selector will be persisted to browser storage so that the next time the user opens the dashboard, they remain as they were.

### Requirement 12: Format of axis

All value axis (importe) should be shown in thousands of € (k€), using "." as thousands separator. No decimals.

All number axis (número) should be shown in units, using "." as thousands separator. No decimals

Yeards should be shown in YYYY, without decimal separators.

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
