# Requirements Prompt for feature_012

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_012/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_012/plan.md' in order to to that.

## Feature Brief

Calculated fields

## User Story

As a developer, I want to treat differently calculated fields from master fields.

## Key Requirements

### Requirement 1: Calculated Fields should be marked in the code

The following fields of the database tables:list of fields are calculated:

- datos_descriptivos: estado_de_la_iniciativa, justificacion_regulatoria, falta_justificacion_regulatoria

- justificaciones: nombre, digital_framework_level_1

- grupos_iniciativas: nombre_componente, importe_2025_componente, importe_2025_grupo

- informacion_economica: nombre, referente_bi, cluster_2025, digital_framework_level_1, origen, estado, debe_tener_cini, debe_tener_capex_opex, debe_tener_fecha_prevista_pes, debe_tener_wbe, budget_2026, importe_2025, importe_2026

- facturacion: descripcion

- datos_ejecucion: nombre, unidad, estado_de_la_iniciativa, fecha_de_ultimo_estado, origen, importe_2025, importe_facturado_2025, tipo_agrupacion

- hecho: nombre, referente_bi

- beneficio: nombre, estado_de_la_iniciativa

- etiquetas: nombre

- ltp: nombre, digital_frameworl_level_1

- wbes: nombre

- notas: nombre, referente_bi

- avance: descripcion

- acciones: nombre, unidad, estado, cluster_2025, tipo, siguiente_accion, siguiente_accion_comentarios, referente_bi, referente_b_unit, referente_ict, importe_2025, importe_2025

- descripciones: nombre, digital_framewrk_level_1, estado_de_la_iniciativa, referente_b_unit

- estado_especial: nombre

- investment_memos: nombre

- impacto_aatt: nombre, estado_de_la_iniciativa, digital_framework_level_1, fecha_prevista_finalizacion, fecha_finalizacion_ict, falta_evaluation_impacto_aatt

Please remember that the tables datos_relevantes and iniciativas is a completely calculated table.

The calculated fields should be defined in code.

## Requirement 2: The API should not modify calculated fields in CRUD operations

In the Create, Update operations of the API CRUD operations, calculated fields should not be modified.

## Requirement 3: Calculated Fields should be calculated in Read operations, both in the CRUD and in the Search endpoints of the API

In the Read operations both of CRUD and Search, the calculated fields should not be retrieved from the database but calculated by the API with specific calculation functions. These calculation functions will be defined in a dedicated package called calculated_fields in the API module.

Please analyze the calculated fields and provide a proposal of the calculation functions to be implemented, and also the assignment of the calculated fields to the calculation function, I will review before you start implementation.

The assignment of the calculation function to the calculated field shoud be defined in code.

## Requirement 4: Implementation of the calculation funtions to calculate the calculated_fields

The calculation functions need to be implemented. Many of them are simple lookup functions to other database tables (notably datos_relevantes, datos_descriptivos, informacion_economicaand some others). Please do your best to provide an implementation of the calculation funcions.

### General requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_backend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
