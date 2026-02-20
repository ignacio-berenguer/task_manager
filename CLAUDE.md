# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Manager — a full-stack task management system. The system imports tasks from an Excel workbook into a SQLite database, exposes them through a REST API, and provides a web application with search, detail views, and CRUD operations.

**Four Modules:**

| Module | Technology | Purpose |
|--------|-----------|---------|
| `management/` | Python 3.12 + pandas | CLI tool: Excel-to-SQLite migration |
| `backend/` | Python 3.12 + FastAPI + SQLAlchemy | REST API with CRUD, flexible search, AI agent |
| `frontend/` | React 19 + Vite + Tailwind CSS | SPA with landing, search, detail, AI chat |
| `mcp_server/` | Python 3.12 + MCP SDK + httpx | MCP server for AI agents: 6 tools |

**Shared Resources:**
- `db/` — SQLite database + schema DDL
- `logs/` — Centralized log directory (all modules)
- `specs/` — Technical specifications, architecture docs, feature specs

## Setup and Running

### Management (Migration CLI)

```bash
cd management
uv sync
uv run python manage.py complete_process       # Full pipeline: recreate + migrate
uv run python manage.py init                    # Create .db file + schema
uv run python manage.py recreate_tables         # Drop all tables, recreate from schema.sql
uv run python manage.py migrate                 # Excel -> SQLite
uv run python manage.py migrate --db custom.db  # Custom database path
```

**Dependencies:** pandas, openpyxl (managed via `uv`)

### Backend (FastAPI API)

```bash
cd backend
uv sync
uv run python -m app.main                    # Uses API_PORT from .env (default: 8080)
```

- Swagger UI: http://localhost:8080/api/v1/docs

**Dependencies:** fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings, python-dotenv, anthropic, httpx

### Frontend (React SPA)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
```

**Dependencies:** React 19, react-router-dom 6, @tanstack/react-query 5, @clerk/clerk-react, tailwindcss 4, lucide-react, axios

### MCP Server (AI Agent Interface)

**Prerequisite:** Backend API must be running on port 8000.

```bash
cd mcp_server
uv sync
uv run -m mcp_tareas                          # Start (stdio mode)
MCP_TRANSPORT=sse uv run -m mcp_tareas        # Start (SSE mode, port 8001)
```

**6 MCP tools** (all in Spanish): buscar_tareas, buscar_acciones, obtener_tarea, listar_tablas, describir_tabla, obtener_valores_campo.

**Dependencies:** mcp[cli], httpx, python-dotenv

## Project Structure

```
task_manager/
├── management/                      # Migration CLI tool
│   ├── manage.py                    # CLI entry point
│   ├── .env.example                 # Configuration template
│   ├── pyproject.toml
│   └── src/
│       ├── config/                  # settings.py (loads .env)
│       ├── core/                    # logging_config.py, data_quality.py
│       ├── init/                    # db_init.py
│       └── migrate/                 # engine.py
│
├── db/
│   ├── schema.sql                   # Complete DDL (5 tables)
│   └── task_manager.db              # SQLite database (gitignored)
│
├── backend/                         # FastAPI REST API
│   ├── app/
│   │   ├── main.py                  # Entry point + CORS + router registration
│   │   ├── config.py                # Environment config
│   │   ├── database.py              # SQLite connection
│   │   ├── models.py                # 5 SQLAlchemy ORM models
│   │   ├── schemas.py               # Pydantic validation schemas
│   │   ├── crud.py                  # Reusable CRUD operations
│   │   ├── search.py                # Flexible search with operators
│   │   ├── table_registry.py        # TABLE_MODELS mapping
│   │   ├── agent/                   # AI agent module
│   │   │   ├── orchestrator.py      # Agent orchestration logic
│   │   │   ├── tools.py             # Tool definitions for the agent
│   │   │   ├── system_prompt.py     # System prompt configuration
│   │   │   ├── api_client.py        # Internal API client
│   │   │   ├── config.py            # Agent configuration
│   │   │   └── table_metadata.py    # Table metadata for the agent
│   │   └── routers/                 # API endpoint files
│   │       ├── tareas.py            # Tareas endpoints
│   │       ├── acciones.py          # Acciones endpoints
│   │       ├── estados.py           # Estados endpoints
│   │       ├── responsables.py      # Responsables parametric endpoint
│   │       └── agent.py             # AI agent chat endpoint
│   ├── pyproject.toml
│   └── .env.example                 # Configuration template
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── api/client.js            # Axios + Clerk JWT interceptors
│   │   ├── components/
│   │   │   ├── ui/                  # Base components (Button, Dialog, etc.)
│   │   │   ├── layout/              # Navbar, Footer, Layout
│   │   │   ├── theme/               # ThemeProvider, ModeToggle
│   │   │   └── shared/              # ProtectedRoute, ErrorBoundary, NotFoundPage
│   │   ├── features/
│   │   │   ├── landing/             # Public landing page (branding + changelog)
│   │   │   ├── search/              # Task search with filters
│   │   │   ├── detail/              # Task detail (tarea info + acciones CRUD)
│   │   │   └── chat/                # AI assistant chat page
│   │   ├── lib/                     # utils.js, logger.js, storage.js, version.js, changelog.js, estadoOrder.js
│   │   ├── hooks/                   # usePageTitle.js
│   │   ├── providers/               # Providers.jsx, QueryProvider.jsx
│   │   └── App.jsx, main.jsx, index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example                 # Configuration template
│
├── mcp_server/                      # MCP server for AI agents
│   ├── src/mcp_tareas/
│   │   ├── server.py                # FastMCP instance + entry point
│   │   ├── api_client.py            # HTTP client for FastAPI backend
│   │   ├── config.py                # MCP server configuration
│   │   ├── logging_config.py        # Logging setup
│   │   ├── table_metadata.py        # Table descriptions + search capabilities
│   │   └── tools/                   # Tool modules
│   │       ├── busqueda.py          # Search tools
│   │       ├── detalle.py           # Detail tools
│   │       └── esquema.py           # Schema tools
│   ├── pyproject.toml
│   └── .env.example                 # Configuration template
│
├── logs/                            # Centralized logs (gitignored)
├── specs/
│   ├── architecture/                # Architecture documents
│   └── features/                    # Feature specs
│       ├── feature_NNN/             # Active features (in progress)
│       └── implemented/             # Completed features
│
├── .claude/skills/                  # Custom Claude Code skills
│   ├── create_feature/SKILL.md      # /create_feature — scaffold new feature folder
│   ├── plan_feature/SKILL.md        # /plan_feature — plan a feature from requirements
│   ├── develop_feature/SKILL.md     # /develop_feature — implement feature from plan
│   └── close_feature/SKILL.md       # /close_feature — verify docs, move to implemented, commit+push
│
├── CLAUDE.md                        # This file
└── README.md                        # Project documentation
```

## Database Schema

**5 Tables:**

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `tareas` | `tarea_id` (TEXT) | Core task records |
| `acciones_realizadas` | `id` (INTEGER, autoincrement) | Actions linked to tasks via `tarea_id` FK |
| `estados_tareas` | `id` (INTEGER, autoincrement) | Parametric: task status values |
| `estados_acciones` | `id` (INTEGER, autoincrement) | Parametric: action status values |
| `responsables` | `id` (INTEGER, autoincrement) | Parametric: responsable values (seeded from migration) |

**Table Details:**

- **tareas**: `tarea_id` (TEXT PK), `tarea`, `responsable`, `descripcion`, `fecha_siguiente_accion`, `tema`, `estado`, `notas_anteriores`, `fecha_creacion`, `fecha_actualizacion`
- **acciones_realizadas**: `id` (INTEGER PK), `tarea_id` (FK to tareas, ON DELETE CASCADE), `accion`, `fecha_accion`, `estado`, `fecha_creacion`, `fecha_actualizacion`
- **estados_tareas**: `id`, `valor` (UNIQUE), `orden`, `color` — seeded with: Pendiente, En Progreso, Completada, Cancelada
- **estados_acciones**: `id`, `valor` (UNIQUE), `orden`, `color` — seeded with: Pendiente, En Progreso, Completada
- **responsables**: `id`, `valor` (UNIQUE), `orden` — seeded during migration from unique Excel responsable values

## Backend API

### Tareas (`/api/v1/tareas`)

- `GET /` — List (paginated, limit/offset)
- `GET /filter-options` — Distinct values for filter dropdowns
- `POST /search` — Flexible search with filters
- `GET /{tarea_id}` — Get by ID
- `POST /` — Create
- `PUT /{tarea_id}` — Update
- `DELETE /{tarea_id}` — Delete (cascades to acciones_realizadas)

### Acciones (`/api/v1/acciones`)

- `GET /` — List (paginated)
- `GET /tarea/{tarea_id}` — Get actions by tarea
- `GET /{id}` — Get by ID
- `POST /` — Create
- `PUT /{id}` — Update
- `DELETE /{id}` — Delete

### Estados (`/api/v1/estados-tareas`, `/api/v1/estados-acciones`)

- `GET /` — List all status values
- `POST /` — Create
- `PUT /{id}` — Update
- `DELETE /{id}` — Delete

### Responsables (`/api/v1/responsables`)

- `GET /` — List all responsables (ordered by `orden`)
- `POST /` — Create
- `PUT /{id}` — Update
- `DELETE /{id}` — Delete

### Agent (`/api/v1/agent`)

- `POST /chat` — AI chat via Server-Sent Events (SSE)

### Flexible Search

```json
POST /api/v1/tareas/search
{
  "filters": [{"field": "responsable", "operator": "ilike", "value": "%juan%"}],
  "order_by": "fecha_creacion", "order_dir": "desc",
  "limit": 100, "offset": 0
}
```

**Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `is_null`, `is_not_null`

## Frontend Application

### Routes

| Route | Access | Page | Description |
|-------|--------|------|-------------|
| `/` | Public | LandingPage | Branding + changelog |
| `/sign-in`, `/sign-up` | Public | Clerk auth | Authentication |
| `/search` | Private | SearchPage | Task search with filters |
| `/detail/:tarea_id` | Private | DetailPage | Tarea info + acciones CRUD |
| `/chat` | Private | ChatPage | AI assistant |

### Key Frontend Patterns

**Route-Based Code Splitting** (`src/App.jsx`):
- All protected routes use `React.lazy()` + `Suspense` for on-demand loading
- `ErrorBoundary` wraps each protected route for graceful error handling
- 404 catch-all route renders `NotFoundPage`

**Shared localStorage Utility** (`src/lib/storage.js`):
- `createStorage(prefix)` factory creates namespaced storage interfaces
- Methods: `saveJSON`, `loadJSON`, `saveString`, `loadString`, `loadInt`, `remove`

**Estado Workflow Order** (`src/lib/estadoOrder.js`):
- All estado dropdowns use canonical workflow order, NOT alphabetical
- Applies to Search and Detail filter panels

**Authentication**: Clerk (JWT tokens auto-injected via Axios interceptors)

**Logging**: `createLogger('ContextName')` — browser console, color-coded + timestamped

## Configuration (.env files)

Each module has its own `.env` file (use `.env.example` as template). At minimum each includes `LOG_LEVEL` and `LOG_FILE`.

### Management

```env
LOG_LEVEL=INFO
LOG_FILE=task_manager.log
DATABASE_PATH=                    # Empty = auto-detect relative to project root
EXCEL_SOURCE_DIR=./excel_source
EXCEL_SOURCE_FILE=tareas.xlsx
EXCEL_SHEET_TAREAS=Tareas
EXCEL_SHEET_ACCIONES=Acciones
BATCH_COMMIT_SIZE=500
```

### Backend

```env
LOG_LEVEL=INFO
LOG_FILE=task_manager_backend.log
API_PREFIX=/api/v1
API_TITLE=Task Manager API
API_VERSION=1.0.0
DATABASE_PATH=                    # Empty = auto-detect relative to project root
DATABASE_ECHO=false               # Set to true to log SQL queries
CORS_ORIGINS=["http://localhost:5173"]
ANTHROPIC_API_KEY=                # Required for AI agent
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.0
AGENT_MAX_TOOL_ROUNDS=10
AGENT_API_BASE_URL=http://localhost:8080/api/v1
```

### Frontend

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Task Manager
```

### MCP Server

```env
API_BASE_URL=http://localhost:8080/api/v1
API_TIMEOUT=30
LOG_LEVEL=INFO
LOG_FILE=task_manager_mcp.log
MAX_QUERY_ROWS=500
DEFAULT_QUERY_ROWS=50
MCP_TRANSPORT=stdio
MCP_HOST=0.0.0.0
MCP_PORT=8001
```

## Key Implementation Details

### Naming Convention

- **Spanish column names** with accents removed (e.g., descripcion, accion)
- Lowercase with underscores: `tarea_id`, `fecha_creacion`, `fecha_actualizacion`

### Data Handling

- **Dates**: Stored as ISO 8601 TEXT in SQLite
- **Cascade deletes**: Deleting a tarea cascades to its acciones_realizadas (ON DELETE CASCADE)

### AI Agent

The backend includes an AI agent module (`app/agent/`) that provides a conversational interface to the task database. The agent:
- Receives user messages via the `/agent/chat` SSE endpoint
- Uses Anthropic's Claude API with tool-use to query the database
- Has access to tools for searching, reading, and modifying tasks and actions
- Streams responses back to the frontend via Server-Sent Events

## Custom Claude Code Skills

Four custom skills are available in `.claude/skills/`:

| Skill | Command | Description |
|-------|---------|-------------|
| create_feature | `/create_feature <description>` | Scaffolds `specs/features/feature_NNN/requirements.md` with next available number |
| plan_feature | `/plan_feature feature_NNN` | Creates specs.md and plan.md from requirements |
| develop_feature | `/develop_feature feature_NNN` | Implements feature from specs & plan, creates task list, implements step by step |
| close_feature | `/close_feature feature_NNN` | Verifies docs are updated, moves to `implemented/`, commits + pushes |

## Critical Development Notes

### FastAPI Route Ordering
**Static routes MUST be defined before dynamic path parameter routes** in routers. E.g., `GET /filter-options` must come before `GET /{tarea_id}`. FastAPI attempts the dynamic match first and returns 422 rather than falling through.

### Estado Workflow Order
All `estado` dropdowns across the app must use the canonical order from `src/lib/estadoOrder.js`, NOT alphabetical. This applies to search filters and detail page dropdowns.

### Post Implementation Checklist
After implementing each feature:
1. **Version & Changelog (MANDATORY)**: Increment `APP_VERSION.minor` in `frontend/src/lib/version.js` to the new feature number AND add a new entry at the TOP of the `CHANGELOG` array in `frontend/src/lib/changelog.js` (version, feature, title, summary). These are displayed on the landing page.
2. Update `README.md`
3. Update `specs/architecture/architecture_backend.md` and/or `specs/architecture/architecture_frontend.md`
4. Use `/close_feature feature_NNN` to verify docs, move to implemented, and commit

### General Development
- **Management CLI**: Always use `uv run` from the `management/` directory
- **Backend**: Always use `uv run` from the `backend/` directory
- **Frontend**: Use `npm` from the `frontend/` directory
- **MCP Server**: Always use `uv run` from the `mcp_server/` directory. Requires backend API running.
- **Logs**: Check `logs/task_manager.log` (management), `logs/task_manager_backend.log` (backend), or `logs/task_manager_mcp.log` (MCP server)
- **Log level**: Configurable via `.env` in each module (INFO, DEBUG, WARNING, ERROR)
- **Architecture docs**: `specs/architecture/`

## Testing

```bash
# Management - Create and migrate
cd management
uv run python manage.py init --db test.db
uv run python manage.py migrate --db test.db

# Backend - Import check
cd backend
uv run python -c "from app.main import app; print('Backend OK')"

# Frontend - Build check
cd frontend
npm run build
```

## Logging

### Management Module
- File: `logs/task_manager.log`
- Each run marked with "NEW EXECUTION" timestamp separator
- Mode: Append

### Backend Module
- File: `logs/task_manager_backend.log`
- Configurable via `backend/.env`

### Frontend
- Browser console via `createLogger()` utility
- Color-coded, timestamped
- Level configurable via `VITE_LOG_LEVEL`

### MCP Server
- File: `logs/task_manager_mcp.log`
- Configurable via `mcp_server/.env`
