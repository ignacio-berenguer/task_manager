# Agent Architecture: Portfolio AI Agent Chat

## 1. Overview

An embedded conversational AI assistant that answers questions about Portfolio Digital data. The agent uses the Anthropic API with tool use to query the existing FastAPI backend endpoints via HTTP (same pattern as the MCP server), providing intelligent, context-aware responses streamed to the frontend via SSE.

**Key Design Principle:** The agent's tool execution layer is an async HTTP client of the same REST API that the MCP server uses. Zero business logic duplication — both the MCP server and the agent are HTTP clients of the same API.

## 2. Architecture Flow

```
┌───────────────────┐     SSE POST /agent/chat     ┌───────────────────────┐
│   Frontend        │ ──────────────────────────► │   Backend               │
│   (ChatPage)      │                              │   orchestrator.py       │
│                   │ ◄────────────────────────── │                         │
│   SSE stream      │     event: chunk/done/error  │   Agentic loop          │
└───────────────────┘                              └───────────┬─────────────┘
                                                               │
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   Anthropic API       │
                                                   │   (tool_use messages) │
                                                   └───────────┬───────────┘
                                                               │
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   tools_executor.py   │
                                                   │   (10 tool functions) │
                                                   └───────────┬───────────┘
                                                               │
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   api_client.py       │
                                                   │   (httpx.AsyncClient) │
                                                   └───────────┬───────────┘
                                                               │
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   FastAPI REST API    │
                                                   │   (localhost:8080)    │
                                                   └───────────┬───────────┘
                                                               │
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   SQLite database     │
                                                   │   (portfolio.db)      │
                                                   └───────────────────────┘
```

- **Clean separation of concerns**: The agent module is an API client, not a direct DB consumer
- **All business logic in the API**: Calculated fields, search, validation handled by the backend
- **Self-contained module**: Only touchpoints outside `agent/` are router registration in `main.py` and config additions to `config.py`
- **Async throughout**: FastAPI async endpoints + httpx.AsyncClient + Anthropic async SDK

## 3. Module Structure

```
backend/app/agent/
├── __init__.py              # Module exports
├── config.py                # Agent-specific settings re-exported from main config
├── table_metadata.py        # TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, URL prefixes
├── api_client.py            # AgentAPIClient (httpx.AsyncClient) — adapted from MCP server
├── tools_definition.py      # 10 tool schemas in Anthropic API format
├── tools_executor.py        # Tool execution — calls api_client methods + chart generation
├── system_prompt.py         # Comprehensive system prompt text (Spanish, incl. visualization guidelines)
└── orchestrator.py          # Agentic loop + SSE streaming

backend/app/charts/              # Chart rendering module (matplotlib-based)
├── __init__.py              # Module exports
├── renderer.py              # ChartRenderer — generates bar, pie, line, stacked bar charts as PNG
├── themes.py                # Color palettes, Spanish locale formatting
└── utils.py                 # Data preparation, category truncation, legend formatting

backend/app/routers/
├── agent.py                 # POST /agent/chat endpoint
└── charts.py                # GET /charts/{filename} — serves generated chart images
```

### Module Responsibilities

| File | Responsibility |
|------|---------------|
| `config.py` | Re-exports `ANTHROPIC_API_KEY`, `AGENT_MODEL`, `AGENT_MAX_TOKENS`, etc. from main `Settings` |
| `table_metadata.py` | Copied from MCP server — table descriptions, search capabilities, URL prefix mapping |
| `api_client.py` | Async HTTP client wrapping `httpx.AsyncClient` with `search()`, `list_records()`, `get_portfolio()`, `get_portfolio_records()` |
| `tools_definition.py` | 10 tool schemas as list of dicts (`name`, `description`, `input_schema`) in Anthropic API format |
| `tools_executor.py` | `async execute_tool(name, input, client) -> str` — routes tool calls to appropriate logic, including chart generation via `charts/` module |
| `system_prompt.py` | Spanish-language system prompt: role, data model, field explanations, tool guidance, visualization suggestion guideline, response format |
| `orchestrator.py` | Agentic loop: Anthropic API calls, tool execution rounds, SSE event generation |
| `routers/agent.py` | Single `POST /agent/chat` endpoint returning `StreamingResponse` with SSE |

## 4. Tool Catalog (10 tools)

All tool names, descriptions, and parameter help are in Spanish (matching MCP server).

### Search Tools
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `buscar_iniciativas` | POST /datos-relevantes/search | Search datos_relevantes with flexible filters, sorting, pagination |
| `buscar_en_tabla` | POST /{table}/search or GET /{table} | Search any table (10 with filters, rest with pagination only) |

### Detail Tools
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `obtener_iniciativa` | GET /portfolio/{pid} | Get all data across all tables for one initiative |
| `obtener_documentos` | POST /documentos/search + GET /documentos/portfolio/{pid} | Get/search document AI summaries |

### Aggregation Tools
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `contar_iniciativas` | POST /datos-relevantes/search -> client-side GROUP BY | Count initiatives by any dimension |
| `totalizar_importes` | POST /datos-relevantes/search -> client-side SUM | Sum importe fields by any dimension |

### Schema Tools
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `listar_tablas` | GET /{table}?limit=1 (each) | List all tables with descriptions and row counts |
| `describir_tabla` | GET /{table}?limit=1 | Get column names and metadata for a table |
| `obtener_valores_campo` | POST/GET -> extract distinct | Get distinct values for a field |

### Visualization Tools
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `generar_grafico` | Local rendering via `charts/` module | Generates a chart (bar, pie, line, stacked_bar) from provided data, saves PNG to `CHART_OUTPUT_DIR`, returns markdown image reference |

### Aggregation Strategy

For `contar_iniciativas` and `totalizar_importes`, the agent fetches all matching `datos_relevantes` rows (up to 1000, covering all ~853 initiatives) and aggregates client-side using Python's `collections.Counter` and `defaultdict`. This mirrors the MCP server's approach and is efficient because `datos_relevantes` has one row per initiative.

## 5. SSE Streaming Protocol

The backend streams responses to the frontend using Server-Sent Events (SSE). Five event types are defined:

### Event Types

| Event | Data Format | When Emitted |
|-------|-------------|-------------|
| `chunk` | `{"content": "partial text..."}` | Real-time text delta from Anthropic streaming API |
| `clear_streaming` | `{}` | After reasoning text, before tool execution (tells frontend to clear streaming bubble) |
| `tool_call` | `{"tool", "input_summary", "input_raw", "thinking", "result_summary", "duration_ms", "iteration"}` | After each tool execution completes |
| `done` | `{"status": "completed"}` | After the final response is fully streamed |
| `error` | `{"message": "error description"}` | On any error (API, tool, timeout) |

### Wire Format — Tool Use Round

```
event: chunk
data: {"content": "Voy a consultar los valores del campo..."}

event: clear_streaming
data: {}

event: tool_call
data: {"tool": "obtener_valores_campo", "input_summary": "datos_relevantes.estado_de_la_iniciativa", "input_raw": {...}, "thinking": "Voy a consultar los valores del campo...", "result_summary": "15 valores distintos", "duration_ms": 120, "iteration": 1}
```

### Wire Format — Final Response

```
event: chunk
data: {"content": "Según los datos"}

event: chunk
data: {"content": " del portfolio, hay 832 iniciativas..."}

event: done
data: {"status": "completed"}
```

### Key Decisions

- **All Anthropic API calls use streaming** — text deltas arrive in real-time via `client.messages.stream()`.
- During tool-use rounds, reasoning text streams to the user, then `clear_streaming` transitions to the tool execution panel.
- The final answer also streams token-by-token for progressive display.
- Tool call details (parameters, duration, result summary) are sent as `tool_call` events and displayed in an expandable accordion in the frontend.
- Each tool call has an implicit timeout via `httpx.AsyncClient` (30s default).

## 6. Orchestrator Algorithm

```
1. Validate ANTHROPIC_API_KEY is configured (503 if missing)
2. Create Anthropic async client + AgentAPIClient
3. Build messages array: system prompt + conversation history from request
4. Loop (max AGENT_MAX_TOOL_ROUNDS iterations):
   a. Stream Anthropic API response via client.messages.stream()
      - Yield text deltas as "chunk" SSE events in real-time
      - Collect full response via stream.get_final_message()
   b. If response has stop_reason == "end_turn" (no tool_use):
      - Final answer was already streamed → send "done" event
      - Break
   c. If response contains tool_use blocks:
      - Send "clear_streaming" event (reasoning text transitions to tool panel)
      - For each tool_use block:
        - Execute tool via tools_executor
        - Send "tool_call" event with tool name, parameters, thinking, result, duration
      - Append assistant message (with tool_use blocks) to messages
      - Append tool_result messages to messages
      - Continue loop
   d. If max iterations reached:
      - Return SSE error: "Se alcanzó el límite de iteraciones"
5. Send SSE "done" event
```

## 7. API Endpoint

### POST /api/v1/agent/chat

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "¿Cuántas iniciativas hay en ejecución?"},
    {"role": "assistant", "content": "Según los datos..."},
    {"role": "user", "content": "¿Y por unidad?"}
  ]
}
```

**Response:** `StreamingResponse` with `media_type="text/event-stream"` and headers `Cache-Control: no-cache`, `X-Accel-Buffering: no`.

**Error responses:**
- 503 if `ANTHROPIC_API_KEY` is not configured
- SSE error events for runtime errors (API failures, tool errors, timeouts)

## 8. Configuration

New variables added to `backend/app/config.py` via pydantic-settings `BaseSettings`, read from `backend/.env`:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ANTHROPIC_API_KEY` | `str` | `""` | Anthropic API key (required for agent) |
| `AGENT_MODEL` | `str` | `claude-sonnet-4-20250514` | Model ID for agent responses |
| `AGENT_MAX_TOKENS` | `int` | `4096` | Max tokens per Anthropic API response |
| `AGENT_TEMPERATURE` | `float` | `0.3` | Temperature for response generation |
| `AGENT_MAX_TOOL_ROUNDS` | `int` | `10` | Max tool-use iterations (safety limit) |
| `AGENT_API_BASE_URL` | `str` | `http://localhost:8080/api/v1` | Backend API URL for self-calls |
| `CHART_DPI` | `int` | `150` | Chart image resolution (dots per inch) |
| `CHART_DEFAULT_WIDTH` | `int` | `10` | Default chart width in inches |
| `CHART_DEFAULT_HEIGHT` | `int` | `6` | Default chart height in inches |
| `CHART_MAX_CATEGORIES` | `int` | `15` | Max categories before grouping into "Otros" |
| `CHART_LOCALE` | `str` | `es_ES` | Locale for number formatting in charts |
| `CHART_OUTPUT_DIR` | `str` | `charts_output` | Directory for generated chart images |
| `CHART_MAX_AGE_HOURS` | `int` | `24` | Auto-cleanup age threshold for chart files |

## 9. API Client (`api_client.py`)

Async adaptation of `mcp_server/src/mcp_portfolio/api_client.py`:

| Aspect | MCP Server | Agent |
|--------|-----------|-------|
| HTTP library | `httpx.Client` (sync) | `httpx.AsyncClient` (async) |
| Lifecycle | Created at startup, lives for server lifetime | Created per-request or shared via app lifespan |
| Error handling | Returns `APIError` exception | Returns `APIError` exception (same pattern) |

**Class: `AgentAPIClient`** — Methods (all `async`):
- `search(table, filters, order_by, order_dir, limit, offset)` -> POST /search
- `list_records(table, limit, offset)` -> GET /{table}
- `get_portfolio(portfolio_id)` -> GET /portfolio/{pid}
- `get_portfolio_records(table, portfolio_id)` -> GET /{table}/portfolio/{pid}
- `close()`

## 10. Security & Constraints

1. **Read-only:** Agent tools only query data — no POST/PUT/DELETE to mutation endpoints
2. **API key protection:** `ANTHROPIC_API_KEY` stays server-side; frontend never sees it
3. **Max iterations:** `AGENT_MAX_TOOL_ROUNDS` (default 10) prevents runaway loops
4. **HTTP timeout:** Tool calls inherit `httpx.AsyncClient` timeout (30s)
5. **CORS:** Agent endpoint uses the same CORS policy as all other endpoints
6. **No authentication for v1:** Agent endpoint does not require Clerk JWT (can be added later)
7. **Conversation persistence via Context:** Chat history is stored in a `ChatProvider` React Context mounted above the router (in `Providers.jsx`), so conversations survive page navigation. State resets on hard refresh (F5) which is acceptable.
8. **Input validation:** Messages must have valid `role` (user/assistant) and non-empty `content`
9. **Table whitelist:** Only approved tables queryable via tools
10. **Row limits:** Max 500 rows per tool call (same as MCP server)

## 11. Frontend — Chat Feature

### Route

| Route | Access | Page | Description |
|-------|--------|------|-------------|
| `/chat` | Private | ChatPage | Conversational AI assistant for portfolio data |

### File Structure

```
frontend/src/features/chat/
├── ChatContext.jsx            # ChatProvider context (messages, streaming, toolSteps, thinkingParts)
├── ChatPage.jsx              # Main page component (Layout + useChatContext + flex layout)
├── components/
│   ├── MessageList.jsx       # Scrollable message container with auto-scroll
│   ├── MessageBubble.jsx     # Single message + ThinkingAccordion + ToolStepsAccordion
│   ├── ChatInput.jsx         # Textarea + Send button (Enter to send, Shift+Enter newline)
│   └── MarkdownRenderer.jsx  # react-markdown + remark-gfm + portfolio_id linkification + chart image rendering
└── hooks/
    └── useChat.js            # Re-export of useChatContext for backward compatibility
```

### SSE Consumption (ChatContext)

Uses `fetch()` with `ReadableStream` reader (not `EventSource`, which only supports GET).

State managed in `ChatProvider` context: `messages`, `isLoading`, `streamingContent`, `toolSteps`, `thinkingParts`.

SSE event handling:
- `chunk`: Accumulates text into `streamingContent` for real-time display
- `clear_streaming`: Captures accumulated text into `thinkingParts` array, then resets `streamingContent`
- `tool_call`: Adds step to `toolSteps` (shown as live tool activity panel during loading)
- `done`: Finalizes assistant message with collected `toolSteps` and `thinking` attached
- `error`: Appends error text to streaming content

After response completes, the finalized message includes:
- `toolSteps` — displayed in an expandable "Proceso de respuesta" accordion
- `thinking` — displayed in a collapsible "Razonamiento del asistente" accordion (amber-themed, above tool steps)

### Clickable portfolio_id Links

`MarkdownRenderer.jsx` includes a `linkifyPortfolioIds()` utility that scans text children for portfolio_id patterns (`/\b[A-Z]{2,5}_\d{2}_\d{2,4}\b/g`) and replaces them with React Router `<Link>` components pointing to `/detail/{id}`. Applied to `td`, `li`, `p`, and `strong` elements. Code blocks are excluded.

### Inline Chart Images (Feature 066)

`MarkdownRenderer.jsx` includes a custom `img` component that renders chart images inline in chat messages. When the agent generates a chart via `generar_grafico`, it returns a markdown image reference (`![title](/api/v1/charts/filename.png)`). The `img` component resolves relative chart URLs against the backend origin (`VITE_API_BASE_URL`) and renders them with responsive styling (max-width, rounded corners, border).

### Assumptions Transparency

The system prompt (directive #9) instructs the model to append a "**Supuestos aplicados:**" section at the end of data analysis responses, listing: year used for amounts, Cancelado exclusion, implicit filters, pagination limits, and other relevant assumptions.

### Navbar Integration

`MessageSquare` icon from lucide-react, placed after "Busqueda" in `directNavItems`.

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-markdown` | `^9.0.0` | Markdown rendering for assistant messages |
| `remark-gfm` | `^4.0.0` | GitHub Flavored Markdown (tables, strikethrough) |

## 12. Shared Metadata

The following metadata is shared between the agent module and the MCP server:
- `TABLA_DESCRIPCIONES` — 26 tables with Spanish descriptions
- `TABLAS_CON_BUSQUEDA` — 10 tables supporting POST /search with flexible filters
- `_TABLA_URL_PREFIX_OVERRIDES` — URL prefix mappings (underscore to hyphenated)
- `get_url_prefix(tabla)` — Maps table names to API URL prefixes

For v1, this metadata is **copied** into `backend/app/agent/table_metadata.py`. Both modules live in the same repo, and the data changes rarely (only when tables are added/removed).

## 13. Error Handling

### Backend
- Missing API key -> HTTP 503 with clear error message
- Anthropic API errors -> SSE error event with user-friendly message
- Tool execution errors -> Returned as `{"error": "..."}` to the LLM (it can explain the error to the user)
- Max iterations reached -> SSE message explaining the limit
- httpx timeouts -> Caught and returned as tool error

### Frontend
- Network errors -> Error message in chat ("No se pudo conectar con el servidor")
- SSE parse errors -> Graceful degradation, show partial content
- Empty responses -> "No se recibio respuesta del asistente"
