# Requirements Prompt for feature_029

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_029/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_029/plan.md' in order to do that.

## Feature Brief

Create-Update-Delete Notas functionality refinement using transacciones_json

## User Story

As a user, I want to create, update, and delete Notas for an initiative through the Detail page, with all changes tracked via transacciones_json, so that I have a reliable audit trail for all note modifications.

## Key Requirements

### Requirement 1: Registrado Por should be the name of the currently logged in user

The field "Registrado Por" should be set to the full name of the currently logged in user, and it should not be possible to change it

### Requirement 2: Fecha and Nota should be mandatory

Both Fecha and Nota fields should be mandatory

### Requirement 3: Toast message

After the create/update/delete operation is successfull a temporary toast success message should be shown on screen (color as success). Otherwise an toast error message should be shown (color as failure).

### Requirement 4: fecha_creacion, fecha_actualizacion should be automatically set

fecha_actualizacion should always be set to current datetime on insert/update

fecha_creacion should always be set to current datetime on insert

### Requirement 5: Prompt for confirmation before deleting

The user should explicitly Accept the delete operation with a very clear dialog box.

### Requirement 7: Use Notas Create/Update/Delete as a template for future implementation of these kind of operations in other entities

The current implementation of Notas Create/Update/Delete should be used as a template for future implementations on CUD operations in other entitites. Document this in the specs/architecture/architecture_frontend.md to be used as a template in the future.

### Requirement 8: Create a report for transacciones_json

Similar to the report for transacciones, there should be a report for transacciones_json called "Transacciones JSON".

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
