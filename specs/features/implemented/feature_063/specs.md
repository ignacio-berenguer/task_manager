# Feature 063 — Portfolio AI Agent Chat: Technical Specifications

## 1. Overview

An embedded conversational AI assistant that answers questions about Portfolio Digital data. The agent uses the Anthropic API with tool use to query the existing FastAPI backend endpoints via HTTP (same pattern as the MCP server), providing intelligent, context-aware responses. The UI is a chat panel integrated into the frontend as a new `/chat` route.

**Architecture Flow:**
```
Frontend (ChatPage) → SSE POST /agent/chat → Backend (orchestrator.py)
                                                  ↓
                                            Anthropic API (tool_use)
                                                  ↓
                                            tools_executor.py
                                                  ↓
                                            api_client.py (httpx async)
                                                  ↓
                                            FastAPI REST API (localhost:8000)
                                                  ↓
                                            SQLite database
```

**Key Design Principle:** The agent's tool execution layer is an async HTTP client of the same REST API that the MCP server uses. Zero business logic duplication — both the MCP server and the agent are HTTP clients of the same API.

---

## 2. Backend — Agent Module (`backend/app/agent/`)

### 2.1 Module Structure

```
backend/app/agent/
├── __init__.py              # Module exports
├── config.py                # Agent-specific settings (model, max_tokens, etc.)
├── system_prompt.py         # Comprehensive system prompt text
├── api_client.py            # Async HTTP client (httpx.AsyncClient) — adapted from MCP server
├── tools_definition.py      # 9 tool schemas in Anthropic API format
├── tools_executor.py        # Tool execution — calls api_client methods
└── orchestrator.py          # Agentic loop + SSE streaming
```

### 2.2 Configuration (`config.py`)

New settings added to the existing `backend/app/config.py` (via pydantic-settings `BaseSettings`):

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ANTHROPIC_API_KEY` | `str` | `""` | Anthropic API key (required for agent) |
| `AGENT_MODEL` | `str` | `claude-sonnet-4-20250514` | Model ID |
| `AGENT_MAX_TOKENS` | `int` | `4096` | Max tokens per response |
| `AGENT_TEMPERATURE` | `float` | `0.3` | Temperature |
| `AGENT_MAX_TOOL_ROUNDS` | `int` | `10` | Max tool-use iterations (safety) |
| `AGENT_API_BASE_URL` | `str` | `http://localhost:8000/api/v1` | Backend API URL for self-calls |

The agent-specific config will be read from the same `backend/.env` file via the existing `Settings` class. A separate `agent/config.py` will re-export the relevant settings for convenience within the agent module.

### 2.3 API Client (`api_client.py`)

Async adaptation of `mcp_server/src/mcp_portfolio/api_client.py`. Key differences:

| Aspect | MCP Server | Agent |
|--------|-----------|-------|
| HTTP library | `httpx.Client` (sync) | `httpx.AsyncClient` (async) |
| Lifecycle | Created at startup, lives for server lifetime | Created per-request or shared via app lifespan |
| Error handling | Returns `APIError` exception | Returns `APIError` exception (same pattern) |

**Class: `AgentAPIClient`**

Methods (all `async`):
- `async search(table, filters, order_by, order_dir, limit, offset) -> dict`
- `async list_records(table, limit, offset) -> dict`
- `async get_portfolio(portfolio_id) -> dict`
- `async get_portfolio_records(table, portfolio_id) -> list`
- `async close()`

Uses the same URL prefix mapping from MCP server's `table_metadata.py` — this metadata will be copied into `agent/table_metadata.py` (or imported if we extract to a shared location; for v1, copy is acceptable since both modules live in the same repo).

### 2.4 Tool Definitions (`tools_definition.py`)

9 tools defined as Anthropic API tool schemas (JSON Schema format). Each tool definition includes:
- `name`: Spanish tool name (matching MCP server)
- `description`: Comprehensive Spanish description with usage guidance
- `input_schema`: JSON Schema with properties, required fields, and descriptions

**Tools:**

| # | Tool Name | Purpose | Key Parameters |
|---|-----------|---------|----------------|
| 1 | `buscar_iniciativas` | Search datos_relevantes | filtros, orden_campo, orden_direccion, limite, desplazamiento |
| 2 | `buscar_en_tabla` | Search any table | tabla, filtros, orden_campo, orden_direccion, limite, desplazamiento |
| 3 | `obtener_iniciativa` | Get all data for a portfolio_id | portfolio_id |
| 4 | `obtener_documentos` | Search/list documents | portfolio_id, texto_busqueda, estado, limite |
| 5 | `contar_iniciativas` | Count by grouping field | campo_agrupacion, filtros |
| 6 | `totalizar_importes` | Sum amounts by grouping | campo_importe, campo_agrupacion, filtros |
| 7 | `listar_tablas` | List all tables | (none) |
| 8 | `describir_tabla` | Describe table schema | tabla |
| 9 | `obtener_valores_campo` | Get distinct field values | tabla, campo, limite |

### 2.5 Tool Executor (`tools_executor.py`)

Maps tool names to execution functions. Each function:
1. Receives parsed tool input (dict from Anthropic API)
2. Calls `AgentAPIClient` methods
3. Performs client-side logic (e.g., aggregation for `contar_iniciativas`, `totalizar_importes`)
4. Returns JSON string result (same format as MCP server tools)

**Key business logic replicated from MCP server:**
- `contar_iniciativas`: Client-side GROUP BY using `Counter` — fetches up to 1000 rows, groups in Python
- `totalizar_importes`: Client-side SUM using `defaultdict` — fetches up to 1000 rows, sums in Python
- `obtener_documentos`: Merges `documentos_items` into documents by `nombre_fichero` when fetching by portfolio_id
- `buscar_en_tabla`: Routes to `search()` or `list_records()` based on whether the table supports flexible search
- `listar_tablas`: Returns table list with descriptions and record counts
- `obtener_valores_campo`: Extracts distinct values from fetched records

All error handling follows the MCP pattern: return `{"error": "message"}` JSON strings, never raise exceptions to the LLM.

### 2.6 Orchestrator (`orchestrator.py`)

The agentic loop that mediates between the frontend and the Anthropic API.

**Input:** POST request body with `messages` (list of `{role, content}` dicts).

**Algorithm:**
```
1. Validate ANTHROPIC_API_KEY is configured
2. Create Anthropic client + AgentAPIClient
3. Build messages array: system prompt + conversation history
4. Loop (max AGENT_MAX_TOOL_ROUNDS iterations):
   a. Stream Anthropic API response via client.messages.stream()
      - Yield text deltas as "chunk" SSE events in real-time
      - Collect full response via stream.get_final_message()
   b. If response has stop_reason == "end_turn" (no tool_use):
      - Final answer was already streamed → send "done" event
      - Break
   c. If response contains tool_use blocks:
      - Send "clear_streaming" event
      - Execute each tool via tools_executor
      - Send "tool_call" event with details (tool, params, thinking, result, duration)
      - Append assistant message (with tool_use blocks) to messages
      - Append tool_result messages to messages
      - Continue loop
   d. If max iterations reached:
      - Return error message: "Se alcanzó el límite de iteraciones"
5. Send SSE "done" event
```

**SSE Event Format:**
```
event: chunk              — real-time text delta from streaming API
data: {"content": "partial text..."}

event: clear_streaming    — reasoning done, transitioning to tool execution
data: {}

event: tool_call          — tool execution completed
data: {"tool": "...", "input_summary": "...", "input_raw": {...}, "thinking": "...", "result_summary": "...", "duration_ms": 120, "iteration": 1}

event: done
data: {"status": "completed"}

event: error
data: {"message": "error description"}
```

**Key decisions:**
- **All Anthropic API calls use streaming** via `client.messages.stream()` — text deltas arrive in real-time for both reasoning and final answer.
- During tool-use rounds, reasoning text streams token-by-token, then `clear_streaming` transitions to the tool execution panel. Tool call details (parameters, duration, result) are sent as `tool_call` events.
- The final answer also streams token-by-token for progressive display.
- Frontend displays tool steps in a live panel during processing, and as an expandable "Proceso de respuesta" accordion after response completes (two levels: summary per tool, expandable detail with full JSON parameters).
- Each tool call has an implicit timeout via the `httpx.AsyncClient` timeout (30s default).

### 2.7 Router (`routers/agent.py`)

Single endpoint:

```
POST /api/v1/agent/chat
Content-Type: application/json
Response: text/event-stream (SSE)

Body:
{
  "messages": [
    {"role": "user", "content": "¿Cuántas iniciativas hay en ejecución?"},
    {"role": "assistant", "content": "Según los datos..."},
    {"role": "user", "content": "¿Y por unidad?"}
  ]
}
```

**Request Schema:**
```python
class AgentChatRequest(BaseModel):
    messages: list[dict]  # [{role: "user"|"assistant", content: str}]
```

**Response:** `StreamingResponse` with `media_type="text/event-stream"` and headers `Cache-Control: no-cache`, `X-Accel-Buffering: no` (same pattern as `routers/trabajos.py`).

**Error responses:**
- 503 if `ANTHROPIC_API_KEY` is not configured
- SSE error events for runtime errors (API failures, tool errors)

**Registration in `main.py`:**
```python
from .routers import agent as agent_router
app.include_router(agent_router.router, prefix=settings.API_PREFIX)
```

---

## 3. System Prompt (`system_prompt.py`)

Comprehensive prompt stored as a Python string constant. Content includes:

### 3.1 Role Definition
- Expert assistant for Portfolio Digital, a portfolio management system for IT initiatives at a large Spanish energy company
- Read-only access to the data; cannot create, update, or delete records

### 3.2 Data Model Overview
- `datos_relevantes` as the primary consolidated view (60+ calculated fields per initiative)
- Key tables: `iniciativas`, `datos_descriptivos`, `informacion_economica`, `hechos`, `etiquetas`, `acciones`, `ltp`, `beneficios`, `documentos`, `notas`, `fichas`
- All tables linked by `portfolio_id` (TEXT, e.g., "SPA_25_001")

### 3.3 Key Field Explanations
- `estado_de_la_iniciativa` values and their meaning (workflow states)
- `unidad` — organizational unit
- Importe fields: `importe_2024`, `importe_2025`, `budget_2025`, etc.
- `digital_framework_level_1` / `level_2` — classification framework
- `tipo` — initiative type
- `cluster` — grouping cluster

### 3.4 Tool Usage Guidance
- When to use each tool and common query patterns
- Available filter operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `is_null`, `is_not_null`
- Tables that support flexible search vs. list-only tables (from `table_metadata.py`)

### 3.5 Response Guidelines
- Answer in Spanish
- Format numbers as currency where appropriate (€ symbol, thousand separators)
- Use markdown tables for multi-row results
- Keep responses concise but complete
- When showing initiative lists, include portfolio_id, nombre, and relevant fields
- Link portfolio_ids for user reference

### 3.6 Table Metadata
- Full list of 28 tables with descriptions (from `TABLA_DESCRIPCIONES`)
- Which tables support search (from `TABLAS_CON_BUSQUEDA`)

---

## 4. Frontend — Chat Feature (`features/chat/`)

### 4.1 File Structure

```
frontend/src/features/chat/
├── ChatPage.jsx              # Main page component
├── components/
│   ├── MessageList.jsx       # Scrollable message container
│   ├── MessageBubble.jsx     # Single message (user or assistant)
│   ├── ChatInput.jsx         # Text input + send button
│   └── MarkdownRenderer.jsx  # Markdown rendering for assistant messages
└── hooks/
    └── useChat.js            # Chat state management + SSE streaming
```

### 4.2 Route Registration

In `App.jsx`:
```jsx
const ChatPage = lazy(() => import('@/features/chat/ChatPage').then(m => ({ default: m.ChatPage })))

// Inside protected routes:
<Route path="/chat" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
```

### 4.3 ChatPage Component

- Full-height layout: message list fills available space, input pinned to bottom
- Uses `Layout` wrapper (Navbar, Footer)
- `usePageTitle('Asistente IA')` for browser tab
- "Nueva conversación" button in the header area to clear chat history
- State managed by `useChat` custom hook

### 4.4 useChat Hook

```javascript
function useChat() {
  const [messages, setMessages] = useState([])       // Conversation history
  const [isLoading, setIsLoading] = useState(false)   // Agent is processing
  const [streamingContent, setStreamingContent] = useState('')  // Partial response

  async function sendMessage(content) {
    // 1. Add user message to state
    // 2. POST to /agent/chat with full message history
    // 3. Read SSE stream, accumulate chunks into streamingContent
    // 4. On "done" event, move streamingContent into messages array
    // 5. On "error" event, show error in messages
  }

  function clearChat() {
    setMessages([])
  }

  return { messages, isLoading, streamingContent, sendMessage, clearChat }
}
```

**SSE consumption:** Uses `fetch()` with `ReadableStream` reader (not EventSource, since we need POST). Parse SSE events from the stream manually:
```javascript
const response = await fetch(`${API_BASE_URL}/agent/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: conversationHistory })
})
const reader = response.body.getReader()
// Read chunks, parse "event: chunk\ndata: {...}\n\n" format
```

Note: No Clerk JWT injection needed for v1 (agent endpoint is unauthenticated), but the fetch call should still go through the same base URL.

### 4.5 MessageList Component

- Scrollable container with auto-scroll to bottom on new messages
- Renders `MessageBubble` for each message in the conversation
- Shows a streaming bubble when `isLoading` is true with `streamingContent`

### 4.6 MessageBubble Component

- **User messages:** Right-aligned, themed background (e.g., primary color), plain text
- **Assistant messages:** Left-aligned, neutral background, rendered as Markdown
- Timestamp optional for v1

### 4.7 ChatInput Component

- Multi-line textarea (auto-grows up to ~4 lines)
- Send button (with Send icon from lucide-react)
- Enter to send, Shift+Enter for newline
- Disabled while `isLoading`
- Placeholder: "Pregunta sobre el portfolio..."

### 4.8 MarkdownRenderer Component

Use `react-markdown` (new dependency) with:
- Table rendering styled with Tailwind
- Code block styling
- Link handling (open in new tab)
- No HTML passthrough (security)

### 4.9 Navbar Integration

Add to `directNavItems` array in `Navbar.jsx`:
```javascript
{ name: 'Asistente IA', href: '/chat', icon: MessageSquare }
```

Using `MessageSquare` icon from lucide-react. Placed after "Búsqueda" in the nav order.

### 4.10 Styling

- Full-height chat: `h-[calc(100vh-<navbar+footer>)]` or flex layout
- Dark/light theme support using existing Tailwind theme tokens
- Message bubbles with rounded corners, appropriate spacing
- Typing indicator (three dots animation or similar) while streaming
- Responsive: works on mobile (full-width) and desktop

---

## 5. Dependencies

### 5.1 Backend (add to `backend/pyproject.toml`)

| Package | Version | Purpose |
|---------|---------|---------|
| `anthropic` | `>=0.40.0` | Anthropic Python SDK (tool use, streaming) |
| `httpx` | `>=0.27.0` | Async HTTP client for agent tool calls |

### 5.2 Frontend (add to `frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react-markdown` | `^9.0.0` | Markdown rendering for assistant messages |
| `remark-gfm` | `^4.0.0` | GitHub Flavored Markdown (tables, strikethrough) |

### 5.3 Vite Config

Add `react-markdown` to a new vendor chunk if needed, or let it be part of the lazy-loaded chat chunk (preferred for v1 since only the chat page uses it).

---

## 6. Security & Constraints

- **Read-only:** Agent tools only query data — no POST/PUT/DELETE to mutation endpoints
- **API key protection:** `ANTHROPIC_API_KEY` stays server-side; frontend never sees it
- **Max iterations:** `AGENT_MAX_TOOL_ROUNDS` (default 10) prevents runaway loops
- **HTTP timeout:** Tool calls inherit `httpx.AsyncClient` timeout (30s)
- **CORS:** Agent endpoint is behind the same CORS policy as other endpoints
- **No authentication for v1:** Agent endpoint does not require Clerk JWT. Can be added in a future feature.
- **No conversation persistence:** Chat history lives only in React state — cleared on page reload
- **Input validation:** Messages must have valid `role` (user/assistant) and non-empty `content`

---

## 7. Error Handling

### Backend
- Missing API key → HTTP 503 with clear error message
- Anthropic API errors → SSE error event with user-friendly message
- Tool execution errors → Returned as `{"error": "..."}` to the LLM (it can explain the error to the user)
- Max iterations → SSE message explaining the limit was reached
- httpx timeouts → Caught and returned as tool error

### Frontend
- Network errors → Error message in chat ("No se pudo conectar con el servidor")
- SSE parse errors → Graceful degradation, show partial content
- Empty responses → "No se recibió respuesta del asistente"

---

## 8. Shared Metadata

The following metadata is shared between the agent module and the MCP server:
- `TABLA_DESCRIPCIONES` — Table names and descriptions
- `TABLAS_CON_BUSQUEDA` — Tables supporting flexible search
- `_TABLA_URL_PREFIX_OVERRIDES` — URL prefix mappings

For v1, this metadata is **copied** into `backend/app/agent/table_metadata.py`. Both modules live in the same repo, and the data changes rarely (only when tables are added/removed). A future feature could extract to a shared package if divergence becomes an issue.
