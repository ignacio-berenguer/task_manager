# Requirements Prompt for feature_044

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_044/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_044/plan.md' in order to do that.

## Feature Brief

LLM summarization of documentos. The feature adds a new command to the management module that:

1. **Scan pending documents**: Query the `documentos` table for rows where `estado_proceso_documento = "Pendiente"`.
2. **Read documents**: Read each document from its `ruta_documento` path.
3. **LLM summarization**: Use Claude (Anthropic API) to summarize each document using a standard prompt, outputting the summary in a predefined JSON format. The JSON format should be different for each tipo_documento. Language will be Spanish
4. **Store results**: Save the JSON summary into the `resumen_documento` field, set `estado_proceso_documento = "Completado"`, and update the timestamp fields of the record.
5. **Excel export**: Export the complete `documentos` table to an Excel file, with path/workbook/worksheet/table configured in `.env`, mapping table fields to Excel fields (following the same pattern as the `datos_relevantes` export).
6. **Configuration**: All LLM API keys, model settings, and Excel export paths are configured via `.env`.

## User Story

As a portfolio manager, I want to automatically summarize pending documents using an LLM so that I can quickly review document contents without reading each one in full, and have the results exported to Excel for reporting.

## Key Requirements

### Requirement 1: New CLI Command — `summarize_documentos`

Add a new command to `management/main.py` that orchestrates the full summarization pipeline:

- Query `documentos` table for records with `estado_proceso_documento = "Pendiente"`
- For each pending document, read the file from `ruta_documento`
- Send the document content to the Claude API with a standard summarization prompt
- Parse the LLM response into a predefined JSON structure
- Update the `documentos` row: set `resumen_documento` (JSON), `estado_proceso_documento = "Completado"`, and update timestamps
- Export the full `documentos` table to Excel

### Requirement 2: LLM Integration

- Use the Anthropic Python SDK (`anthropic`) to call the Claude API
- API key configured via `.env` (`ANTHROPIC_API_KEY`)
- Model name configurable via `.env` (e.g., `LLM_MODEL=claude-sonnet-4-5-20250929`)
- Standard summarization prompt defined in code (or configurable)
- Output must conform to a predefined JSON schema (fields TBD — e.g., `summary`, `key_points`, `category`, etc.). The JSON schema will be different for ech type of document
- Language will be Spanish
- Handle errors gracefully: if a document cannot be read or the LLM fails, log the error and set `estado_proceso_documento = "Error"` with details
- In order to avoid contamination of model context, for each document you should start a fresh conversation with the LLM
- The integration with other LLM (i.e. Gemeni, Copilot, ChatGPT) should be easy to do

### Requirement 3: Document Reading

- Read documents from the path stored in `ruta_documento`
- Support common document formats: PDF, DOCX, TXT (at minimum)
- Configured to skip some tipo_documento (i.e. "Approval Form") that will be marked as estado_proceso_documento = "Ignorado"
- Handle missing or unreadable files gracefully with appropriate error logging

### Requirement 4: Database Updates

- Update `resumen_documento` with the JSON summary output
- Set `estado_proceso_documento = "Completado"` on success, `"Error"` on failure, `"Ignorado"` on skipped documents
- Update relevant timestamp fields (e.g., `fecha_proceso_documento`)
- All updates go through the existing database connection pattern

### Requirement 5: Excel Export

- Export the complete `documentos` table to an Excel file
- Excel path, workbook name, worksheet name, and table name configured in `.env`
- Field mapping from DB columns to Excel columns (similar to `datos_relevantes` export pattern)
- Follow the existing `excel_export.py` patterns

### Requirement 6: Configuration (.env)

New `.env` variables needed:

- `ANTHROPIC_API_KEY` — API key for Claude
- `LLM_MODEL` — Model identifier (default: `claude-sonnet-4-5-20250929`)
- `LLM_MAX_TOKENS` — Max tokens for summarization response
- `DOCUMENTOS_EXCEL_PATH` — Path to output Excel workbook
- `DOCUMENTOS_EXCEL_WORKSHEET` — Worksheet name
- `DOCUMENTOS_EXCEL_TABLE` — Table name in Excel
- Any other LLM-related configuration (temperature, etc.)

### General Requirements

- The architecture should follow the file specs/architecture/architecture_management.md
- Update the README.md document after all the changes are done
- Update the relevant architecture docs (specs/architecture/architecture_management.md) after all the changes are done
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The `documentos` table schema must already exist (or be created/extended as needed).
- Document file paths in `ruta_documento` must be accessible from the machine running the management CLI.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
