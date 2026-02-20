# Feature 066 — Agent Chart Visualization (MCP + Chatbot)

## Overview

Add a chart generation tool (`generar_grafico`) to both the **MCP server** and the **web chatbot** (backend agent) that enables AI agents to visualize portfolio data as bar, pie, line, and stacked-bar charts. Charts are generated as PNG images via `matplotlib`. The system prompt is enhanced with explicit instructions on when and how to suggest chart visualizations to the user.

## Architecture

### Scope

This feature modifies three modules:

1. **MCP Server** — New `generar_grafico` tool + shared chart rendering engine
2. **Backend** — New `generar_grafico` tool for the chatbot agent + chart image serving endpoint + system prompt enhancement
3. **Frontend** — Add `img` component to the chat `MarkdownRenderer` to display chart images inline

### Component Placement

```
mcp_server/src/mcp_portfolio/
├── tools/
│   ├── __init__.py              # Updated: register chart tools
│   ├── visualizacion.py         # NEW: generar_grafico MCP tool
│   └── ... (existing)
├── charts/
│   ├── __init__.py              # Module exports
│   ├── renderer.py              # Chart rendering engine (matplotlib wrapper)
│   ├── themes.py                # Color palettes and styling constants
│   └── utils.py                 # Label formatting, truncation, locale helpers
├── config.py                    # Updated: new chart config vars
└── ...

backend/app/
├── agent/
│   ├── tools_definition.py      # Updated: add generar_grafico tool schema
│   ├── tools_executor.py        # Updated: add _generar_grafico executor
│   ├── system_prompt.py         # Updated: chart guidance + suggestion rules
│   └── orchestrator.py          # Updated: handle image tool results
├── charts/
│   ├── __init__.py              # Module exports
│   ├── renderer.py              # Chart rendering engine (same logic as MCP)
│   ├── themes.py                # Shared color palette
│   └── utils.py                 # Formatting helpers
├── routers/
│   └── charts.py                # NEW: serve generated chart images
├── config.py                    # Updated: chart config vars
└── main.py                      # Updated: register charts router

frontend/src/features/chat/components/
└── MarkdownRenderer.jsx         # Updated: add img component for chart display
```

### Data Flow — MCP Server

```
Agent calls generar_grafico(tipo, titulo, ...)
    │
    ├── Mode A: "query" ─── campo_agrupacion + campo_valor + filtros
    │   └── _fetch_all_datos_relevantes() → aggregate client-side → data[]
    │
    └── Mode B: "direct" ── datos = [{etiqueta, valor}, ...]
        └── use provided data directly → data[]
    │
    ▼
charts/renderer.py  →  matplotlib figure  →  PNG bytes (in-memory)
    │
    ▼
Return as MCP Image content (base64-encoded PNG)
```

### Data Flow — Web Chatbot

```
LLM calls generar_grafico tool
    │
    ├── Mode A: "query" ─── campo_agrupacion + campo_valor + filtros
    │   └── _fetch_all_datos_relevantes() → aggregate client-side → data[]
    │
    └── Mode B: "direct" ── datos = [{etiqueta, valor}, ...]
        └── use provided data directly → data[]
    │
    ▼
backend/app/charts/renderer.py  →  matplotlib figure  →  PNG bytes
    │
    ▼
Save to CHART_OUTPUT_DIR/{uuid}.png
    │
    ▼
Return JSON: {"imagen_url": "/api/v1/charts/{uuid}.png", "descripcion": "..."}
    │
    ▼
LLM includes image in markdown response: ![titulo](url)
    │
    ▼
Frontend MarkdownRenderer renders <img> tag inline in chat
```

## New Tool: `generar_grafico`

### Tool Signature (MCP Server)

```python
@mcp.tool()
def generar_grafico(
    tipo_grafico: str,
    titulo: str,
    datos: list[dict] | None = None,
    campo_agrupacion: str | None = None,
    campo_valor: str | None = None,
    filtros: list[dict] | None = None,
    opciones: dict | None = None,
) -> Image:
```

### Tool Schema (Chatbot — Anthropic API format)

Added to `AGENT_TOOLS` in `backend/app/agent/tools_definition.py`:

```python
{
    "name": "generar_grafico",
    "description": (
        "Genera un gráfico a partir de datos del portfolio. "
        "Modo consulta: proporciona campo_agrupacion para consultar datos_relevantes automáticamente. "
        "Modo directo: proporciona datos como lista de {etiqueta, valor}. "
        "Tipos: barra, barra_horizontal, tarta, linea, barra_apilada."
    ),
    "input_schema": { ... }  # Same parameters as MCP version
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tipo_grafico` | str | Yes | Chart type: `"barra"`, `"barra_horizontal"`, `"tarta"`, `"linea"`, `"barra_apilada"` |
| `titulo` | str | Yes | Chart title |
| `datos` | list[dict] | No* | Direct data: `[{"etiqueta": "...", "valor": N}, ...]`. For stacked bars: `[{"etiqueta": "...", "valores": {"serie1": N, "serie2": N}}, ...]` |
| `campo_agrupacion` | str | No* | Field to group by (queries `datos_relevantes`). Ignored if `datos` is provided. |
| `campo_valor` | str | No | Numeric field to sum per group (default: count). Only used in query mode. |
| `filtros` | list[dict] | No | Pre-aggregation filters (same format as `buscar_iniciativas`). Only used in query mode. |
| `opciones` | dict | No | Customization options (see below). |

*Either `datos` (direct mode) or `campo_agrupacion` (query mode) must be provided.

### Options Dictionary

```json
{
  "subtitulo": "Optional subtitle text",
  "etiqueta_x": "X-axis label",
  "etiqueta_y": "Y-axis label",
  "mostrar_valores": true,
  "mostrar_leyenda": true,
  "formato_valor": "moneda",
  "max_categorias": 15,
  "orientacion": "horizontal",
  "ancho": 900,
  "alto": 600
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `subtitulo` | str | None | Subtitle displayed below the title |
| `etiqueta_x` | str | Auto | X-axis label |
| `etiqueta_y` | str | Auto | Y-axis label |
| `mostrar_valores` | bool | true | Show data labels on bars/slices |
| `mostrar_leyenda` | bool | Auto | Show legend (auto for pie/stacked) |
| `formato_valor` | str | `"numero"` | `"numero"` (plain), `"moneda"` (€ formatted), `"porcentaje"` |
| `max_categorias` | int | 15 | Max categories to display (rest grouped as "Otros") |
| `orientacion` | str | Auto | Force `"horizontal"` or `"vertical"` for bar charts |
| `ancho` | int | 900 | Chart width in pixels |
| `alto` | int | 600 | Chart height in pixels |

### Return Values

**MCP Server**: Returns an MCP `Image` object (base64-encoded PNG). The MCP SDK handles serialization to `ImageContent` in the protocol response.

**Chatbot**: Returns a JSON string with the chart URL and description:
```json
{
  "imagen_url": "/api/v1/charts/a1b2c3d4.png",
  "descripcion": "Gráfico de barras: Iniciativas por estado (12 categorías)"
}
```
The LLM then includes the URL in its markdown response (e.g., `![Iniciativas por estado](/api/v1/charts/a1b2c3d4.png)`), and the frontend's `MarkdownRenderer` renders it inline.

If the chart cannot be generated (bad data, missing field, etc.), both versions return a JSON string with an `error` key (same pattern as existing tools).

### Tool Description (Spanish — shared by both MCP and chatbot)

```
Genera un gráfico a partir de datos del portfolio.

Puede funcionar en dos modos:
1. Modo consulta: proporciona campo_agrupacion (y opcionalmente campo_valor y filtros)
   para que la herramienta consulte datos_relevantes y genere el gráfico automáticamente.
2. Modo directo: proporciona datos como lista de {etiqueta, valor} para graficar
   datos ya obtenidos con otras herramientas.

Tipos de gráfico disponibles:
- "barra": gráfico de barras verticales (comparación de categorías)
- "barra_horizontal": gráfico de barras horizontales (ideal para muchas categorías o etiquetas largas)
- "tarta": gráfico circular/de tarta (distribución proporcional, máximo 8-10 categorías)
- "linea": gráfico de líneas (tendencias temporales o series)
- "barra_apilada": barras apiladas (comparación multidimensional)

Sugerencia de uso según el tipo de datos:
- Distribución por categoría (estado, unidad, framework) → "barra" o "barra_horizontal"
- Proporción sobre un total → "tarta"
- Evolución temporal (importes por año) → "linea"
- Comparación de múltiples series por categoría → "barra_apilada"
```

## Chart Rendering Engine

The chart rendering engine is implemented in both `mcp_server/src/mcp_portfolio/charts/` and `backend/app/charts/` with identical logic. Both modules are Python packages with the same API surface.

### `charts/renderer.py`

Central rendering class that wraps matplotlib:

```python
class ChartRenderer:
    """Generates chart images from structured data."""

    def render(self, chart_type, title, data, options) -> bytes:
        """Render a chart and return PNG bytes."""

    def _render_bar(self, ...) -> Figure
    def _render_horizontal_bar(self, ...) -> Figure
    def _render_pie(self, ...) -> Figure
    def _render_line(self, ...) -> Figure
    def _render_stacked_bar(self, ...) -> Figure
```

### Design Decisions

1. **In-memory PNG generation**: Use `BytesIO` buffer — no temp files needed for MCP; chatbot saves to disk for URL serving.
2. **Non-interactive backend**: Use `matplotlib.use('Agg')` to avoid GUI dependencies.
3. **DPI**: 150 DPI for sharp rendering at reasonable file sizes (~50-150 KB per chart).
4. **Font**: Use matplotlib defaults (DejaVu Sans) — clean, supports Spanish characters.
5. **Figure lifecycle**: Create and close figures within each render call to prevent memory leaks.
6. **Code duplication**: The `charts/` module exists in both MCP server and backend. This is preferred over a shared package since the two modules have separate `pyproject.toml` and dependency management. The code is small (~300 lines total) and stable.

### `charts/themes.py`

Portfolio-consistent color palette:

```python
# Primary palette (8 colors) — consistent with frontend recharts palette
PORTFOLIO_COLORS = [
    "#3b82f6",  # Blue
    "#10b981",  # Emerald
    "#f59e0b",  # Amber
    "#ef4444",  # Red
    "#8b5cf6",  # Violet
    "#ec4899",  # Pink
    "#06b6d4",  # Cyan
    "#84cc16",  # Lime
]

# Extended palette for 9-15 categories
PORTFOLIO_COLORS_EXTENDED = PORTFOLIO_COLORS + [
    "#f97316",  # Orange
    "#6366f1",  # Indigo
    "#14b8a6",  # Teal
    "#e11d48",  # Rose
    "#a855f7",  # Purple
    "#22c55e",  # Green
    "#eab308",  # Yellow
]
```

### `charts/utils.py`

Utility functions:
- `format_currency(value)` → "1.234.567 €" (Spanish locale formatting)
- `format_number(value)` → "1.234.567"
- `format_compact(value)` → "1,2 M€" or "534 k€" for large numbers on chart labels
- `truncate_label(text, max_len=25)` → "Texto demasiado lar..."
- `group_small_categories(data, max_categories, other_label="Otros")` → groups tail into "Otros"

## Chart Type Specifications

### Bar Chart (`barra` / `barra_horizontal`)

- **Vertical bars** by default; horizontal when `orientacion="horizontal"` or `tipo_grafico="barra_horizontal"`
- Bars sorted by value descending (largest first)
- Data labels centered above each bar (or to the right for horizontal)
- Grid lines on the value axis (subtle, dashed)
- Categories with long labels: auto-rotate 45° for vertical, or use horizontal variant

### Pie Chart (`tarta`)

- Maximum 8-10 slices; remaining grouped as "Otros" (configurable via `max_categorias`)
- Percentage labels on slices (≥3% threshold; smaller slices unlabeled)
- Legend on the right side
- Explode the largest slice slightly (0.05) for emphasis
- Donut style (inner radius 0.3) for cleaner look

### Line Chart (`linea`)

- Points marked with circles
- Grid lines on both axes
- Data labels at each point
- Supports single or multiple series
- X-axis labels auto-rotated if needed

### Stacked Bar Chart (`barra_apilada`)

- Requires multi-series data (`valores` dict per entry)
- Legend identifies each series
- Data labels show individual segment values (if space allows)
- Sorted by total value descending

## Backend: Chart Image Serving

### Endpoint: `GET /api/v1/charts/{filename}`

A new router (`backend/app/routers/charts.py`) serves generated chart images:

- Serves PNG files from `CHART_OUTPUT_DIR` (default: `charts_output/` relative to backend)
- Returns `Content-Type: image/png`
- No authentication required (chart URLs are unguessable UUIDs)
- Automatic cleanup: files older than `CHART_MAX_AGE_HOURS` (default: 24) are deleted on each request or via a background task

### Chart Storage

- Charts saved as `{uuid4}.png` in `CHART_OUTPUT_DIR`
- UUID filenames ensure no collisions and are unguessable
- Cleanup strategy: delete files older than 24 hours (configurable)

## Backend: Chatbot Tool Executor

### `_generar_grafico` in `tools_executor.py`

```python
async def _generar_grafico(inp: dict, client: AgentAPIClient) -> str:
    """Generate a chart and return a URL to the image."""
    # 1. Validate parameters
    # 2. Fetch data (query mode) or use direct data
    # 3. Render chart via ChartRenderer → PNG bytes
    # 4. Save to CHART_OUTPUT_DIR/{uuid}.png
    # 5. Return JSON: {"imagen_url": "/api/v1/charts/{uuid}.png", "descripcion": "..."}
```

### Orchestrator Updates

The orchestrator (`orchestrator.py`) needs two updates:

1. **`_summarize_tool_input`**: Add a case for `generar_grafico` that summarizes the chart type, title, and data source.
2. **`_summarize_tool_result`**: Add a case that detects `imagen_url` in the result and shows "Gráfico generado" as the summary.

## Frontend: Chat Image Rendering

### `MarkdownRenderer.jsx` Update

Add an `img` component to the `ReactMarkdown` components map:

```jsx
img: ({ src, alt }) => (
  <img
    src={src?.startsWith('/') ? `${API_BASE_URL_ORIGIN}${src}` : src}
    alt={alt || 'Gráfico'}
    className="max-w-full rounded-lg border border-border my-2"
    loading="lazy"
  />
),
```

This ensures chart image URLs (relative paths like `/api/v1/charts/uuid.png`) are resolved against the backend origin and displayed inline in the chat conversation with appropriate styling.

## System Prompt Enhancement

### New Tool Section

Add to the "Uso de herramientas" section in `backend/app/agent/system_prompt.py`:

```
### generar_grafico
- Genera gráficos visuales (barras, tarta, líneas, barras apiladas) a partir de datos del portfolio
- Dos modos de uso:
  - Modo consulta: proporciona campo_agrupacion (y opcionalmente campo_valor y filtros) para que
    la herramienta consulte datos_relevantes y genere el gráfico directamente
  - Modo directo: proporciona datos como lista de {{etiqueta, valor}} usando datos ya obtenidos
    con contar_iniciativas o totalizar_importes
- El gráfico se muestra como imagen en la respuesta
- Usa esta herramienta DESPUÉS de obtener datos agregados cuando el usuario acepte la sugerencia
  de visualización, o cuando el usuario pida explícitamente un gráfico
```

### New Visualization Guideline

Add to the "Directrices de respuesta" section:

```
10. **Visualizaciones:** Cuando los datos obtenidos con contar_iniciativas o totalizar_importes
    contengan 3 o más grupos, ofrece proactivamente al usuario la posibilidad de visualizarlos
    como gráfico. Incluye la sugerencia al final de tu respuesta con el texto:
    "📊 ¿Te gustaría ver estos datos en un gráfico de [tipo recomendado]?"
    Selecciona el tipo de gráfico más adecuado según la naturaleza de los datos:
    - Distribución por categoría (estado, unidad, framework) → gráfico de barras
    - Proporción sobre un total (cuando hay ≤8 categorías) → gráfico de tarta
    - Evolución temporal o comparación por año → gráfico de líneas
    - Comparación multidimensional (ej: importes por unidad y año) → barras apiladas
    Si el usuario acepta, usa generar_grafico en modo directo con los datos ya obtenidos.
    Si el usuario pide explícitamente un gráfico desde el inicio, genera el gráfico directamente
    sin preguntar.
```

## Configuration

### New `.env` Variables — MCP Server (`mcp_server/.env`)

```env
# Chart Generation
CHART_DPI=150                          # Image resolution (dots per inch)
CHART_DEFAULT_WIDTH=900                # Default chart width in pixels
CHART_DEFAULT_HEIGHT=600               # Default chart height in pixels
CHART_MAX_CATEGORIES=15                # Max categories before grouping as "Otros"
CHART_LOCALE=es_ES                     # Locale for number formatting
```

### New `.env` Variables — Backend (`backend/.env`)

```env
# Chart Generation (Agent)
CHART_DPI=150                          # Image resolution (dots per inch)
CHART_DEFAULT_WIDTH=900                # Default chart width in pixels
CHART_DEFAULT_HEIGHT=600               # Default chart height in pixels
CHART_MAX_CATEGORIES=15                # Max categories before grouping as "Otros"
CHART_LOCALE=es_ES                     # Locale for number formatting
CHART_OUTPUT_DIR=charts_output         # Directory for generated chart images
CHART_MAX_AGE_HOURS=24                 # Auto-cleanup: delete charts older than N hours
```

### Config Updates

**MCP Server** `config.py`:
```python
CHART_DPI = int(os.getenv("CHART_DPI", "150"))
CHART_DEFAULT_WIDTH = int(os.getenv("CHART_DEFAULT_WIDTH", "900"))
CHART_DEFAULT_HEIGHT = int(os.getenv("CHART_DEFAULT_HEIGHT", "600"))
CHART_MAX_CATEGORIES = int(os.getenv("CHART_MAX_CATEGORIES", "15"))
CHART_LOCALE = os.getenv("CHART_LOCALE", "es_ES")
```

**Backend** `config.py` (via Settings class):
```python
CHART_DPI: int = 150
CHART_DEFAULT_WIDTH: int = 900
CHART_DEFAULT_HEIGHT: int = 600
CHART_MAX_CATEGORIES: int = 15
CHART_LOCALE: str = "es_ES"
CHART_OUTPUT_DIR: str = "charts_output"
CHART_MAX_AGE_HOURS: int = 24
```

## Dependencies

### MCP Server — `mcp_server/pyproject.toml`

```toml
dependencies = [
    "mcp[cli]>=1.2.0",
    "httpx",
    "python-dotenv",
    "matplotlib>=3.8",    # NEW: chart rendering
]
```

### Backend — `backend/pyproject.toml`

```toml
# Add to existing dependencies:
"matplotlib>=3.8",    # NEW: chart rendering for agent
```

`matplotlib` is chosen over `plotly` because:
- Produces static PNGs natively (no browser/kaleido needed)
- Lighter weight for server-side rendering
- `Agg` backend works headless without display server
- Well-supported on all platforms including Windows

## Logging

### MCP Server
All chart operations logged via the existing `portfolio_mcp` logger.

### Backend
All chart operations logged via the existing `portfolio_agent` logger.

Both log at:
- **INFO**: Tool call parameters, chart type, data point count, file path (backend)
- **DEBUG**: Detailed data values, rendering options, image size
- **ERROR**: Rendering failures, data validation errors
- **WARNING**: Data truncation (too many categories), fallback decisions, cleanup of old files

## Error Handling

| Scenario | Response |
|----------|----------|
| Neither `datos` nor `campo_agrupacion` provided | JSON error: "Debes proporcionar 'datos' o 'campo_agrupacion'" |
| Invalid `tipo_grafico` value | JSON error listing valid types |
| Empty data (0 rows from query or empty `datos`) | JSON error: "No hay datos para generar el gráfico" |
| API connection failure | JSON error with backend URL (same as existing tools) |
| Invalid field name in query mode | JSON error: "El campo 'X' no existe en datos_relevantes" |
| matplotlib rendering error | JSON error with description, logged as ERROR |
| Chart output directory not writable (backend) | JSON error, logged as ERROR |

## Testing Strategy

1. **MCP Server testing**: Connect via Claude Desktop or Claude Code, test each chart type with real portfolio data
2. **Chatbot testing**: Use the web chat interface, ask questions that trigger aggregations, accept chart suggestions
3. **Query mode**: `generar_grafico(tipo_grafico="barra", titulo="Iniciativas por estado", campo_agrupacion="estado_de_la_iniciativa")`
4. **Direct mode**: First call `contar_iniciativas`, then pass results to `generar_grafico` with `datos` parameter
5. **Edge cases**: Empty data, single category, 20+ categories (grouping), very long labels, zero/null values
6. **Suggestion flow**: Ask the chatbot a question that returns aggregated data, verify it suggests chart visualization, accept and verify chart renders inline
7. **Image serving**: Verify chart images are accessible via `GET /api/v1/charts/{uuid}.png`
8. **Cleanup**: Verify old chart files are cleaned up after `CHART_MAX_AGE_HOURS`
