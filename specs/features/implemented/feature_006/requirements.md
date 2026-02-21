# Requirements Prompt for feature_006

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_006/specs.md' and './specs/features/feature_006/plan.md' in order to do that.

## Feature Brief

Implement the Actions. (1) Add the Añadir Acción and Cambiar Fecha Siguiente Acción buttons to the Detail Page. (2) The Añadir Acción button displays a modal dialog that allows the user to enter: Accion, Fecha (by default today). This will create a new accion associated with current tarea in estado PENDIENTE with the accion and fecha selected. Also it will modify the fecha_siguiente_accion of the tarea to the fecha selected. (3) The Cambiar Fecha Siguiente Accion button shows a modal dialog that allows the user to edit the current date of the tarea.

## User Story

As a user, I want to quickly add new actions to a task and update the next action date directly from the Detail Page, so I can track progress on tasks without navigating away or performing multiple operations manually.

## Key Requirements

### Requirement 1: Añadir Acción Button and Modal Dialog

- Add an "Añadir Acción" button to the Detail Page (visible when viewing a tarea)
- Clicking the button opens a modal dialog with the following fields:
  - **Acción** (text input, required): Description of the action
  - **Fecha** (date input, required, default: today's date): Date of the action
- On submit:
  - Create a new `accion_realizada` record associated with the current `tarea_id` with estado "Pendiente" and the entered acción and fecha
  - Update the tarea's `fecha_siguiente_accion` to the selected fecha
  - Refresh the acciones list and tarea details on the page
- On cancel: close the dialog without changes

This action is also accesible from the search page results, using the icon button.

### Requirement 2: Cambiar Fecha Siguiente Acción Button and Modal Dialog

- Add a "Cambiar Fecha Siguiente Acción" button to the Detail Page
- Clicking the button opens a modal dialog with:
  - **Fecha Siguiente Acción** (date input, required, pre-filled with current tarea's `fecha_siguiente_accion`)
- On submit:
  - Update the tarea's `fecha_siguiente_accion` to the new date
  - Refresh the tarea details on the page
- On cancel: close the dialog without changes

This action is also accesible from the search page results, using the icon button.

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
