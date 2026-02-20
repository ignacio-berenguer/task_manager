# Requirements Prompt for feature_063

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_063/specs.md' and './specs/features/feature_063/plan.md' in order to do that.

## Feature Brief

Portfolio AI Agent Chat. An embedded conversational AI assistant that answers questions about the portfolio digital data. The agent uses the Anthropic API with tool use to query the existing FastAPI backend endpoints (via HTTP, same pattern as the MCP server), providing intelligent, context-aware responses about initiatives, budgets, statuses, and all portfolio data. The UI is a chat panel integrated into the frontend. Estimated effort: 4-5 days.

## User Story

As a user of the Portfolio Digital application, I want an AI chat assistant that can answer questions about my portfolio data (e.g., "How many initiatives are in execution?", "What is the total budget for 2025 by unit?", "Show me the details of SPA_25_001") so that I can get quick insights without manually navigating reports and filters.

## Key Requirements

### Requirement 1: Backend — Agent Orchestration Endpoint

Create a new router `routers/agent.py` with a streaming chat endpoint. This endpoint:

- Receives a conversation history (list of `{role, content}` messages) via POST.
- Calls the Anthropic API (`claude-sonnet-4-20250514`) using the `anthropic` Python SDK with **tool use** (function calling).
- Defines tools that mirror the 9 MCP server tools (buscar_iniciativas, buscar_en_tabla, obtener_iniciativa, obtener_documentos, contar_iniciativas, totalizar_importes, listar_tablas, describir_tabla, obtener_valores_campo).
- **Critical architectural decision — HTTP client pattern (same as MCP server):** The agent tools should call the FastAPI backend endpoints via HTTP to `localhost:8000`, following the exact same pattern as the MCP server's `PortfolioAPIClient`. This means:
  - The tool executor uses `httpx` (async) to call the REST API endpoints.
  - The tool logic (filters, aggregation, field mapping) is identical to the MCP server — ideally copy/adapt from `mcp_server/src/mcp_portfolio/api_client.py` and `mcp_server/src/mcp_portfolio/tools/`.
  - This ensures **zero duplication of business logic**: both the MCP server and the agent are HTTP clients of the same API. If the API changes, both stay in sync automatically.
  - The "self-call" to localhost is not a circular dependency — it's a standard HTTP call with ~1ms overhead. FastAPI handles async concurrency without issues.
- Implements an agentic loop: send message → if Claude responds with tool_use → execute tool → send tool_result back → repeat until Claude returns a final text response.
- Streams the final text response back to the frontend using Server-Sent Events (SSE), following the same `StreamingResponse` pattern used in `routers/trabajos.py`.
- Includes a comprehensive system prompt (stored in a separate file, e.g., `agent/system_prompt.py` or `agent/system_prompt.txt`) that teaches the agent about:
  - The portfolio domain (what initiatives are, what fields mean, what the statuses represent, etc.)
  - The database schema and available tables (referencing `table_metadata.py` content from the MCP server)
  - How to use each tool effectively
  - Response formatting guidelines (answer in Spanish, use markdown tables for tabular data, be concise)
- The `ANTHROPIC_API_KEY` should be read from the backend `.env` (it's already configured in the management module, but the backend needs its own reference).

### Requirement 2: Backend — Agent Configuration

Add the following environment variables to the backend `.env`:

| Variable                | Default                        | Description                                                   |
| ----------------------- | ------------------------------ | ------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | _(required)_                   | Anthropic API key for the agent                               |
| `AGENT_MODEL`           | `claude-sonnet-4-20250514`     | Model to use for the agent                                    |
| `AGENT_MAX_TOKENS`      | `4096`                         | Max tokens per agent response                                 |
| `AGENT_TEMPERATURE`     | `0.3`                          | Agent temperature                                             |
| `AGENT_MAX_TOOL_ROUNDS` | `10`                           | Max tool-use iterations per request (safety limit)            |
| `AGENT_API_BASE_URL`    | `http://localhost:8000/api/v1` | Backend API URL for agent tool calls (self-call to localhost) |

### Requirement 3: Frontend — Chat Page

Create a new protected route `/chat` with a dedicated `ChatPage` component under `features/chat/`. The page should include:

- A full-height chat interface (similar to standard AI chat UIs).
- A message list showing user messages and assistant responses. Assistant responses should render Markdown (use a lightweight markdown renderer like `react-markdown` or similar).
- An input area at the bottom with a text field and send button. Support sending on Enter (Shift+Enter for newline).
- A "thinking" / streaming indicator while the agent is processing (show SSE chunks as they arrive for the final response).
- Conversation is maintained in React state (no persistence across page reloads — keep it simple for v1).
- A "New conversation" button to clear the chat history.
- The chat should send the full conversation history to the backend on each message.
- Style consistent with the rest of the application (Tailwind CSS, dark/light theme support, same typography).

### Requirement 4: Frontend — Navbar Integration

Add a "Chat" or "Asistente IA" entry to the Navbar for quick access to the chat page. Use an appropriate icon (e.g., MessageSquare from lucide-react). The entry should be visible to authenticated users only (protected route).

### Requirement 5: Agent System Prompt — Domain Knowledge

The system prompt should be comprehensive and include:

1. **Role definition**: "You are an expert assistant for the Portfolio Digital application, a portfolio management system for IT initiatives at a large Spanish energy company."
2. **Data model overview**: Describe the key tables (datos_relevantes as the main consolidated view with 60+ fields, iniciativas, datos_descriptivos, informacion_economica, hechos, etiquetas, acciones, etc.) and their relationships (all linked by portfolio_id).
3. **Key field explanations**: What `estado_de_la_iniciativa` values mean, what `unidad` represents, what the importe fields are (importe_2024, importe_2025, budget_2025, etc.), what `digital_framework_level_1/2` represents.
4. **Tool usage guidance**: When to use each tool, how to construct filters, common query patterns.
5. **Response guidelines**: Answer in Spanish, format numbers as currency where appropriate, use markdown tables for multi-row results, keep responses concise but complete.
6. **Available filter operators and table metadata** (reuse from MCP server's `table_metadata.py`).

### Requirement 6: Agent Tools — HTTP Client Implementation

Create an `agent/` subpackage inside `backend/app/` with the following structure:

```
backend/app/agent/
├── __init__.py
├── config.py              # Agent-specific settings (model, max_tokens, API URL, etc.)
├── system_prompt.py       # System prompt text
├── api_client.py          # HTTP client (async httpx) — adapted from MCP server's PortfolioAPIClient
├── tools_definition.py    # Tool schemas for Anthropic API (JSON schema format)
├── tools_executor.py      # Tool execution — calls api_client methods, same logic as MCP tools
└── orchestrator.py        # Agentic loop (message → tool_use → tool_result → repeat)
```

**Key design principle — single source of truth via HTTP:**

The `api_client.py` should be an async version of the MCP server's `PortfolioAPIClient` (`mcp_server/src/mcp_portfolio/api_client.py`), using `httpx.AsyncClient` instead of `httpx.Client`. It calls the same API endpoints (`POST /search`, `GET /portfolio/{pid}`, etc.) that the MCP server uses.

The `tools_executor.py` should replicate the same tool logic from `mcp_server/src/mcp_portfolio/tools/` (busqueda.py, detalle.py, agregacion.py, esquema.py) — including client-side aggregation for `contar_iniciativas` and `totalizar_importes`.

This ensures:

- The agent and MCP server always have identical capabilities and behavior.
- Adding a tool to the MCP server means adding the same tool to the agent (and vice versa), but the underlying API logic is never duplicated.
- If the API evolves (new endpoints, changed fields), both clients benefit immediately.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md.
- Add a new architecture document `specs/architecture/architecture_agent.md` describing the agent architecture, including a diagram showing the relationship: Frontend → Agent Endpoint → Anthropic API (with tool_use) → Agent Tools → FastAPI API (HTTP localhost) → SQLite.
- The agent's `api_client.py` and tool logic should be adapted from the MCP server code (`mcp_server/src/mcp_portfolio/`). Reference the MCP server as the canonical implementation for tool behavior.
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (architecture_backend.md, architecture_frontend.md) after all the changes are done.
- Update the MCP server architecture doc if any shared metadata is refactored.
- Update `frontend/src/lib/version.js` and `frontend/src/lib/changelog.js` as per the release process.

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The agent is **read-only** — it should only query data, never create, update, or delete records.
- The agent endpoint does NOT require Clerk authentication for v1 (simplify initial implementation), but should be behind the same CORS policy. Authentication can be added in a future feature.
- The Anthropic API key must never be exposed to the frontend. All API calls go through the backend.
- The agent should gracefully handle errors (API failures, tool execution errors) and communicate them to the user in a friendly way.
- Tool execution should have a timeout and the agentic loop should have a max iteration limit to prevent runaway costs.
- New backend dependencies required: `anthropic` (Python SDK) and `httpx` (async HTTP client for tool calls). Add both to `backend/pyproject.toml`.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
