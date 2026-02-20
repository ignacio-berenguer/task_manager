# Requirements Prompt for feature_030

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_030/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_030/plan.md' in order to do that.

## Feature Brief

Implementation of CUD (Create/Update/Delete) operations for 9 entities on the Detail page: datos_descriptivos, informacion_economica, justificaciones, descripciones, etiquetas, grupos_iniciativas, wbes, dependencias, ltp. All operations should follow the CUD pattern established in feature_029 (Notas), using the transacciones_json system for audit trail.

## User Story

As a user, I want to create, update, and delete records for datos_descriptivos, informacion_economica, justificaciones, descripciones, etiquetas, grupos_iniciativas, wbes, dependencias, ltp, hechos, acciones, estado_especial, impacto_aatt directly from the Detail page, with all changes tracked via transacciones_json, so that I can manage all initiative data without leaving the application.

## Key Requirements

### Requirement 1: Follow the CUD pattern from feature_029

All entities must follow the established CUD modal pattern documented in specs/architecture/architecture_frontend.md section 14.4, including:

- Form modal with create/edit/delete modes
- Registrado por auto-set from Clerk useUser() (read-only)
- Toast notifications (sonner) for success/error
- ConfirmDialog for delete confirmation
- Commit message required for all operations (including delete)
- Form state reset on dialog open (useEffect on open)
- Auto-focus on primary content field
- Tab order: fields -> commit message -> submit button (tabIndex={-1} on Eliminar/Cancelar)
- Backend auto-sets fecha_actualizacion via transaction_processor.py

### Requirement 2: Entity-specific field definitions

For each of the 9 entities, define which fields are editable, which are required, which are read-only, and any entity-specific validation rules:

(1) datos_descriptivos

User should be able to edit: portfolio_id, nombre, unidad, origen, digital_framework_level_1, tipo, prioridad_descriptiva_bi, priorizacion, tipo_proyecto, referente_bi, referente_b_unit, referente_enabler_ict, it_partner, codigo_jira, tipo_agrupacion

Default values:

origen = "Nuevo 26"
prioridad*descriptiva_bi = "SIN DEFINIR"
priorizacion = "96 PENDIENTE PRIORIZAR"
tipo_proyecto = "DEV"
referente_bi = "SIN IDENTIFICAR"
referente_b_unit* = "SIN IDENTIFICAR"
it_partner = "SIN IDENTIFICAR"
tipo_agrupacion = "Iniciativa Individual"

(2) informacion_economica

User should be able to edit:
cono, capex_opex (select from "CAPEX", "OPEX"), fecha_prevista_PES, cluster, finalidad_budget, proyecto_especial, clasificacion, tlc, tipo_inversion, observaciones

Default values:
CINI = "PENDIENTE DEFINIR"
capex_opex = "PENDIENTE DEFINIR"
cluster = "PENDIENTE DEFINIR"
finalidad_budget = "PENDIENTE DEFINIR"
proyecto_especial = "PENDIENTE DEFINIR"
clasificacion = "PENDIENTE DEFINIR"
tlc = "PENDIENTE DEFINIR"
tipo_inversion = "PENDIENTE DEFINIR"

(3) justificaciones

User should be able to edit:
tipo_justificacion, valor, fecha_modificacion, origen_registro

Default values:
fecha_modification = current date and time

(4) descripciones

User should be able to edit:

tipo_descripcion, descripcion, origen_registro, comentarios

Default values:

(5) etiquetas

User should be able to edit:
etiqueta, valor, origen_registro, comentarios

Readonly field:
fecha_modificacion = current date

Default values:

(6) grupos_iniciativas

User should be able to edit:
portfolio_id_grupo, portfolio_id_componente, nombre_grupo, tipo_agrupacion_grupo, tipo_agrupacion_componente

Default values:

(7) wbes

User should be able to edit:

anio, wbe_pyb, descrpicion_pyb, wbe_can, descripcion_can

Default values:
anio = current year as integer

(8) dependencias

User should be able to edit:
descripcion_dependencia, fecha_dependencia, comentarios

Default values:

(9) ltp

User should be able to edit:

responsable, tarea, siguiente_accion,
estado, comentarios

Default values:

(10) Hechos

User should be able to edit:
partida_presupuestaria, importe, estado, fecha, importe_ri, importe_re, notas, racional, calidad_estimacion

Default values:
fecha = current date

(11) acciones

User should be able to edit: siguiente_accion_comentarios

(12) estado especial

User should be able to edit: estado_especial, comentarios, fecha_modificacion

Default values:
fecha_modificacion should be set to current date on inert and update

(13) impacto_aatt

User should be able to edit:

tiene_impacto_en_aatt, afecta_a_ut_red_mt_bt, afecta_om_cc, afecta_pm, afecta_hseq, afecta_inspecciones, afecta_at, comentario

### Requirement 3: use subagents to conserve context window

In order to conserve context window, if possible delegate the implementation task to subagents.

### Requirement 4: Date and Datetime fields

Date and datetime fields, if possible to change, should have have a date or datetime picker.

### Requirement 5: Parametrize default values for the fields in the different entities, so it is easy to change in the future

Parametrize default values for the fields in the different entities in a single place in the application (or configuration file), so it is easy to change in the future

Document this in the architecture_frontend document so it is easy to use in the future.

### Requirements 6: portfolio_id

portfolio_id should be read only except in the creation of a new initiative in datos_relevantes

### Requirements 7: long-text fields

Identify the long text fields, and in the edit/insert form provide a multiline text are for editing them.

It is interesting to parametrize the identification of long_text fields in the different entities in a single place in the application (or configuration file) so it is easy to change in the future.

Document this in the architecture_frontend document so it is easy to use in the future.

### Requirements 8: monetary fields

All the importeXXX fields are monetary. Provide a mask that allows to enter a monetary value with 2 decimal digits in €.

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
