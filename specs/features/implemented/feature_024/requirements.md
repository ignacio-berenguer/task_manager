# Requirements Prompt for feature_024

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_024/specs.md' and './specs/features/feature_024/plan.md' in order to do that.

## Feature Brief

When creating a new task from Detail, in the dialog box: (1) The default value for estado = "En curso". (2) It is important to request the next accion and the date of next accion. A new accion should be inserted in estado = Pendiente. Then the fecha_siguiente_accion of tarea should be set accordingly. When editing a Tarea from Detail, the Estado does not reflect the current value, neither it allows to select "En curso".

## User Story

As a user, I want the "Create Task" and "Edit Task" dialogs to properly handle estado values and next-action fields, so that new tasks default to "En curso", include next-action details, and editing correctly reflects and allows selecting all valid estado values including "En curso".

## Key Requirements

### Requirement 1: Default estado on new task creation

When creating a new task from the Detail page dialog, the estado field should default to "En curso" instead of requiring manual selection.

### Requirement 2: Next accion and fecha fields on task creation

The "Create Task" dialog must include fields for the next accion (action description) and the fecha (date) of the next accion. When a new task is created:
- A new accion record should be automatically inserted with estado = "Pendiente"
- The tarea's `fecha_siguiente_accion` should be set to the provided next-action date

### Requirement 3: Fix estado display on task edit

When editing a Tarea from the Detail page, the Estado dropdown must:
- Correctly reflect the current estado value of the tarea being edited
- Include "En curso" as a selectable option in the dropdown
- Display all valid estado values from the estados_tareas table

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
