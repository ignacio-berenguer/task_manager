# Requirements Prompt for feature_017

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_017/specs.md' and './specs/features/feature_017/plan.md' in order to do that.

## Feature Brief

I want to be able to log an accion (accion1) in a tarea and at the same time schedule a new action (accion2) for the future. The functionality should be accessible from the Search page in a button in the accion record, and also from the Detail page. The functionality should use a modal to query the user for the accion1 description (that should be logged as estado=COMPLETADO in fecha=TODAY()) and also for the next accion2 and the expected date (accion2 should be registered as PENDIENTE). The fecha siguiente actividad for the tarea should be the expected date of accion2.

## User Story

As a user, I want to complete a current action and schedule the next follow-up action in a single step, so that I can efficiently track progress on a task without having to perform multiple separate operations (mark action complete, create new action, update tarea's next action date).

## Key Requirements

### Requirement 1: "Complete & Schedule Next" Modal

A modal dialog that captures two pieces of information in one interaction:
- **Accion 1 (Completing)**: A description field for the action being completed. This action is saved with `estado = "Completada"` and `fecha_accion = TODAY()`.
- **Accion 2 (Scheduling)**: A description field and a date picker for the next planned action. This action is saved with `estado = "Pendiente"` and `fecha_accion` set to the selected future date.

### Requirement 2: Automatic Tarea Update

When the modal is submitted, the parent tarea's `fecha_siguiente_accion` field must be automatically updated to the `fecha_accion` of accion2 (the scheduled next action date).

### Requirement 3: Access from Search Page

A button (or icon) should be available on each accion record displayed in the Search page results, allowing the user to trigger the "Complete & Schedule Next" modal directly from search results.

### Requirement 4: Access from Detail Page

The same "Complete & Schedule Next" functionality should be accessible from the Detail page of a tarea, where acciones are listed.

### Requirement 5: Backend Support

A backend endpoint (or composition of existing endpoints) must support the atomic creation of accion1 (completed), accion2 (pending), and the update of the parent tarea's `fecha_siguiente_accion` in a single transaction.

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
