# Implementation Plan — Feature 066: Agent Chart Visualization (MCP + Chatbot)

## Phase 1: Dependencies and Configuration

### Step 1.1: Add matplotlib dependency to MCP server
- **File**: `mcp_server/pyproject.toml`
- **Action**: Add `"matplotlib>=3.8"` to the `dependencies` list
- **Verify**: Run `cd mcp_server && uv sync` to install

### Step 1.2: Add matplotlib dependency to backend
- **File**: `backend/pyproject.toml`
- **Action**: Add `"matplotlib>=3.8"` to the `dependencies` list
- **Verify**: Run `cd backend && uv sync` to install

### Step 1.3: Add chart configuration to MCP server
- **File**: `mcp_server/src/mcp_portfolio/config.py`
- **Action**: Add config variables with defaults:
  - `CHART_DPI = int(os.getenv("CHART_DPI", "150"))`
  - `CHART_DEFAULT_WIDTH = int(os.getenv("CHART_DEFAULT_WIDTH", "900"))`
  - `CHART_DEFAULT_HEIGHT = int(os.getenv("CHART_DEFAULT_HEIGHT", "600"))`
  - `CHART_MAX_CATEGORIES = int(os.getenv("CHART_MAX_CATEGORIES", "15"))`
  - `CHART_LOCALE = os.getenv("CHART_LOCALE", "es_ES")`

### Step 1.4: Add chart configuration to backend
- **File**: `backend/app/config.py`
- **Action**: Add to the Settings class:
  - `CHART_DPI: int = 150`
  - `CHART_DEFAULT_WIDTH: int = 900`
  - `CHART_DEFAULT_HEIGHT: int = 600`
  - `CHART_MAX_CATEGORIES: int = 15`
  - `CHART_LOCALE: str = "es_ES"`
  - `CHART_OUTPUT_DIR: str = "charts_output"`
  - `CHART_MAX_AGE_HOURS: int = 24`

### Step 1.5: Update .env.example files
- **File**: `mcp_server/.env.example` — Add chart config section
- **File**: `backend/.env.example` — Add chart config section (including output dir and max age)

## Phase 2: Chart Rendering Engine (MCP Server)

### Step 2.1: Create `charts/` module in MCP server
- **Files to create**:
  - `mcp_server/src/mcp_portfolio/charts/__init__.py`
  - `mcp_server/src/mcp_portfolio/charts/themes.py`
  - `mcp_server/src/mcp_portfolio/charts/utils.py`
  - `mcp_server/src/mcp_portfolio/charts/renderer.py`

### Step 2.2: Implement `charts/themes.py`
- Define `PORTFOLIO_COLORS` (8 primary colors matching frontend palette)
- Define `PORTFOLIO_COLORS_EXTENDED` (15 colors for large category sets)
- Define matplotlib style overrides (background, grid, font sizes, etc.)
- Define `apply_theme(fig, ax)` function to consistently style all charts

### Step 2.3: Implement `charts/utils.py`
- `format_currency(value)` → "1.234.567 €"
- `format_number(value)` → "1.234.567"
- `format_compact(value)` → "1,2 M€" or "534 k€"
- `truncate_label(text, max_len=25)` → truncate with ellipsis
- `group_small_categories(data, max_categories, other_label="Otros")`

### Step 2.4: Implement `charts/renderer.py`
- `ChartRenderer` class with `render(chart_type, title, data, options) -> bytes`
- Set `matplotlib.use('Agg')` at module level
- Implement `_render_bar()`, `_render_horizontal_bar()`, `_render_pie()`, `_render_line()`, `_render_stacked_bar()`
- Common logic: figure creation (`BytesIO` buffer), title/subtitle, theme application, PNG export, figure cleanup (`plt.close()`)
- Uses config values for DPI, width, height, max_categories

### Step 2.5: Implement `charts/__init__.py`
- Export `ChartRenderer` and `PORTFOLIO_COLORS`

## Phase 3: Chart Rendering Engine (Backend — duplicate)

### Step 3.1: Copy `charts/` module to backend
- **Files to create**:
  - `backend/app/charts/__init__.py`
  - `backend/app/charts/themes.py`
  - `backend/app/charts/utils.py`
  - `backend/app/charts/renderer.py`
- **Action**: Same code as MCP server charts module. The config import paths will differ (import from `backend/app/config.py` settings instead of `mcp_server` config).

## Phase 4: MCP Server Tool

### Step 4.1: Create `tools/visualizacion.py`
- Import `ChartRenderer`, `config`, `api_client`, `Image` from MCP SDK
- Implement `register(mcp, api_client)` function following existing tool pattern
- Define `generar_grafico` tool with full docstring in Spanish
- **Query mode**: Reuse `_fetch_all_datos_relevantes()` from `tools/agregacion.py`
  - Client-side aggregation: count (default) or sum `campo_valor`
  - Convert to `[{etiqueta, valor}]` format
- **Direct mode**: Validate `datos` structure
- Call `ChartRenderer.render()` → PNG bytes
- Return `Image(data=base64_png, format="png")` on success
- Return JSON error string on failure

### Step 4.2: Refactor shared aggregation helper
- **File**: `mcp_server/src/mcp_portfolio/tools/agregacion.py`
- **Action**: Make `_fetch_all_datos_relevantes()` importable (or create `tools/helpers.py`)

### Step 4.3: Register the new MCP tool
- **File**: `mcp_server/src/mcp_portfolio/tools/__init__.py`
- **Action**: Import and call `visualizacion.register(mcp, api_client)`

## Phase 5: Backend Chatbot Tool

### Step 5.1: Add tool schema to `tools_definition.py`
- **File**: `backend/app/agent/tools_definition.py`
- **Action**: Add `generar_grafico` tool definition to `AGENT_TOOLS` list with the same parameters as the MCP version, in Anthropic API tool schema format

### Step 5.2: Implement `_generar_grafico` in `tools_executor.py`
- **File**: `backend/app/agent/tools_executor.py`
- **Action**: Add `_generar_grafico` async function:
  1. Validate parameters (tipo_grafico, datos/campo_agrupacion)
  2. Query mode: reuse `_fetch_all_datos_relevantes()` (already exists in this file) + aggregate
  3. Direct mode: validate and use `datos` directly
  4. Render chart via `ChartRenderer` → PNG bytes
  5. Save to `CHART_OUTPUT_DIR/{uuid4}.png`
  6. Return JSON: `{"imagen_url": "/api/v1/charts/{uuid}.png", "descripcion": "..."}`
- **Action**: Add `"generar_grafico": _generar_grafico` to `_TOOL_MAP`

### Step 5.3: Update orchestrator summaries
- **File**: `backend/app/agent/orchestrator.py`
- **Action**: Add `generar_grafico` case to `_summarize_tool_input()`:
  ```python
  if tool_name == "generar_grafico":
      parts = [f"tipo: {tool_input.get('tipo_grafico', '?')}"]
      if tool_input.get("titulo"):
          parts.append(f'"{tool_input["titulo"]}"')
      return " | ".join(parts)
  ```
- **Action**: Add `imagen_url` detection to `_summarize_tool_result()`:
  ```python
  if "imagen_url" in data:
      parts.append("gráfico generado")
  ```

## Phase 6: Chart Image Serving (Backend)

### Step 6.1: Create charts router
- **File**: `backend/app/routers/charts.py` (NEW)
- **Action**: Implement `GET /charts/{filename}` endpoint:
  - Validate filename format (UUID + .png)
  - Read file from `CHART_OUTPUT_DIR`
  - Return `FileResponse` with `Content-Type: image/png`
  - Return 404 if file not found
  - Trigger cleanup of files older than `CHART_MAX_AGE_HOURS`

### Step 6.2: Register charts router in main.py
- **File**: `backend/app/main.py`
- **Action**: Import and include the charts router
- **Action**: Ensure `CHART_OUTPUT_DIR` is created on startup (in the lifespan or startup event)

## Phase 7: Frontend — Chat Image Display

### Step 7.1: Update MarkdownRenderer
- **File**: `frontend/src/features/chat/components/MarkdownRenderer.jsx`
- **Action**: Add `img` component to the `ReactMarkdown` components map:
  ```jsx
  img: ({ src, alt }) => (
    <img
      src={src?.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${src}` : src}
      alt={alt || 'Gráfico'}
      className="max-w-full rounded-lg border border-border my-2"
      loading="lazy"
    />
  ),
  ```
  This resolves relative chart URLs (`/api/v1/charts/uuid.png`) against the backend origin.

## Phase 8: System Prompt Enhancement

### Step 8.1: Update the agent system prompt
- **File**: `backend/app/agent/system_prompt.py`
- **Action**: Add `generar_grafico` to the "Uso de herramientas" section:
  - Tool description and usage guidance (query mode vs direct mode)
  - Explain that charts are rendered as images in the conversation
- **Action**: Add visualization suggestion guideline to "Directrices de respuesta" (item 10):
  - When aggregation results contain 3+ groups → suggest chart
  - Recommend appropriate chart type based on data nature
  - Include phrasing template: "¿Te gustaría ver estos datos en un gráfico de [tipo]?"
  - When user explicitly requests a chart → generate directly without asking

## Phase 9: Documentation and Verification

### Step 9.1: Verify dependencies install
- Run `cd mcp_server && uv sync` to confirm matplotlib installs
- Run `cd backend && uv sync` to confirm matplotlib installs

### Step 9.2: Manual testing — MCP Server
- Start backend: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- Start MCP server: `cd mcp_server && uv run -m mcp_portfolio`
- Test each chart type via Claude Desktop or Claude Code

### Step 9.3: Manual testing — Chatbot
- Start backend with `--reload`
- Open web app → chat panel
- Ask question that triggers aggregation (e.g., "¿Cuántas iniciativas hay por estado?")
- Verify agent suggests chart visualization
- Accept suggestion → verify chart renders inline in chat
- Test direct chart request (e.g., "Muéstrame un gráfico de barras del presupuesto por unidad")

### Step 9.4: Update documentation
- **File**: `README.md` — Add chart generation to MCP server and chatbot sections
- **File**: `specs/architecture/architecture_mcp_server.md` — Document chart module, new tool, config vars
- **File**: `specs/architecture/architecture_backend.md` — Document charts router, agent chart tool, config vars
- **File**: `specs/architecture/architecture_frontend.md` — Document MarkdownRenderer image support
- **File**: `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to 66
- **File**: `frontend/src/lib/changelog.js` — Add changelog entry for feature 066

## Summary of Files Changed

| File | Action | Description |
|------|--------|-------------|
| **MCP Server** | | |
| `mcp_server/pyproject.toml` | Edit | Add `matplotlib>=3.8` dependency |
| `mcp_server/src/mcp_portfolio/config.py` | Edit | Add chart config variables |
| `mcp_server/.env.example` | Edit | Add chart config section |
| `mcp_server/src/mcp_portfolio/charts/__init__.py` | **New** | Module exports |
| `mcp_server/src/mcp_portfolio/charts/themes.py` | **New** | Color palettes and styling |
| `mcp_server/src/mcp_portfolio/charts/utils.py` | **New** | Formatting and data helpers |
| `mcp_server/src/mcp_portfolio/charts/renderer.py` | **New** | Chart rendering engine |
| `mcp_server/src/mcp_portfolio/tools/visualizacion.py` | **New** | `generar_grafico` MCP tool |
| `mcp_server/src/mcp_portfolio/tools/agregacion.py` | Edit | Make helper importable |
| `mcp_server/src/mcp_portfolio/tools/__init__.py` | Edit | Register new tool |
| **Backend** | | |
| `backend/pyproject.toml` | Edit | Add `matplotlib>=3.8` dependency |
| `backend/app/config.py` | Edit | Add chart config variables |
| `backend/.env.example` | Edit | Add chart config section |
| `backend/app/charts/__init__.py` | **New** | Module exports |
| `backend/app/charts/themes.py` | **New** | Color palettes and styling |
| `backend/app/charts/utils.py` | **New** | Formatting and data helpers |
| `backend/app/charts/renderer.py` | **New** | Chart rendering engine |
| `backend/app/routers/charts.py` | **New** | Serve generated chart images |
| `backend/app/main.py` | Edit | Register charts router, create output dir |
| `backend/app/agent/tools_definition.py` | Edit | Add `generar_grafico` tool schema |
| `backend/app/agent/tools_executor.py` | Edit | Add `_generar_grafico` executor |
| `backend/app/agent/orchestrator.py` | Edit | Add chart tool summaries |
| `backend/app/agent/system_prompt.py` | Edit | Add chart guidance + suggestion rules |
| **Frontend** | | |
| `frontend/src/features/chat/components/MarkdownRenderer.jsx` | Edit | Add `img` component |
| **Documentation** | | |
| `README.md` | Edit | Document chart features |
| `specs/architecture/architecture_mcp_server.md` | Edit | Document chart module |
| `specs/architecture/architecture_backend.md` | Edit | Document charts router + agent tool |
| `specs/architecture/architecture_frontend.md` | Edit | Document image rendering in chat |
| `frontend/src/lib/version.js` | Edit | Version bump to 66 |
| `frontend/src/lib/changelog.js` | Edit | Changelog entry |

## Estimated Complexity

- **New code**: ~700-800 lines across charts modules (x2) + tools + router
- **Modified code**: ~80-100 lines across existing files
- **Risk**: Low — chart rendering is isolated; chatbot tool follows existing patterns
- **Key dependency**: `matplotlib` headless rendering on Windows (well-supported with Agg backend)
