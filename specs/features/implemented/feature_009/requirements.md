# Requirements Prompt for feature_009

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_009/specs.md' and './specs/features/feature_009/plan.md' in order to do that.

## Feature Brief

Add "Tema" field in the import from source Excel and map to the existing `tema` field in the database.

## User Story

As a user, I want the "Tema" column from the source Excel workbook to be imported and mapped to the `tema` field in the `tareas` table, so that each task retains its topic/theme classification after migration.

## Key Requirements

### Requirement 1: Map "Tema" column from Excel to `tema` database field

The management migration pipeline (`management/src/migrate/engine.py`) must read the "Tema" column from the source Excel sheet and populate the `tema` column in the `tareas` table during the migration process. If the "Tema" column is missing or a row has an empty value, the `tema` field should be set to `NULL`.

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
