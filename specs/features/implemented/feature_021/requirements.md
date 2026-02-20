# Requirements Prompt for feature_021

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_021/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_021/plan.md' in order to to that.

## Feature Brief

Improvements to the dashboard

## User Story

As a user, I want to have a very informative dashboard page that allows me to check in a glimpse the status of the portfolio

## Key Requirements

### Requirement 1: Number and Value of Initiatives

The first pair of charts in the dashboard should be number and value of initiatives.

### Requirement 2: Number and Value of Initiatives by Priority

The second pair of charts in the dashboard should be number and value of initiatives by priotity.

### Requirement 3: Number and Value of Initiatives by Unidad

The next pair of charts in the dashboard should be number and value of initiatives by Unidad

### Requirement 3: Number and Value of Initiatives by digital_framework_level_1

The next pair of charts in the dashboard should be number and value of initiatives by Framework

### Requirement 4: Number and Valur of Initiatives by Cluster

The next pair of charts in the dashboard should be number and value of initiatives by Cluster

### Requirement 5: Number and Valur of Initiatives by Estado

The next pair of charts in the dashboard should be number and value of initiatives by Estado

### Requirement 6: Filter by Initiative For This Year

Add a filter "Iniciativa prevista esta año" that should filter on datos_relevantes.en_presupuesto_del_ano

### Requirement 7: Filter by Estado

Add a filter by Estado

### Requirement 9: Filter "Excluir Canceladas"

Add a toggle filter "Excluir Canceladas" that should exclude iniciativas with estado = "Cancelado". By default it shoud be active.

### Requirement 10: Filter "Excluir EPTs"

Add a toggle filter "Excluir EPTs" that should exclude iniciativas with tipo including any string containing "EPT". By default it shoud be active.

### Requirement 11: Filter "Excluir Iniciativas Cerradas Económicamente"

Add a toggle filter "Excluir Iniciativas Cerradas Económicamente" that should exclude iniciativas with datos_relevantes.iniciativa_cerrada_economicamente true. By default it shoud be active.

### Requirement 12: When hovering over the charts, the label and value are difficult to read, specially in dark model

When hovering over the charts, the label and value are difficult to read, specially in dark model. Please set the color of the hovering labels to something that is easy to read.

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
