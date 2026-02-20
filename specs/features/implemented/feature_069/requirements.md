# Requirements Prompt for feature_069

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_069/specs.md' and './specs/features/feature_069/plan.md' in order to do that.

## Feature Brief

Changes in datos_relevantes. (1) Change of calculation for iniciativa_cerrada_económicamente. The field iniciativa_cerrada_economicamente in datos_relevantes calculation should be as follows: if there is an Hecho with estado = "Cierre económico iniciativa" with partida_presupuestaria = YYYY, then the value of iniciativa_cerrada_economicamente = "Cerrado en año YYYY" else iniciativa_cerrada_economicamente = "No". Please review all the code (i.e. mcp_tool, agent, filter criteria in pages, API, etc.) to reflect the change of behaviour. (2) Add a field to datos_relevantes called activo_ejercicio_actual, the calculation would be as follows: if iniciativa_cerrada_economicamente <> "Cerrada\*" and there is any importe expected in current year then then activo_ejercicio_actual = "Si" else activo_ejercicio_actual = "No". This field should be added as a criteria and column that can be selected to the Search page, and as a field in the Datos Descriptivos section in the Detail page. Inform also about this new field to the MCP server and chat agent. This field should be exported to excel as column "Activo en el ejercicio actual".

## User Story

As a portfolio manager, I want the "iniciativa_cerrada_economicamente" field to show the specific year of economic closure (e.g., "Cerrado en año 2025") instead of a simple boolean, so I can understand when initiatives were economically closed. Additionally, I want a new "activo_ejercicio_actual" field that tells me whether an initiative is active in the current fiscal year, so I can quickly filter and identify initiatives that are still relevant.

## Key Requirements

### Requirement 1: Change calculation for iniciativa_cerrada_economicamente

- Current behavior: The field likely returns a simple "Si"/"No" or similar boolean-like value.
- New behavior: Query the `hechos` table for records where `estado = "Cierre económico iniciativa"`. If such a record exists for the initiative, extract `partida_presupuestaria` (which contains YYYY) and set the value to `"Cerrado en año YYYY"`. If no such record exists, set the value to `"No"`.
- This change affects:
  - **Management module**: `management/src/calculate/` — the datos_relevantes calculation engine
  - **Backend module**: `backend/app/calculated_fields/` — on-the-fly calculated fields
  - **Frontend module**: Any filter criteria, dropdowns, or display logic that currently treats this as a boolean "Si"/"No" field must be updated to handle the new string format (e.g., Search page filters, Detail page display, Dashboard filters if applicable)
  - **MCP server** and **AI Chat**: Tool descriptions and any metadata referencing this field
  - **API**: Search operators and filter options that reference this field

### Requirement 2: Add new field activo_ejercicio_actual

- New field `activo_ejercicio_actual` in datos_relevantes with the following logic:
  - If `iniciativa_cerrada_economicamente` does NOT start with "Cerrada" (i.e., is "No" or "Cerrado en año YYYY" where the pattern doesn't match "Cerrada\*") AND there is any importe expected in the current year, then `activo_ejercicio_actual = "Si"`
  - Otherwise, `activo_ejercicio_actual = "No"`
- Note: The requirement says `<> "Cerrada*"` — clarify whether this means "does not start with Cerrada" or "is not exactly Cerrada". Given the new format is "Cerrado en año YYYY" (masculine), the condition likely means: if the initiative is NOT economically closed (i.e., value is "No"), and has importes in current year, then active.
- This field must be added to:
  - **Management module**: datos_relevantes calculation
  - **Backend module**: calculated_fields definitions, search configuration
  - **Frontend Search page**: As a filter criterion and as a selectable column
  - **Frontend Detail page**: In the Datos Descriptivos accordion section
  - **MCP server** and **AI Chat**: Table metadata, tool descriptions
  - **Excel export**: Column name "Activo en el ejercicio actual"

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The change from boolean-like to year-based values for iniciativa_cerrada_economicamente must not break existing filters or UI components.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
