# Requirements Prompt for feature_020

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_020/specs.md' and './specs/features/feature_020/plan.md' in order to do that.

## Feature Brief

Improvements to the U/I. (1) In the accordion of tareas in the results list of the Search page, show the acciones ordered by descending fecha. Remove the Notas display. (2) Make the red and the green of the tags a little lighter, now they are completely solid colors. (3) When editing a Tarea, the Estado should have a dropdown and only allow valid values. (4) The "x" close button of editing tarea modal does not work. (5) Allow the selection of many tareas in the Search page. (6) When at least one tarea are selected, allow the user to perform a "bulk edit" that can be (a) Changing the date of the tarea (input date), also any pending action would be set to the same date. (b) Completing any pending action of the tareas and creating a new action in a new date (input action description and date). (c) Exporting the selected tareas to the clipboard (same format as current button). (7) Add a button to the Detail page to mark a tarea as "Completado". The operation should also mark any accion in estado not completado to Completado.

## User Story

As a user, I want to perform common bulk operations on tasks directly from the search results, fix UI issues with editing modals and tag colors, and quickly mark tasks as complete from the detail page, so that I can manage my tasks more efficiently.

## Key Requirements

### Requirement 1: Acciones ordering & remove Notas in Search accordion

In the Search page results list, when expanding the accordion for a tarea, the acciones should be displayed ordered by `fecha_accion` descending (most recent first). The "Notas" section currently displayed in the accordion should be removed.

### Requirement 2: Lighter tag colors

The red and green colors used for status tags are currently fully solid. Make them lighter/softer (e.g., use lighter shades or pastel variants) so they are less visually aggressive while remaining clearly distinguishable.

### Requirement 3: Estado dropdown in Tarea edit modal

When editing a Tarea, the `estado` field should be rendered as a dropdown (select) populated with valid values from the `estados_tareas` parametric table, instead of a free-text input. Only valid estado values should be selectable.

### Requirement 4: Fix close button on edit Tarea modal

The "x" (close) button on the edit Tarea modal currently does not work. Fix it so that clicking the "x" properly closes the modal without saving changes.

### Requirement 5: Multi-select tareas in Search page

Allow the user to select multiple tareas in the Search page results list (e.g., via checkboxes). The selection state should be visible and manageable (select/deselect individual items).

### Requirement 6: Bulk operations on selected tareas

When at least one tarea is selected, provide a bulk operations toolbar/menu with the following actions:

- **(a) Change date**: Set a new `fecha_siguiente_accion` for all selected tareas. Additionally, any pending acciones (estado != Completado) of those tareas should also have their `fecha_accion` updated to the same date.
- **(b) Complete & create new action**: Complete any pending acciones of the selected tareas (set estado to "Completada") and create a new accion for each tarea with a user-provided action description and date.
- **(c) Export to clipboard**: Export the selected tareas to the clipboard in the same format as the existing export button.

### Requirement 7: "Mark as Completado" button on Detail page

Add a button on the Detail page to mark the current tarea as "Completado". This operation should:
- Set the tarea's `estado` to "Completado"
- Set the `estado` of all acciones that are not already "Completada"/"Completado" to "Completado"

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
