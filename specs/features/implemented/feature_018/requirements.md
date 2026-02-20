# Requirements Prompt for feature_018

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_018/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_018/plan.md' in order to to that.

## Feature Brief

The page for Informe Iniciativas Cambiadas should be Informe Hechos

## User Story

As a user, I want a more general way to search for Hechos, ltps and acciones.

## Key Requirements

### Requirement 1: Change name "Iniciativas Cambiadas en el Periodo" to "Hechos"

The name of the Informe that now is "Iniciativas Cambiadas" should be "Hechos".

Please change not only the frontend, but also the API endpoints should be changed, let's use the name report_hechos for the API.

### Requirement 2: Add some additional filters to the informe "Hechos"

In addition to the current filters, there should be a filter also on "Estado del Hecho" that filters on hechos.estado. The filter should behave as the other filters in the application.

Now that I think of it, please make a clear note on the architecture_frontend.md about the expected behavior of the filters in the application, so that the next filters in the screens will be implemented in a consistent way.

### Requirement 3: Add a report for "LTPs"

In a similar way to the Hechos report, I want you to create a report for LTPs, with filters for responsable and estado (in this case would be estado of ltp).

The columns should be customizable by the user, but the default columns should be: portfolio_id, nombre, tarea, siguiente_accion (this field is a date), comentarios, estado. Please consider comentarios and tarea can be long text. Default order by siguiente_accion ascending.

From the portfoltio_id should be possible to navigate to the detail page.

### Requirement 4: Add a report for "Acciones"

In a similar way to the Hechos report, I want you to create a report for acciones, with filters for siguiente_accion and estado (of the portfolio_id).

The columns should be customizable by the user, but the default columns should be: portfolio_id, nombre, siguiente_accion, siguiente_accion_comentarios, estado. Please consider siguiente_accion_comentarios can be long text. Default order by siguiente_accion ascending, then portfolio_id.

From the portfoltio_id should be possible to navigate to the detail page.

### Requirement 5: Add a report for "Etiquetas"

In a similar way to the Hechos report, I want you to create a report for etiquetas, with filters for portfolio_id, nombre, etiqueta.

The columns should be customizable by the user, but the default columns should be: portfolio_id, nombre, etiqueta, valor, origen_registro, comentario. Please consider etiqueta, valor, origen_registro, comentario can be long text. Default order by portfolio_id ascending, then etiqueta.

From the portfoltio_id should be possible to navigate to the detail page.

### Requirement 6: Add a report for "Transacciones"

In a similar way to the Hechos report, I want you to create a report for transacciones, with filters for portfolio_id, estado_cambio, fecha_registro_cambio, fecha_ejecucion_cambio, id.

The columns should be customizable by the user, but the default columns should beall columns in the table. Please consider all fields can be long text. Default order by id ascending, then etiqueta.

From the portfoltio_id should be possible to navigate to the detail page.

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
