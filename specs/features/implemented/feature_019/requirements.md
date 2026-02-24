# Requirements Prompt for feature_019

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_019/specs.md' and './specs/features/feature_019/plan.md' in order to do that.

## Feature Brief

When an action is edited in the Detail page, after the edit the field `fecha_siguiente_accion` of the parent tarea should be automatically set to the maximum `fecha_accion` among all acciones linked to that tarea that have `estado = 'Pendiente'` (case insensitive comparison). If no pending acciones exist, `fecha_siguiente_accion` should be set to `NULL`.

## User Story

As a user, I want the task's next action date (`fecha_siguiente_accion`) to automatically update whenever I edit an action, so that the task always reflects the latest pending action date without me having to manually update it.

## Key Requirements

### Requirement 1: Auto-update `fecha_siguiente_accion` on action edit

When an action (`accion`) is updated via the Detail page (PUT endpoint), the system should:

1. After successfully saving the action edit, query all `acciones_realizadas` linked to the same `tarea_id`
2. Filter for actions where `estado` matches `'Pendiente'` (case insensitive)
3. Find the maximum `fecha_accion` among those filtered actions
4. Update the parent `tareas` record's `fecha_siguiente_accion` to that maximum date
5. If no actions have `estado = 'Pendiente'`, set `fecha_siguiente_accion` to `NULL`

### Requirement 2: Apply the same logic on action create and delete

The auto-update logic should also trigger when:
- A new action is created (POST)
- An action is deleted (DELETE)

This ensures `fecha_siguiente_accion` is always consistent regardless of how the actions list changes.

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
