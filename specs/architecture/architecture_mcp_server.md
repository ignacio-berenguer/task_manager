# MCP Server Architecture

## Overview

The MCP (Model Context Protocol) server provides read-only access to Portfolio Digital data for AI agents (Claude Desktop, Claude Code, future chat interfaces). It runs as a **separate process** from the FastAPI backend and acts as an HTTP client that translates MCP tool calls into API requests.

## Architecture Pattern

```
┌─────────────────┐       HTTP/JSON        ┌─────────────────┐       SQLite
│   MCP Server    │ ─────────────────────► │   FastAPI API   │ ────────────► portfolio.db
│  (mcp_server/)  │   POST /search         │  (backend/)     │
│                 │   GET /portfolio/{id}  │                 │
│  stdio | SSE    │ ◄───────────────────── │  :8000          │
└─────────────────┘       JSON responses   └─────────────────┘
```

- **Clean separation of concerns**: FastAPI serves HTTP clients; MCP serves AI agents
- **All business logic in the API**: Calculated fields, search, validation handled by backend
- **Independent lifecycle**: MCP server can restart without affecting the API
- **Dual transport**: stdio for local (Claude Desktop/Code), SSE for remote/production

## Module Structure

```
mcp_server/
├── pyproject.toml                  # mcp[cli], httpx, python-dotenv
├── .env / .env.example
└── src/mcp_portfolio/
    ├── __init__.py                 # Package + version
    ├── __main__.py                 # python -m mcp_portfolio entry point
    ├── server.py                   # FastMCP instance + tool registration + main()
    ├── config.py                   # Settings from .env (API URL, logging, limits)
    ├── api_client.py               # PortfolioAPIClient (httpx wrapper)
    ├── logging_config.py           # File + stderr logging (never stdout)
    ├── table_metadata.py           # TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, URL prefixes
    ├── charts/                     # Chart rendering module (matplotlib-based)
    │   ├── __init__.py             # Module exports
    │   ├── renderer.py             # ChartRenderer class — generates bar, pie, line, stacked bar charts as base64 PNG
    │   ├── themes.py               # Chart color palettes and styling (dark/light, Spanish locale)
    │   └── utils.py                # Data preparation, category truncation, legend formatting
    └── tools/
        ├── __init__.py             # register_tools(mcp, api_client)
        ├── busqueda.py             # buscar_iniciativas, buscar_en_tabla
        ├── detalle.py              # obtener_iniciativa, obtener_documentos
        ├── agregacion.py           # contar_iniciativas, totalizar_importes
        ├── esquema.py              # listar_tablas, describir_tabla, obtener_valores_campo
        ├── visualizacion.py        # generar_grafico — chart generation tool
        └── sql_query.py            # ejecutar_consulta_sql — read-only SQL query execution
```

## MCP Tools (11 total)

All tool names, descriptions, and parameter help are in Spanish.

### Search Tools (busqueda.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `buscar_iniciativas` | POST /datos-relevantes/search | Search datos_relevantes with flexible filters, sorting, pagination |
| `buscar_en_tabla` | POST /{table}/search or GET /{table} | Search any table (10 with filters, rest with pagination only) |

### Detail Tools (detalle.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `obtener_iniciativa` | GET /portfolio/{pid} | Get all data across all tables for one initiative |
| `obtener_documentos` | POST /documentos/search + GET /documentos/portfolio/{pid} | Get/search document AI summaries |

### Aggregation Tools (agregacion.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `contar_iniciativas` | POST /datos-relevantes/search → client-side GROUP BY | Count initiatives by any dimension |
| `totalizar_importes` | POST /datos-relevantes/search → client-side SUM | Sum importe fields by any dimension |

### Schema Tools (esquema.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `listar_tablas` | GET /{table}?limit=1 (each) | List all tables with descriptions and row counts |
| `describir_tabla` | GET /{table}?limit=1 | Get column names and metadata for a table |
| `obtener_valores_campo` | POST/GET → extract distinct | Get distinct values for a field |

### Visualization Tools (visualizacion.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `generar_grafico` | Uses data from prior tool calls | Generates a chart (bar, pie, line, stacked_bar) from provided data and returns base64 PNG |

### SQL Query Tools (sql_query.py)
| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `ejecutar_consulta_sql` | POST /sql/execute | Execute read-only SQL SELECT queries against the portfolio database |

**Parameters:**
- `consulta_sql` (string, required) — SQL SELECT query to execute
- `explicacion` (string|null, optional) — Explanation of what the query does and why
- `limite_filas` (int, optional) — Maximum rows to return

**Response fields:** `sql_ejecutado`, `explicacion`, `columnas`, `total_filas`, `truncado`, `tiempo_ejecucion_ms`, `datos`

## Charts Module (charts/)

Matplotlib-based chart rendering shared with the backend agent module.

- **renderer.py**: `ChartRenderer` class that accepts chart type, title, data (categories + series), and produces a PNG image. Supports `bar`, `pie`, `line`, and `stacked_bar` chart types. Output is base64-encoded for MCP tool responses. **Data ordering is preserved** — the renderer does not sort data by value; the AI agent controls bar/category ordering. For horizontal bar charts, the first data item appears at the top (Feature 068).
- **themes.py**: Color palettes, Spanish locale formatting (thousands separator, decimal comma), font configuration.
- **utils.py**: Data preparation helpers — category truncation (respects `CHART_MAX_CATEGORIES`), legend formatting, value label positioning.

## API Client (api_client.py)

`PortfolioAPIClient` wraps `httpx.Client` (synchronous, with `follow_redirects=True`):

- `search(table, filters, order_by, order_dir, limit, offset)` → POST /search
- `list_records(table, limit, offset)` → GET /{table}
- `get_portfolio(portfolio_id)` → GET /portfolio/{pid}
- `get_portfolio_records(table, portfolio_id)` → GET /{table}/portfolio/{pid}
- `health_check()` → GET /datos-relevantes?limit=1

Error handling translates HTTP status codes to Spanish error messages.

## Table Metadata (table_metadata.py)

- **TABLA_DESCRIPCIONES**: 26 tables with Spanish descriptions
- **TABLAS_CON_BUSQUEDA**: 10 tables supporting POST /search with flexible filters
- **get_url_prefix(tabla)**: Maps table names (underscore) to API prefixes (hyphenated)

Tables with flexible search: datos_relevantes, iniciativas, datos_descriptivos, informacion_economica, hechos, etiquetas, acciones, dependencias, documentos, fichas.

## Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| API_BASE_URL | http://localhost:8000/api/v1 | FastAPI backend URL |
| API_TIMEOUT | 30 | HTTP request timeout (seconds) |
| LOG_LEVEL | INFO | Logging level |
| LOG_FILE | portfolio_mcp.log | Log filename (in ../logs/) |
| MAX_QUERY_ROWS | 500 | Hard max rows per tool call |
| DEFAULT_QUERY_ROWS | 50 | Default rows per tool call |
| MCP_TRANSPORT | stdio | "stdio" or "sse" |
| MCP_HOST | 0.0.0.0 | SSE bind host |
| MCP_PORT | 8001 | SSE bind port |
| CHART_DPI | 150 | Chart image resolution (dots per inch) |
| CHART_DEFAULT_WIDTH | 10 | Default chart width in inches |
| CHART_DEFAULT_HEIGHT | 6 | Default chart height in inches |
| CHART_MAX_CATEGORIES | 15 | Max categories before grouping remainder into "Otros" |
| CHART_LOCALE | es_ES | Locale for number formatting in charts |

## Logging

- **File**: `logs/portfolio_mcp.log` (append, same directory as other modules)
- **Console**: stderr only (stdout reserved for MCP JSON-RPC in stdio mode)
- **Levels**: INFO for tool calls, DEBUG for API request/response, ERROR for failures

## Dependencies

```toml
[project]
dependencies = [
    "mcp[cli]>=1.0.0",
    "httpx>=0.27.0",
    "python-dotenv>=1.0.0",
    "matplotlib>=3.8",
]
```

## Security

1. **Read-only**: Only GET and POST-search endpoints called. No PUT/DELETE/mutation. Chart generation is a local rendering operation.
2. **No direct DB**: All data through the API's validation layer.
3. **Table whitelist**: Only approved tables queryable via tools.
4. **Row limits**: Max 500 rows per call.
5. **No secrets**: Only API URL in .env.

## Aggregation Strategy

For count/sum operations, the MCP server fetches all matching `datos_relevantes` rows (up to 1000, covering all ~853 initiatives) and aggregates client-side using Python's `collections.Counter` and `defaultdict`. This is efficient because datos_relevantes has one row per initiative.
