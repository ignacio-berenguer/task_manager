# Requirements Prompt for feature_064

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_064/specs.md' and './specs/features/feature_064/plan.md' in order to do that.

## Feature Brief

Several improvements across the stack covering search UX, calculated fields, chatbot UI, tag customization, and system prompt enhancements:

1. **Search page free-text filter bug**: Column filters that should allow free-text input (e.g., portfolio_id, nombre) only allow typing 1 character before losing focus.
2. **New calculated field "Estado SM100"** in datos_relevantes: values "SM100 Disponible", "SM100 Pendiente", "Cancelada" — derived from estado_de_la_iniciativa.
3. **New calculated field "Estado SM200"** in datos_relevantes: values "SM200 Disponible", "SM200 Pendiente", "Cancelada" — derived from estado_de_la_iniciativa.
4. **New calculated field "Iniciativa Aprobada"** in datos_relevantes: values "Aprobada", "No aprobada", "Cancelada" — derived from estado_de_la_iniciativa.
5. **Expose new fields in Search & Detail**: All three new fields should be available as filters and columns in the Search page, and displayed in the "Datos Descriptivos" section of the Detail page.
6. **Chatbot UI redesign**: Improve aesthetics with a clean, minimalistic but attractive and futuristic user interface.
7. **Chatbot input history**: Pressing UP arrow in the chatbot input should recover the last command (command history navigation).
8. **Tag color customization**: Allow users to customize tag colors by editing the Parametricas table (or another master table for tags).
9. **System prompt: exclude Cancelado**: Modify the MCP system prompt so that iniciativas with estado_de_la_iniciativa = "Cancelado" are never considered in responses.
10. **System prompt: default to current year importes**: Modify the MCP system prompt so that, unless the user says otherwise, only Importe of the current year are considered.
11. **System prompt: include current date**: Modify the MCP system prompt so the system knows the current date.
12. **Excel export of new fields**: The new Estado SM100, Estado SM200, and Iniciativa Aprobada fields in datos_relevantes should also be exported to Excel.
13. **Parametros-based color customization**: Add a `color` column to the `parametros` table so that categorical values (estado_de_la_iniciativa, etc.) can have admin-customizable colors. Move currently hardcoded estado color mappings to the parametros table. The frontend should read color assignments from the API instead of using hardcoded maps.

## User Stories

- As a Search page user, I want to type free-text in column filters (portfolio_id, nombre, etc.) without losing focus after one character.
- As a portfolio analyst, I want to see "Estado SM100", "Estado SM200", and "Iniciativa Aprobada" fields in datos_relevantes so I can quickly filter and understand initiative status.
- As a Search page user, I want to filter and sort by the new status fields.
- As a Detail page user, I want to see the new status fields in the Datos Descriptivos section.
- As a chatbot user, I want a modern, clean, and visually appealing chatbot interface.
- As a chatbot user, I want to press UP to recall my previous command for faster interaction.
- As an administrator, I want to customize tag colors via a master table so tags are visually meaningful.
- As a chatbot user, I want the AI to automatically exclude cancelled initiatives and default to current year financials.
- As a data analyst, I want the new calculated fields exported to Excel so I can use them in external reports.
- As an administrator, I want to assign colors to estado values and other categorical parameters via the Parametricas management page, so the frontend reflects my color choices without code changes.

## Key Requirements

### Requirement 1: Fix Search Page Free-Text Filter Input

The column filters in the Search page that accept free-text (e.g., portfolio_id, nombre) currently only allow typing a single character before losing focus. This needs to be fixed so users can type complete filter values without interruption.

### Requirement 2: New Calculated Field — Estado SM100

Add a calculated field `estado_sm100` to the `datos_relevantes` table/API with the following logic based on `estado_de_la_iniciativa`:
- If estado indicates SM100 is available → "SM100 Disponible"
- If estado indicates SM100 is pending → "SM100 Pendiente"
- If estado is "Cancelado" → "Cancelada"

### Requirement 3: New Calculated Field — Estado SM200

Add a calculated field `estado_sm200` to the `datos_relevantes` table/API with the following logic based on `estado_de_la_iniciativa`:
- If estado indicates SM200 is available → "SM200 Disponible"
- If estado indicates SM200 is pending → "SM200 Pendiente"
- If estado is "Cancelado" → "Cancelada"

### Requirement 4: New Calculated Field — Iniciativa Aprobada

Add a calculated field `iniciativa_aprobada` to the `datos_relevantes` table/API with the following logic based on `estado_de_la_iniciativa`:
- If estado indicates the initiative is approved → "Aprobada"
- If estado indicates not approved → "No aprobada"
- If estado is "Cancelado" → "Cancelada"

### Requirement 5: Expose New Fields in Search & Detail

- Add the three new fields as available columns and filters in the Search page.
- Display the three new fields in the "Datos Descriptivos" accordion section of the Detail page.

### Requirement 6: Chatbot UI Redesign

Improve the chatbot's visual design to be clean, minimalistic, attractive, and futuristic. Specific design choices TBD during spec phase.

### Requirement 7: Chatbot Input History (UP Arrow)

Implement command history in the chatbot input field. Pressing the UP arrow key should cycle through previously entered commands (similar to terminal behavior).

### Requirement 8: Tag and Estado Color Customization via Parametros

Allow users to customize the colors of tags (etiquetas destacadas) and other categorical values (estado_de_la_iniciativa, etc.) via the `parametros` table:
- Add a `color` column to the `parametros` table to store color assignments for parameter values.
- Seed the parametros table with the currently hardcoded `estado_de_la_iniciativa` values and their default colors (from `estadoColors.js`).
- The frontend should read color assignments from the parametros API and use them when rendering estado tags and other color-coded values.
- The Parametricas management page should allow editing the color for each parameter value.
- Expand the color palette for `etiquetas_destacadas` as well (from 5 to 15 colors).

### Requirement 9: System Prompt — Exclude Cancelado

Modify the MCP server's system prompt to instruct the AI to never consider iniciativas where `estado_de_la_iniciativa = "Cancelado"` when answering queries.

### Requirement 10: System Prompt — Default Current Year Importes

Modify the MCP server's system prompt to instruct the AI that, unless the user specifies otherwise, only Importe values for the current year should be considered in calculations and responses.

### Requirement 11: System Prompt — Include Current Date

Modify the MCP server's system prompt to include the current date so the AI is aware of temporal context.

### Requirement 12: Excel Export of New Calculated Fields

The 3 new calculated fields (`estado_sm100`, `estado_sm200`, `iniciativa_aprobada`) must be included in the datos_relevantes Excel export. Add them to the `DATOS_RELEVANTES_COLUMN_MAPPING` in `management/src/export/excel_export.py`.

### Requirement 13: Parametros-Based Color Customization

Add a `color` column to the `parametros` table so that any parametric value can have an associated color. Seed `estado_de_la_iniciativa` values with their current default colors from `estadoColors.js`. The frontend should fetch colors from the API and use them for rendering, falling back to hardcoded defaults if no color is set. The Parametricas management page should support editing colors with a color picker/dropdown.

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
