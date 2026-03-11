# Requirements Prompt for feature_029

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_029/specs.md' and './specs/features/feature_029/plan.md' in order to do that.

## Feature Brief

(1) When a modal form is open, set the focus on the 1st control. (2) In the complete and program modal, after writing the description of the next action, when tab is pressed move to the Aceptar button. (3) In the Detail page if there is a change to the tarea, when going back to the Search screen, the search should be refreshed. (4) Add a "Completar acción" icon button to the accion list items. (5) In the "Cambiar Fecha Siguiente Acción" button in the Search Tareas page, in case that the tarea has any accion in estado = "Pendiente" status, all the actions estado = "Pendiente" with the minimum fecha will be updated to the new updated fecha of the parent tarea so that the fecha of tarea will be the minimum fecha of acciones with estado = "Pendiente".

## User Story

As a user, I want modal forms to be more intuitive (auto-focus, proper tab order), I want search results to stay fresh after detail edits, I want a quick way to complete actions from the list, and I want date changes on tareas to propagate correctly to pending acciones — so that my workflow is faster and data stays consistent.

## Key Requirements

### Requirement 1: Auto-focus first control in modal forms

When any modal/dialog form opens, the first interactive control (input, select, textarea, date picker) should automatically receive focus. This improves keyboard accessibility and speeds up data entry.

### Requirement 2: Tab from next action description to Aceptar button

In the "Completar y Programar" modal (and any similar modal with a next action description field), pressing Tab after filling in the description of the next action should move focus to the "Aceptar" (submit) button, enabling a quick keyboard-only workflow.

### Requirement 3: Refresh search results after tarea changes in Detail page

When the user modifies a tarea in the Detail page and navigates back to the Search screen, the search results should be refreshed to reflect the changes. This ensures the search list always shows up-to-date data after edits.

### Requirement 4: Add "Completar acción" icon button to accion list items

Each accion item in the acciones list (Detail page) should have a "Completar acción" icon button that allows the user to quickly mark an action as completed (estado = "Completada") without opening a full edit form.

### Requirement 5: Propagate fecha changes to pending acciones on "Cambiar Fecha Siguiente Acción"

When using the "Cambiar Fecha Siguiente Acción" button in the Search Tareas page, if the tarea has any acciones with estado = "Pendiente", all pending acciones with the minimum `fecha_accion` should be updated to the new fecha. This ensures the tarea's `fecha_siguiente_accion` remains consistent with the minimum `fecha_accion` among its pending acciones.

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
