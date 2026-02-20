# Requirements Prompt for feature_068

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_068/specs.md' and './specs/features/feature_068/plan.md' in order to do that.

## Feature Brief

Several Improvements:

1. **Chat Context Window Issue**: When using the chat, users frequently encounter an error stating the context window is exhausted. However, when pressing "Nueva Conversación", the context window is not cleared and the error persists.

2. **Search Page - Exclude Cancelled Initiatives Filter**: Add an on/off filter "Incluir Iniciativas Canceladas" to the Search page. By default it should be OFF (excluding cancelled initiatives). When filters are cleared, it should reset to OFF as well.

3. **Detail Page - Sticky Header Fields**: Move the following fields to the header section so they are always visible when scrolling through the initiative detail, and also show them in the InitiativeDrawer (quick view sidebar):
   - Estado de la iniciativa
   - Estado SM100
   - Estado SM200
   - Iniciativa aprobada

4. **Chart Tool Ordering**: The chart tool used by the chat/agent internally always orders chart bars by value descending. The desired behavior is that the chart/agent decides the order in the data that is sent, and the tool should preserve and use that selected order instead of re-sorting.

## User Story

As a user, I want the chat to properly reset when starting a new conversation, I want to easily filter out cancelled initiatives in search, I want to see key initiative status fields at all times in the detail view, and I want chart visualizations to respect the ordering I specify.

## Key Requirements

### Requirement 1: Fix Chat Context Window Reset

- When the user clicks "Nueva Conversación", the chat context window must be fully cleared
- Any existing context or conversation history should be discarded
- The error about exhausted context window should not persist after reset
- Investigate the current implementation to understand why the reset is not working

### Requirement 2: Search Page - Cancelled Initiatives Filter

- Add a checkbox filter labeled "Incluir Iniciativas Canceladas" to the Search page filters
- Default state: OFF (cancelled initiatives are excluded from results)
- When the user clicks "Limpiar Filtros" or equivalent, this filter should reset to OFF
- The filter should be persisted to localStorage like other search preferences
- The filter should send the appropriate query to the backend to exclude initiatives with estado_de_la_iniciativa in ("Cancelada", "Cancelado") - both values exist in the database
- When OFF (default), show "Excl. Canceladas: Sí" in filter chips to indicate exclusion is active
- When ON, no filter chip is shown (all initiatives included)

### Requirement 3: Detail Page - Sticky Header Status Fields

- Modify the Detail page header section to include:
  - Estado de la iniciativa
  - Estado SM100
  - Estado SM200
  - Iniciativa aprobada (Yes/No indicator)
- These fields should remain visible in the header when the user scrolls down through the accordion sections
- Style consistently with the existing header design
- Ensure responsive behavior on different screen sizes
- Estado de la iniciativa tag should use the same color as in other tables (from Parametros table)
- SM100/SM200 badge logic (values may include SM prefix like "SM100 Pendiente"):
  - Empty/null → "Sin SM100" / "Sin SM200" (red)
  - Contains "Cancelada" or "Cancelado" → "Cancelada" (red)
  - Contains "Pendiente" → "SM100 Pendiente" / "SM200 Pendiente" (amber)
  - Any other value (e.g., "Aprobado") → "Tiene SM100" / "Tiene SM200" (green)
- Iniciativa Aprobada: "Aprobada" (green) if "Sí", "No Aprobada" (red) otherwise

### Requirement 4: Chart Tool Preserve Data Order

- Modify the chart generation tool (generar_grafico) in the MCP server
- Remove or disable the automatic sorting by value descending
- The chart should render bars in the exact order provided in the input data
- This allows the AI agent to control the presentation order (alphabetical, by date, by custom logic, etc.)

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
