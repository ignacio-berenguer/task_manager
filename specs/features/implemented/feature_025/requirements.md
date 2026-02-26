# Requirements Prompt for feature_025

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_025/specs.md' and './specs/features/feature_025/plan.md' in order to do that.

## Feature Brief

The "Completar y Programar" dialog, accessible from the Search Page and from the Detail Page, should be enhanced so that when the task has a pending action, it proposes the current pending action text as the action to complete (pre-filled but editable). Saving should mark that existing action as completed. If the user also provides a "Siguiente accion", a new action record is created.

## User Story

As a user, when I use "Completar y Programar" on a task that has a pending action, I want the dialog to pre-fill the pending action's text so I can confirm or edit it before marking it as completed, and optionally schedule a new follow-up action — so I don't have to manually look up what the pending action was or separately update its status.

## Key Requirements

### Requirement 1: Pre-fill pending action text in Completar y Programar dialog

When opening the "Completar y Programar" dialog for a task that has a pending action (estado = "Pendiente" or "En Progreso"), the dialog should:
- Detect the most recent pending action for the task
- Pre-fill the "Accion completada" field with that action's text
- Allow the user to edit the pre-filled text before saving
- Display a visual indication that this is an existing action being completed

### Requirement 2: Mark existing pending action as completed on save

When the user saves the dialog with a pre-filled (or edited) pending action:
- The existing pending action record should be updated (not a new one created) with estado = "Completada"
- The action text should be updated if the user edited it
- The fecha_accion should be set to today's date (or the date selected in the dialog)

### Requirement 3: Create new action only for "Siguiente accion"

If the user provides a "Siguiente accion" (next action) in the dialog:
- A new action record should be created with estado = "Pendiente"
- The task's fecha_siguiente_accion should be updated to the scheduled date
- This behavior remains the same as the current implementation

### Requirement 4: Handle tasks without pending actions

When the task has no pending actions:
- The dialog should behave as it currently does (empty action field for the user to fill in)
- A new completed action is created as before

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Both the Search Page and Detail Page instances of the dialog must behave consistently.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
