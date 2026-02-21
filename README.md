# Task Manager

Full-stack task management system. Imports task data from Excel workbooks into a normalized SQLite database, exposes it through a REST API, and provides a React web application with search, detail views, and an AI chat assistant.

## Architecture

| Module | Technology | Purpose |
|--------|-----------|---------|
| `management/` | Python 3.12, pandas, openpyxl | CLI tool for Excel-to-SQLite migration |
| `backend/` | Python 3.12, FastAPI, SQLAlchemy, anthropic, httpx | REST API with CRUD, flexible search, and AI agent |
| `frontend/` | React 19, Vite, Tailwind CSS | SPA with search, task detail, and AI chat |
| `mcp_server/` | Python 3.12, MCP SDK, httpx | MCP server for AI agents -- read-only task access via 6 tools |

## Quick Start

### Prerequisites

- Python 3.12+ with [`uv`](https://docs.astral.sh/uv/) package manager
- Node.js 18+ with `npm`

### 1. Migration (populate the database)

```bash
cd management
uv sync
cp .env.example .env                                      # Configure paths (optional)
uv run python manage.py complete_process                   # Full pipeline: recreate + migrate
```

### 2. Backend API

```bash
cd backend
uv sync
cp .env.example .env                                      # Configure (optional)
uv run python -m app.main                                # Uses API_PORT from .env (default: 8080)
```

- Swagger UI: http://localhost:8080/api/v1/docs
- ReDoc: http://localhost:8080/api/v1/redoc

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env                                      # Add Clerk key + API URL
npm run dev                                               # http://localhost:5173
```

### 4. MCP Server (AI Agent Interface)

**Prerequisite:** The backend API must be running on port 8000.

```bash
cd mcp_server
uv sync
cp .env.example .env                                      # Configure (optional)
uv run -m mcp_tareas                                       # Start MCP server (stdio mode)
```

## Project Structure

```
task_manager/
├── management/                      # Migration CLI tool
│   ├── manage.py                    # CLI entry point (4 commands)
│   ├── .env / .env.example          # Configuration
│   └── src/
│       ├── core/                    # logging_config.py, data_quality.py
│       ├── config/                  # settings.py (loads .env)
│       ├── init/                    # db_init.py
│       └── migrate/                 # engine.py (TareasMigrationEngine)
│
├── db/
│   └── schema.sql                   # Complete DDL (5 tables + seed data)
│
├── backend/                         # FastAPI REST API
│   ├── app/
│   │   ├── main.py                  # Entry point + CORS + router registration
│   │   ├── config.py                # Environment config
│   │   ├── database.py              # SQLite connection
│   │   ├── models.py                # 5 SQLAlchemy ORM models
│   │   ├── schemas.py               # Pydantic validation schemas
│   │   ├── crud.py                  # Generic CRUDBase class
│   │   ├── search.py                # Flexible search with 12 operators
│   │   ├── table_registry.py        # TABLE_MODELS mapping
│   │   ├── agent/                   # AI agent chat module
│   │   │   ├── config.py            # Agent configuration
│   │   │   ├── table_metadata.py    # Table descriptions
│   │   │   ├── api_client.py        # Async HTTP client for self-calls
│   │   │   ├── tools_definition.py  # 4 tool schemas
│   │   │   ├── tools_executor.py    # Tool execution logic
│   │   │   ├── system_prompt.py     # System prompt
│   │   │   └── orchestrator.py      # Agentic loop with streaming
│   │   └── routers/
│   │       ├── tareas.py            # Tareas CRUD + Search
│   │       ├── acciones.py          # Acciones CRUD
│   │       ├── estados.py           # Estados parametric tables
│   │       ├── responsables.py      # Responsables parametric table
│   │       └── agent.py             # AI agent chat with SSE streaming
│   ├── pyproject.toml
│   └── .env                         # Configuration (gitignored)
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── api/client.js            # Axios + Clerk JWT interceptors
│   │   ├── components/
│   │   │   ├── ui/                  # 21 shadcn-style components
│   │   │   ├── layout/              # Navbar, Footer, Layout, GlobalSearch
│   │   │   ├── theme/               # ThemeProvider, ModeToggle, ColorTheme
│   │   │   └── shared/              # ProtectedRoute, ColumnConfigurator, EstadoBadge, ErrorBoundary, etc.
│   │   ├── features/
│   │   │   ├── landing/             # Public landing page (hero + changelog)
│   │   │   ├── search/              # Task search + data grid
│   │   │   ├── detail/              # Task detail + acciones CRUD
│   │   │   ├── shared/              # Shared dialogs (AddAccion, CambiarFecha)
│   │   │   └── chat/                # AI assistant chat
│   │   ├── lib/                     # changelog, estadoOrder, formatDate, logger, storage, utils, version, themes
│   │   └── providers/               # Clerk, Query, Theme, Chat, Toaster
│   ├── .env / .env.example
│   ├── package.json
│   └── vite.config.js
│
├── mcp_server/                      # MCP server for AI agents
│   ├── pyproject.toml
│   ├── .env / .env.example
│   └── src/mcp_tareas/
│       ├── server.py                # FastMCP instance + entry point
│       ├── api_client.py            # TaskAPIClient (synchronous httpx)
│       ├── table_metadata.py        # Table descriptions + search capabilities
│       └── tools/                   # busqueda, detalle, esquema
│
├── logs/                            # Centralized logs (gitignored)
├── specs/                           # Technical specifications
│   ├── architecture/                # Architecture documents
│   └── features/                    # Feature specs
│
├── CLAUDE.md                        # Claude Code instructions
└── README.md                        # This file
```

## Database Schema

**5 tables** in SQLite:

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `tareas` | `tarea_id` (TEXT) | Main tasks table with responsable, tema, estado, notas_anteriores |
| `acciones_realizadas` | `id` (INTEGER, auto) | Actions performed on tasks, FK to tareas. Includes `fecha_accion` |
| `estados_tareas` | `id` (INTEGER, auto) | Parametric table of valid task estados |
| `estados_acciones` | `id` (INTEGER, auto) | Parametric table of valid action estados |
| `responsables` | `id` (INTEGER, auto) | Parametric table of responsable values |

Seed data includes default estados: Pendiente, En Progreso, Completada, Cancelada (tareas) and Pendiente, En Progreso, Completada (acciones). Responsables are seeded during migration from Excel data.

### Migration: Excel Table Reading

The migration engine reads data from an Excel named Table (ListObject) using openpyxl. It locates the Table specified by `EXCEL_TABLE_TAREAS` within the sheet `EXCEL_SHEET_TAREAS`. If the named Table is not found, it falls back to reading the entire sheet.

### Migration: Notas Parsing

During migration, the `Notas` column from the Excel tareas data is:
1. Preserved as-is in the `notas_anteriores` field on tareas
2. Parsed line-by-line to create individual `acciones_realizadas` records:
   - Lines starting with a date (`DD/MM/YYYY` or `DD/MM`) → accion with `estado = COMPLETADO`
   - Lines starting with `NBA:` → accion with `estado = PENDIENTE` and future date (today + 7 days)
   - Text is normalized: first letter capitalized, leading spaces/punctuation trimmed

## Backend API

### Endpoints

**Tareas:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tareas` | List all tareas (paginated) |
| GET | `/api/v1/tareas/{tarea_id}` | Get tarea by ID |
| POST | `/api/v1/tareas` | Create tarea |
| PUT | `/api/v1/tareas/{tarea_id}` | Update tarea |
| DELETE | `/api/v1/tareas/{tarea_id}` | Delete tarea |
| POST | `/api/v1/tareas/search` | Flexible search with filters |

**Acciones:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/acciones` | List all acciones (paginated) |
| GET | `/api/v1/acciones/{id}` | Get accion by ID |
| GET | `/api/v1/acciones/tarea/{tarea_id}` | Get acciones for a tarea |
| POST | `/api/v1/acciones` | Create accion |
| PUT | `/api/v1/acciones/{id}` | Update accion |
| DELETE | `/api/v1/acciones/{id}` | Delete accion |

**Estados:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/estados-tareas` | List task estados |
| GET | `/api/v1/estados-acciones` | List action estados |

**Responsables:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/responsables` | List all responsables |
| POST | `/api/v1/responsables` | Create responsable |
| PUT | `/api/v1/responsables/{id}` | Update responsable |
| DELETE | `/api/v1/responsables/{id}` | Delete responsable |

**Agent:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/chat` | AI agent chat with SSE streaming |

**Flexible Search Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `is_null`, `is_not_null`

## Frontend Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with hero section and changelog |
| `/sign-in`, `/sign-up` | Public | Clerk authentication |
| `/search` | Private | Task search with labeled filters, lateral sidebar (xl+), column filter popovers (funnel icon), active filter tags (removable badges), sortable/reorderable columns, colored estado tags, sticky title bar, inline detail accordion, side drawer quick view, quick action buttons (add accion, change fecha), keyboard shortcuts, new tarea dialog |
| `/detail/:tarea_id` | Private | Task header with tarea name prominent + tarea_id muted, estado + responsable + fecha_siguiente_accion badges + cambiar fecha button, compact acciones CRUD table (sorted desc, sticky headers), add accion dialog, notas accordion (collapsed), datos accordion (collapsed), Ctrl+Shift+F shortcut, back navigation with state preservation |
| `/chat` | Private | AI assistant with SSE streaming |

## MCP Tools

6 tools available through the MCP server (all in Spanish):

| Tool | Description |
|------|-------------|
| `buscar_tareas` | Search tareas with flexible filters |
| `buscar_acciones` | Get acciones for a specific tarea |
| `obtener_tarea` | Get complete tarea data with all acciones |
| `listar_tablas` | List available tables with descriptions |
| `describir_tabla` | Describe table columns and metadata |
| `obtener_valores_campo` | Get distinct values for a field |

## Configuration

### Management (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `task_manager_migration.log` | Log file name |
| `DATABASE_PATH` | `PROJECT_ROOT/db/task_manager.db` | SQLite database path |
| `EXCEL_SOURCE_DIR` | `excel_source` | Directory containing Excel files |
| `EXCEL_SOURCE_FILE` | `tareas.xlsx` | Excel workbook file name |
| `EXCEL_SHEET_TAREAS` | `Tareas` | Sheet name containing tareas data |
| `EXCEL_TABLE_TAREAS` | `Tareas` | Excel named Table (ListObject) within the sheet |
| `BATCH_COMMIT_SIZE` | `100` | Rows per batch commit during migration |

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `task_manager_backend.log` | Log file name |
| `API_HOST` | `0.0.0.0` | Server bind host |
| `API_PORT` | `8080` | Server port |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `API_TITLE` | `Task Manager API` | Swagger title |
| `API_VERSION` | `1.0.0` | API version |
| `DATABASE_PATH` | _(auto-detect)_ | SQLite database path |
| `DATABASE_ECHO` | `false` | Log SQL queries |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `ANTHROPIC_API_KEY` | -- | Anthropic API key (required for AI agent) |
| `AGENT_MODEL` | `claude-sonnet-4-20250514` | AI agent model ID |
| `AGENT_MAX_TOKENS` | `4096` | Max tokens per agent response |
| `AGENT_TEMPERATURE` | `0.3` | Agent temperature |
| `AGENT_MAX_TOOL_ROUNDS` | `10` | Max tool iteration rounds |
| `AGENT_API_BASE_URL` | `http://localhost:8080/api/v1` | Backend API URL for agent self-calls |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | -- | Clerk publishable key (required) |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Backend API URL |
| `VITE_LOG_LEVEL` | `INFO` | Browser console log level |
| `VITE_APP_NAME` | `Task Manager` | Application name |

### MCP Server (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8080/api/v1` | FastAPI backend URL |
| `API_TIMEOUT` | `30` | HTTP request timeout (seconds) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `task_manager_mcp.log` | Log file name |
| `MCP_TRANSPORT` | `stdio` | Transport mode: "stdio" or "sse" |
| `MCP_HOST` | `0.0.0.0` | SSE bind host |
| `MCP_PORT` | `8001` | SSE bind port |

## Logging

| Module | Log File | Description |
|--------|----------|-------------|
| Management | `logs/task_manager_migration.log` | Migration CLI logging |
| Backend | `logs/task_manager_backend.log` | FastAPI request/operation logging |
| MCP Server | `logs/task_manager_mcp.log` | MCP tool call logging |
| Frontend | Browser console | Color-coded, timestamped via `createLogger()` |

## Documentation

| Document | Description |
|----------|-------------|
| `specs/architecture/architecture_management.md` | Management module architecture |
| `specs/architecture/architecture_backend.md` | Backend API architecture |
| `specs/architecture/architecture_frontend.md` | Frontend architecture |
| `specs/architecture/architecture_mcp_server.md` | MCP server architecture |
| `CLAUDE.md` | Claude Code development instructions |

## License

Internal use only.
