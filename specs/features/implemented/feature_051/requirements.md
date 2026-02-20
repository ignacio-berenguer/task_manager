# Requirements Prompt for feature_051

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_051/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_051/plan.md' in order to do that.

## Feature Brief

MCP Server. Create an MCP (Model Context Protocol) server that provides read-only access to all portfolio database information. The MCP server will serve as the foundation for RAG capabilities in a future chat LLM interface, enabling users to perform complex queries including counting and totalizing importe fields of initiatives. The server must also provide access to document summaries associated with initiatives. All tool descriptions must be in Spanish since the primary chat interface will be in Spanish. The MCP server is a new standalone module in the application, with all business logic managed through the existing API. Initially the MCP server will be used from Claude Desktop/Claude Code; in future iterations a custom chat interface will be added.

## User Story

As a portfolio manager, I want to interact with portfolio data through a conversational LLM interface so that I can perform complex queries, aggregations, and lookups on initiatives, their financial data, and associated documents without needing to navigate the web application.

## Key Requirements

### Requirement 1: New MCP Server Module

Create a new `mcp_server/` module at the project root level (alongside `management/`, `backend/`, `frontend/`). The MCP server should:
- Be a standalone Python module using the MCP protocol SDK
- Connect to the existing SQLite database in read-only mode
- Leverage the existing backend API business logic where possible
- Have its own `pyproject.toml` and dependency management via `uv`

### Requirement 2: Read-Only Database Access Tools

Provide MCP tools that allow querying all key tables in the database:
- iniciativas, datos_descriptivos, datos_relevantes, informacion_economica
- hechos, beneficios, etiquetas, justificaciones, ltp, wbes, dependencias
- notas, avance, acciones, descripciones, estado_especial, investment_memos
- facturacion, fichas, impacto_aatt
- **No write, update, or delete operations** — strictly read-only

### Requirement 3: Complex Query Support

The MCP tools must support:
- Flexible search/filtering on any field (similar to the existing search API)
- Counting initiatives by various dimensions (estado, framework, unidad, cluster, etc.)
- Totalizing/aggregating importe fields (budget, SM200, aprobado, facturado) by grouping dimensions
- Cross-table lookups (e.g., get all data for a portfolio_id)

### Requirement 4: Document Summaries Access

Provide tools to access document summaries from the `documentos` and `documentos_items` tables, including:
- List documents for a given portfolio_id
- Retrieve document summaries and metadata
- Search across document summaries

### Requirement 5: Spanish Tool Descriptions

All MCP tool names, descriptions, and parameter descriptions must be written in Spanish, since the primary chat interface will be in Spanish. This includes:
- Tool names (can use snake_case with Spanish words)
- Tool descriptions explaining what each tool does
- Parameter descriptions and help text

### Requirement 6: Configuration and Logging

- All configuration stored in a `.env` file (database path, log level, log file, API base URL if needed)
- Logging to a file configured in `.env` (default: `logs/portfolio_mcp.log`)
- Default log level: INFO, configurable via `.env`
- Important operations also logged to console

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The MCP server must NOT modify or delete any data — strictly read-only access.
- The MCP server should be a separate module, not embedded in the backend or frontend.
- Initially designed for Claude Desktop/Claude Code integration; future chat UI will be added in subsequent features.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
