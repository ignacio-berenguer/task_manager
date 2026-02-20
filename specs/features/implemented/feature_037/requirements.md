# Requirements Prompt for feature_037

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_037/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_037/plan.md' in order to do that.

## Feature Brief

Parametric tables. (1) I want to create parameter tables in the db to store dropdown values from the main codified fields: digital_framework_level_1, estado, origen, priorizacion, tipo, cluster, unidad, anio, capex_opex, prioridad_descriptiva_bi, tipo_proyecto, referente_bi, tipo_agrupacion, it_partner; (2) From the time being, these parameter tables should be emptied when migration starts, and filled with the values that are used in the fields of the migrated tables. (3) The insert/edit screens for the entities in the frontend should use dropdowns populated with these options to limit user edits to the values available.

## User Story

As a user, I want the application to provide dropdown selectors populated from parametric tables for all codified fields (digital_framework_level_1, estado, origen, priorizacion, tipo, cluster, unidad, anio, capex_opex, prioridad_descriptiva_bi, tipo_proyecto, referente_bi, tipo_agrupacion, it_partner), so that when I create or edit entities I can only select from valid, consistent values rather than typing free text.

## Key Requirements

### Requirement 1: Parametric Database Tables

Create parameter tables in the SQLite database schema to store the allowed dropdown values for each of the following codified fields:
- digital_framework_level_1
- estado
- origen
- priorizacion
- tipo
- cluster
- unidad
- anio
- capex_opex
- prioridad_descriptiva_bi
- tipo_proyecto
- referente_bi
- tipo_agrupacion
- it_partner

Each parameter table should store at minimum the value itself (and potentially a display label or sort order if appropriate).

### Requirement 1b: Estado Sort Order

The `estado` parameter values must be stored with an explicit sort order matching the workflow sequence:

1. Recepción
2. SM100 Redacción
3. SM100 Final
4. SM200 En Revision
5. SM200 Final
6. Análisis BI
7. Revisión Regulación
8. En Revisión P&C
9. Pendiente de Unidad Solicitante
10. Encolada por Prioridad
11. En Aprobación
12. Aprobada
13. Aprobada con CCT
14. En ejecución
15. Finalizado
16. Pendiente PES
17. PES Completado
18. Facturación cierre año
19. Cierre económico iniciativa
20. Importe Estimado
21. Importe Planificado

Any estado values found during migration that are NOT in this list should be appended at the end (alphabetically, after the ordered ones).

### Requirement 2: Migration Population

During the migration process (management CLI):
- All parameter tables should be **emptied** (truncated) at the start of migration
- After migrating the main data, the parameter tables should be **populated** with the distinct values actually used in the corresponding fields of the migrated tables
- This ensures the parameter tables always reflect the current data set

### Requirement 3: Backend API Endpoints

Expose API endpoints for each parameter table so the frontend can fetch the allowed values for dropdowns. These should follow the existing CRUD router pattern.

### Requirement 4: Frontend Dropdown Integration

All insert/edit screens for entities in the frontend that use any of these codified fields should present **dropdown selectors** populated from the corresponding parameter table API endpoint, instead of free-text input. This limits user edits to the valid values available in the system.

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
