# Feature 063 — Portfolio AI Agent Chat: Implementation Plan

## Phase 1: Backend — Agent Module Foundation

### Step 1.1: Add Dependencies
- Add `anthropic>=0.40.0` and `httpx>=0.27.0` to `backend/pyproject.toml`
- Run `uv sync` to install

### Step 1.2: Add Agent Configuration
- Add new env vars to `backend/app/config.py` (`Settings` class):
  - `ANTHROPIC_API_KEY`, `AGENT_MODEL`, `AGENT_MAX_TOKENS`, `AGENT_TEMPERATURE`, `AGENT_MAX_TOOL_ROUNDS`, `AGENT_API_BASE_URL`
- Update `backend/.env.example` with the new variables
- Create `backend/app/agent/__init__.py`
- Create `backend/app/agent/config.py` — re-exports agent settings from main config for convenience

### Step 1.3: Create Table Metadata
- Create `backend/app/agent/table_metadata.py`
- Copy `TABLA_DESCRIPCIONES`, `TABLAS_CON_BUSQUEDA`, `_TABLA_URL_PREFIX_OVERRIDES`, and `get_url_prefix()` from `mcp_server/src/mcp_portfolio/table_metadata.py`

### Step 1.4: Create Async API Client
- Create `backend/app/agent/api_client.py`
- Adapt `mcp_server/src/mcp_portfolio/api_client.py` to use `httpx.AsyncClient` instead of `httpx.Client`
- Same methods: `search()`, `list_records()`, `get_portfolio()`, `get_portfolio_records()`, `close()`
- Same error handling pattern (`APIError` exception)
- Base URL from `AGENT_API_BASE_URL` setting

### Step 1.5: Create Tool Definitions
- Create `backend/app/agent/tools_definition.py`
- Define 9 tool schemas in Anthropic API format (list of dicts with `name`, `description`, `input_schema`)
- Tool names and parameters match MCP server tools exactly
- Descriptions should be comprehensive (the LLM uses them to decide which tool to call)

### Step 1.6: Create Tool Executor
- Create `backend/app/agent/tools_executor.py`
- Implement `async execute_tool(tool_name: str, tool_input: dict, api_client: AgentAPIClient) -> str`
- Adapt logic from MCP server's 4 tool modules:
  - `busqueda.py` → `buscar_iniciativas`, `buscar_en_tabla`
  - `detalle.py` → `obtener_iniciativa`, `obtener_documentos`
  - `agregacion.py` → `contar_iniciativas`, `totalizar_importes` (with client-side aggregation)
  - `esquema.py` → `listar_tablas`, `describir_tabla`, `obtener_valores_campo`
- All functions return JSON strings (same format as MCP server)
- Wrap errors as `{"error": "message"}` — never raise to LLM

### Step 1.7: Create System Prompt
- Create `backend/app/agent/system_prompt.py`
- Write comprehensive system prompt covering:
  - Role definition (expert assistant, Spanish energy company IT portfolio)
  - Data model overview (datos_relevantes as main view, key tables, portfolio_id linkage)
  - Key field explanations (estado, unidad, importes, framework, etc.)
  - Tool usage guidance (when to use each tool, filter operators, common patterns)
  - Response guidelines (Spanish, markdown tables, currency formatting, concise)
  - Table metadata (all 28 tables with descriptions, search-capable tables)

### Step 1.8: Create Orchestrator
- Create `backend/app/agent/orchestrator.py`
- Implement the agentic loop:
  1. Validate API key
  2. Create Anthropic client
  3. Build messages (system + conversation history)
  4. Loop: call API → if tool_use → execute tools → append results → repeat
  5. Stream final text response as SSE events
  6. Safety limit: max `AGENT_MAX_TOOL_ROUNDS` iterations
- SSE event format: `event: chunk\ndata: {"content": "..."}\n\n`
- Final event: `event: done\ndata: {"status": "completed"}\n\n`
- Error event: `event: error\ndata: {"message": "..."}\n\n`

### Step 1.9: Create Router
- Create `backend/app/routers/agent.py`
- Single endpoint: `POST /agent/chat`
- Request schema: `AgentChatRequest` with `messages: list[dict]`
- Response: `StreamingResponse` with `media_type="text/event-stream"`
- Return 503 if API key not configured
- Register in `backend/app/main.py`
- Register in `backend/app/routers/__init__.py`

### Step 1.10: Backend Smoke Test
- Start backend with `uv run uvicorn app.main:app --reload --port 8000`
- Test with curl:
  ```bash
  curl -N -X POST http://localhost:8000/api/v1/agent/chat \
    -H "Content-Type: application/json" \
    -d '{"messages": [{"role": "user", "content": "¿Cuántas iniciativas hay?"}]}'
  ```
- Verify SSE events are received and tool calls work

---

## Phase 2: Frontend — Chat Page

### Step 2.1: Add Dependencies
- `npm install react-markdown remark-gfm`

### Step 2.2: Create useChat Hook
- Create `frontend/src/features/chat/hooks/useChat.js`
- Implement state: `messages`, `isLoading`, `streamingContent`
- Implement `sendMessage(content)`:
  - Add user message to state
  - POST to `/agent/chat` with full conversation history
  - Read SSE stream via `fetch()` + `ReadableStream` reader
  - Parse SSE events, accumulate text chunks
  - On "done": finalize assistant message in state
  - On "error": show error message in chat
- Implement `clearChat()` to reset state

### Step 2.3: Create MarkdownRenderer Component
- Create `frontend/src/features/chat/components/MarkdownRenderer.jsx`
- Use `react-markdown` with `remark-gfm` plugin
- Style tables with Tailwind (bordered, striped)
- Style code blocks
- Links open in new tab
- No raw HTML passthrough

### Step 2.4: Create MessageBubble Component
- Create `frontend/src/features/chat/components/MessageBubble.jsx`
- User messages: right-aligned, primary color background, plain text
- Assistant messages: left-aligned, neutral background, rendered via `MarkdownRenderer`
- Distinct visual styling for user vs. assistant

### Step 2.5: Create MessageList Component
- Create `frontend/src/features/chat/components/MessageList.jsx`
- Scrollable container
- Auto-scroll to bottom on new messages (useEffect + ref)
- Renders `MessageBubble` for each message
- Shows streaming bubble when loading with partial content
- Empty state: welcome message suggesting example questions

### Step 2.6: Create ChatInput Component
- Create `frontend/src/features/chat/components/ChatInput.jsx`
- Multi-line textarea with auto-grow (up to ~4 lines)
- Send button with `Send` icon from lucide-react
- Enter to send, Shift+Enter for newline
- Disabled while loading
- Placeholder: "Pregunta sobre el portfolio..."
- Auto-focus on mount

### Step 2.7: Create ChatPage
- Create `frontend/src/features/chat/ChatPage.jsx`
- Named export: `ChatPage`
- Uses `Layout` wrapper, `usePageTitle('Asistente IA')`
- Header with title + "Nueva conversación" button (with `RotateCcw` or `Plus` icon)
- Full-height flex layout: MessageList fills space, ChatInput at bottom
- Integrates `useChat` hook

### Step 2.8: Register Route
- In `App.jsx`: add lazy import and route
  ```jsx
  const ChatPage = lazy(() => import('@/features/chat/ChatPage').then(m => ({ default: m.ChatPage })))
  ```
- Add `<Route path="/chat" ...>` inside protected routes section

### Step 2.9: Add Navbar Entry
- In `Navbar.jsx`:
  - Import `MessageSquare` from lucide-react
  - Add `{ name: 'Asistente IA', href: '/chat', icon: MessageSquare }` to `directNavItems` after "Búsqueda"
  - Verify it appears in both desktop and mobile menus

### Step 2.10: Frontend Smoke Test
- Start frontend with `npm run dev`
- Navigate to `/chat`
- Send a message, verify SSE streaming works
- Test "Nueva conversación" button
- Test dark/light theme
- Test mobile responsiveness

---

## Phase 3: Polish & Documentation

### Step 3.1: Build Check
- Run `npm run build` in frontend to verify production build works
- Verify no TypeScript/lint errors

### Step 3.2: Update Architecture Documentation
- Create `specs/architecture/architecture_agent.md` — new document describing:
  - Agent architecture overview and flow diagram
  - Module structure (`backend/app/agent/`)
  - Tool catalog (9 tools with descriptions)
  - SSE streaming protocol
  - Configuration variables
  - Security constraints
- Update `specs/architecture/architecture_backend.md`:
  - Add agent router to endpoint list
  - Add agent module to directory structure
  - Add new dependencies
- Update `specs/architecture/architecture_frontend.md`:
  - Add `/chat` route to routes table
  - Add chat feature to features section
  - Add new dependencies

### Step 3.3: Update README.md
- Add Agent section to the project overview
- Add chat page to the frontend routes table
- Document the new environment variables
- Add the `anthropic` and `httpx` dependencies

### Step 3.4: Version & Changelog
- Increment `APP_VERSION.minor` to `63` in `frontend/src/lib/version.js`
- Add changelog entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`:
  - version: '0.063'
  - feature: 63
  - title: 'Asistente IA del Portfolio'
  - summary: 'Chat conversacional con IA que responde preguntas sobre datos del portfolio usando herramientas de consulta.'

---

## Implementation Notes

- **Phase 1 can be tested independently** using curl/httpie before the frontend is built
- **Phase 2 depends on Phase 1** being functional (the chat page needs the backend endpoint)
- **Phase 3 is documentation** — should be done last after everything works
- All backend code is **async** (FastAPI async endpoints + httpx.AsyncClient + Anthropic async SDK)
- The agent module is **self-contained** in `backend/app/agent/` — the only external touchpoints are the router registration in `main.py` and the config additions to `config.py`

## Files Created/Modified Summary

### New Files (Backend — 8 files)
- `backend/app/agent/__init__.py`
- `backend/app/agent/config.py`
- `backend/app/agent/table_metadata.py`
- `backend/app/agent/api_client.py`
- `backend/app/agent/tools_definition.py`
- `backend/app/agent/tools_executor.py`
- `backend/app/agent/system_prompt.py`
- `backend/app/agent/orchestrator.py`
- `backend/app/routers/agent.py`

### New Files (Frontend — 7 files)
- `frontend/src/features/chat/ChatPage.jsx`
- `frontend/src/features/chat/components/MessageList.jsx`
- `frontend/src/features/chat/components/MessageBubble.jsx`
- `frontend/src/features/chat/components/ChatInput.jsx`
- `frontend/src/features/chat/components/MarkdownRenderer.jsx`
- `frontend/src/features/chat/hooks/useChat.js`

### New Files (Documentation — 1 file)
- `specs/architecture/architecture_agent.md`

### Modified Files (Backend — 4 files)
- `backend/pyproject.toml` — add anthropic, httpx dependencies
- `backend/app/config.py` — add agent env vars to Settings
- `backend/app/main.py` — register agent router
- `backend/app/routers/__init__.py` — export agent router

### Modified Files (Frontend — 4 files)
- `frontend/package.json` — add react-markdown, remark-gfm (via npm install)
- `frontend/src/App.jsx` — add lazy import + route
- `frontend/src/components/layout/Navbar.jsx` — add Asistente IA nav entry

### Modified Files (Documentation — 3 files)
- `specs/architecture/architecture_backend.md` — add agent section
- `specs/architecture/architecture_frontend.md` — add chat page section
- `README.md` — add agent documentation

### Modified Files (Version — 2 files)
- `frontend/src/lib/version.js` — bump to 0.063
- `frontend/src/lib/changelog.js` — add feature 063 entry
