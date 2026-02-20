# Requirements Prompt for feature_046

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_046/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_046/plan.md' in order to do that.

## Feature Brief

Show results of LLM summarization in the frontend. Complete the display of the documentos table in the Detail page and Informe Documentos report page with two new action buttons per document row:
1. A "JSON" button that opens a modal displaying the `resumen_documento` field as colored, syntax-highlighted JSON (human-readable format).
2. A "Summary" button that opens a modal displaying the `resumen_documento` contents rendered as formatted HTML with a clean, readable structure (headings for keys, paragraphs for text values, bullet lists for arrays, etc.).

Both modals should include a link to the actual document in SharePoint (from `enlace_documento`), opening in Word Online in a separate browser tab. The link should be prominent and easy to find within the modal.

## User Story

As a portfolio manager, I want to view the LLM-generated document summaries directly in the web application — both as raw JSON for technical inspection and as a nicely formatted readable view — so I can quickly review what was extracted from each document without leaving the browser.

## Key Requirements

### Requirement 1: JSON Viewer Modal

Add a button (e.g., with a `{ }` or code icon) to each document row in the Detail page Documentos section and the Informe Documentos report page. When clicked, it opens a modal that:
- Displays the `resumen_documento` JSON with syntax highlighting and color coding (keys, strings, numbers, booleans in different colors)
- Uses a monospace font with proper indentation (2-space indent)
- Includes the document name (`nombre_fichero`) in the modal title/header
- Includes a clickable SharePoint link (from `enlace_documento`) that opens in a new tab
- Has a close button and can be dismissed by clicking outside or pressing Escape
- Shows a "No summary available" message if `resumen_documento` is null/empty

### Requirement 2: Formatted Summary Modal

Add a button (e.g., with a document/eye icon) to each document row in the Detail page Documentos section and the Informe Documentos report page. When clicked, it opens a modal that:
- Parses the `resumen_documento` JSON and renders it as structured HTML
- Displays JSON keys as section headings (translated from snake_case to human-readable labels, e.g., `titulo_documento` → "Titulo Documento", `puntos_clave` → "Puntos Clave")
- Renders string values as paragraphs
- Renders array values as bullet lists
- Skips empty fields (empty strings or empty arrays)
- Includes the document name in the modal title/header
- Includes a clickable SharePoint link (from `enlace_documento`) that opens in a new tab
- Has a close button and can be dismissed by clicking outside or pressing Escape
- Shows a "No summary available" message if `resumen_documento` is null/empty

### Requirement 3: Integration with Detail Page Documentos Section

The two new buttons should appear as action buttons in the existing Documentos accordion section on the Detail page, alongside any existing buttons. They should only be enabled/visible when the document has a `resumen_documento` value (estado_proceso_documento = 'Completado').

### Requirement 4: Integration with Informe Documentos Report Page

The two new buttons should also appear in the Documentos report page table rows, with the same behavior as in the Detail page.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- No backend changes should be needed — `resumen_documento` and `enlace_documento` are already returned by the existing API.
- The JSON and formatted views should work with all document types (SM100, SM200, default schemas) since the JSON keys vary per type.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
