# Requirements Prompt for feature_002

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_002/specs.md' and './specs/features/feature_002/plan.md' in order to do that.

## Feature Brief

Customize the migration from Excel of tareas. Specifically:

1. **Column mapping**: The columns in the source Excel file are Tarea, Responsable, Notas, Fecha NBA, Estado — map them to the database table `tareas` fields.
2. **Acciones from Notas**: The `Notas` column normally contains a line for each accion that should be migrated to the `acciones` table. Each line starts with a date (that may be followed by ":" or " ", and that can be in the format DD/MM/YYYY or DD/MM — in which case the year will be 2025 or the year of the previous line). Create an `acciones` record with each line of Notas, and those acciones should have `estado = "COMPLETADO"`.
3. **NBA lines**: Lines of Notas that start with "NBA:" mean "next best action" and should be acciones to be executed in the future (one week from now). Mark those acciones with `estado = "PENDIENTE"`.
4. **Text normalization**: When creating acciones, ensure that the first letter is always uppercase, and trim left spaces or punctuation marks.
5. **Preserve original notas**: Although it will be removed later, store the current notas in a `notas_anteriores` field in the `tareas` table, and display it in the frontend detail page.
6. **Parametric responsable table**: Create a parametric table with Responsable values, to be used in filter and CRUD forms.
7. **Acciones source**: The `acciones` table is NOT read from a dedicated Excel table — it is populated from the `Notas` field of the tareas Excel table.

## User Story

As a portfolio manager, I want the tareas migration to automatically parse the Notas column into individual acciones records, so that I can track each action item separately with its date, estado, and description, while preserving the original notes for reference.

## Key Requirements

### Requirement 1: Excel-to-DB Column Mapping for Tareas

Map the Excel source columns to the `tareas` database table fields:
- **Tarea** → `tarea` (or appropriate field)
- **Responsable** → `responsable`
- **Notas** → parsed into `acciones` records + stored as `notas_anteriores`
- **Fecha NBA** → `fecha_nba`
- **Estado** → `estado`

Verify the exact column names in the Excel source and the existing `tareas` table schema. Add any missing fields (e.g., `notas_anteriores`) to the schema.

### Requirement 2: Parse Notas into Acciones Records

During migration, parse each line in the `Notas` field:
- Lines starting with a date (DD/MM/YYYY or DD/MM) followed by ":" or " " → create an `acciones` record with `estado = "COMPLETADO"`
- The date format DD/MM (without year) should default to 2025 or inherit the year from the previous line
- Lines starting with "NBA:" → create an `acciones` record with `estado = "PENDIENTE"` and a future date (today + 7 days)
- Text normalization: first letter uppercase, trim leading spaces and punctuation marks

### Requirement 3: Preserve Original Notas

- Add `notas_anteriores` TEXT field to the `tareas` table schema
- Store the raw `Notas` content from Excel in this field during migration
- Display `notas_anteriores` in the frontend detail page (read-only)

### Requirement 4: Parametric Responsable Table

- Create a `responsables` parametric table (or similar) with unique Responsable values extracted during migration
- Use this table to populate filter dropdowns and CRUD form selectors in the frontend

### Requirement 5: Acciones Table Population

- The `acciones` table should NOT have a dedicated Excel reader — it is exclusively populated from parsing the `Notas` field of the tareas Excel table
- Each accion record should be linked to the parent tarea (via `tarea_id` or `portfolio_id`)

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
