# Requirements Prompt for feature_045

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_045/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_045/plan.md' in order to do that.

## Feature Brief

Optimize and enhance the `summarize_documentos` command with filtering, reprocessing, better logging, improved prompts, token tracking, error resilience, and data protection for the `documentos` table.

## User Story

As a portfolio manager, I want to selectively summarize specific documents, reprocess already-processed ones, track token costs, and ensure the expensive summarization results are never accidentally lost during routine database operations.

## Key Requirements

### Requirement 1: Optional portfolio_id filtering (`--portfolio-ids`)

Add an optional CLI parameter `--portfolio-ids` that accepts a comma-separated list of portfolio IDs. When provided, only documents matching those portfolio IDs are processed; all other records remain unchanged.

Example: `uv run python main.py summarize_documentos --portfolio-ids SPA_25_11,SPA_25_12`

### Requirement 2: Reprocess flag (`--reprocess`)

Add an optional CLI flag `--reprocess` that forces reprocessing of documents regardless of their `estado_proceso_documento` value. Without this flag, only `Pendiente` documents are processed (current behavior). With the flag, documents in `Completado`, `Error`, or `Ignorado` states are also reprocessed.

Example: `uv run python main.py summarize_documentos --reprocess`

Both flags can be combined: `--portfolio-ids SPA_25_11 --reprocess`

### Requirement 3: Change default LLM model to Claude Haiku

Update the default `LLM_MODEL` in `settings.py` and `.env.example` to use `claude-haiku-4-5-20251001` instead of `claude-sonnet-4-5-20250929` to optimize token costs. The model remains configurable via `.env`.

### Requirement 4: Improve DEBUG logging (suppress httpcore noise, add useful messages)

- Suppress noisy `httpcore` DEBUG messages (e.g., `send_request_headers`, `receive_response_body`, etc.) by setting `httpcore` and `httpx` loggers to WARNING level
- Add meaningful DEBUG messages:
  - Before LLM call: document content length, model being used
  - After LLM call: response length, token usage (input/output), stop reason
  - After DB update: which record was updated, new estado, summary length
  - Per-document timing: how long each document took to process

### Requirement 5: Review and improve prompts.py

Review the current user-modified `prompts.py` and suggest improvements:
- The SM100 and SM200 schemas have been customized with specific section references (Introduction, Description of Requirements, Project Description, Cost Estimation, etc.)
- Fields like `escrito_por`, `fecha_elaboracion`, `verificado_por` extract metadata from document cover pages
- Ensure the prompt instructions clearly guide the LLM to extract information from the specific document sections referenced
- Fix minor issues (e.g., unescaped quotes in JSON schema strings, extra blank lines)
- The prompt should capture detailed information from document sections into a fixed JSON schema

### Requirement 6: Update documentation

- Update `README.md` with all commands and options supported by the management module (including `--portfolio-ids`, `--reprocess`, `--db`, `--excel-dir`)
- Update `instructions.md` (root-level quick reference) to include `scan_documents` and `summarize_documentos` commands with their options
- Update architecture docs as needed

### Requirement 7: Error resilience — never stop the batch

Ensure the summarize process never stops on individual document errors. Every error must be:
- Caught and logged (ERROR level)
- Recorded in the `documentos` table (`estado_proceso_documento = 'Error'`, error details in `resumen_documento`)
- The batch continues processing remaining documents

This includes handling errors in: file reading, LLM API calls, JSON parsing, database updates.

### Requirement 8: Protect documentos table from accidental deletion

The `documentos` table contains expensive-to-produce LLM summaries. Ensure it is NOT emptied/dropped when running management commands other than `init` or `recreate_tables`:
- The `full_calculation_datos_relevantes` pipeline (recreate_tables → migrate → calculate → export) currently drops ALL tables including `documentos`. This must be changed so `documentos` data is preserved.
- Document this data protection policy in `CLAUDE.md`, `README.md`, and architecture docs
- Add a note in code comments where the protection is implemented

### Requirement 9: Track token consumption per document

The Anthropic API returns `usage.input_tokens` and `usage.output_tokens` in every response. Capture this data:
- Log token usage per document at INFO level: `"Tokens: input=XXXX, output=XXXX"`
- Add two new columns to the `documentos` table: `tokens_input INTEGER` and `tokens_output INTEGER`
- Store token counts when updating the document record after successful summarization
- Update `schema.sql` with the new columns
- Include a schema migration in the engine (similar to the CHECK constraint migration) to add columns to existing databases

### General Requirements

- The architecture should follow the file specs/architecture/architecture_management.md
- Update the README.md document after all the changes are done
- Update the relevant architecture docs (specs/architecture/architecture_management.md) after all the changes are done
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The `documentos` table data must never be lost during routine operations.
- Token tracking columns must be added via migration to avoid breaking existing databases.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
