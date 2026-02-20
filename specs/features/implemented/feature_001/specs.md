# Technical Specifications — feature_001: Task Manager MVP

## Overview

Transform the existing "Portfolio Digital" project into a minimal "Task Manager" application. Replace the 28-table portfolio schema with a 4-table task management schema, strip all portfolio-specific business logic, and rebuild each module (management, backend, frontend, MCP server) with task-focused functionality while preserving the architectural skeleton.

**App Name:** Task Manager

---

## 1. Database Schema

### 1.1 New Schema (`db/schema.sql`)

Replace the entire existing schema with:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA cache_size = -8192;

-- Parametric table: valid estados for tareas
CREATE TABLE IF NOT EXISTS estados_tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Parametric table: valid estados for acciones
CREATE TABLE IF NOT EXISTS estados_acciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL
);

-- Core table: tareas
CREATE TABLE IF NOT EXISTS tareas (
    tarea_id TEXT PRIMARY KEY,
    tarea TEXT NOT NULL,
    responsable TEXT,
    descripcion TEXT,
    fecha_siguiente_accion TEXT,  -- ISO 8601 date (YYYY-MM-DD)
    tema TEXT,
    estado TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_actualizacion TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON tareas(responsable);
CREATE INDEX IF NOT EXISTS idx_tareas_tema ON tareas(tema);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);

-- Core table: acciones_realizadas
CREATE TABLE IF NOT EXISTS acciones_realizadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    estado TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_actualizacion TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tarea_id) REFERENCES tareas(tarea_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_acciones_tarea_id ON acciones_realizadas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_acciones_estado ON acciones_realizadas(estado);

-- Seed default estados_tareas
INSERT OR IGNORE INTO estados_tareas (valor, orden) VALUES
    ('Pendiente', 1),
    ('En Progreso', 2),
    ('Completada', 3),
    ('Cancelada', 4);

-- Seed default estados_acciones
INSERT OR IGNORE INTO estados_acciones (valor, orden) VALUES
    ('Pendiente', 1),
    ('En Progreso', 2),
    ('Completada', 3);
```

### 1.2 Design Decisions

- **tarea_id** is TEXT (not auto-increment) to support importing IDs from Excel.
- **fecha_siguiente_accion** stored as TEXT in ISO 8601 for SQLite compatibility (same pattern as old project).
- **fecha_creacion / fecha_actualizacion** added for audit trail (same pattern as old project).
- **ON DELETE CASCADE** on acciones → tareas: deleting a tarea removes its acciones.
- **Parametric tables** have `orden` for display ordering and `color` for optional UI badge coloring.
- Default seed values provided; can be extended via API or management CLI.

---

## 2. Management Module

### 2.1 Configuration (`.env`)

Retain existing logging/DB config patterns. Add new Excel source config. Remove old Excel workbook references.

```env
# Logging
LOG_LEVEL=INFO
LOG_FILE=task_manager.log

# Database
DATABASE_PATH=               # Empty = auto-detect ../db/task_manager.db

# Excel Source
EXCEL_SOURCE_DIR=excel_source
EXCEL_SOURCE_FILE=tareas.xlsx          # Excel file name for import
EXCEL_SHEET_TAREAS=Tareas              # Sheet name for tareas
EXCEL_SHEET_ACCIONES=Acciones          # Sheet name for acciones_realizadas

# Batch processing
BATCH_COMMIT_SIZE=100
```

### 2.2 CLI Commands (`manage.py`)

Retain the argparse CLI pattern. Replace old commands:

| Command | Description |
|---------|-------------|
| `init` | Create new SQLite DB + execute schema.sql |
| `recreate_tables` | Drop all tables + recreate from schema.sql |
| `migrate` | Import from Excel → SQLite (tareas + acciones) |
| `complete_process` | Full pipeline: recreate + migrate |

Remove: `validate`, `calculate_datos_relevantes`, `export_datos_relevantes`, `scan_documents`, `summarize_documentos`

### 2.3 Module Structure

```
management/src/
├── __init__.py
├── config/
│   ├── __init__.py
│   └── settings.py         # Load .env, validate config
├── core/
│   ├── __init__.py
│   ├── logging_config.py   # Keep as-is (rename log file)
│   └── data_quality.py     # Keep: normalize_date, normalize_multiline_text, detect_formula_error
├── init/
│   ├── __init__.py
│   └── db_init.py          # Keep: create_database, recreate_tables (remove PRESERVED_TABLES)
└── migrate/
    ├── __init__.py
    └── engine.py            # New: TareasMigrationEngine
```

Remove entirely: `calculate/`, `export/`, `validate/`, `scan/`, `summarize/`

### 2.4 Migration Engine

```python
class TareasMigrationEngine:
    def __init__(self, db_path, excel_dir):
        ...

    def migrate_all(self):
        """Full migration: tareas + acciones"""
        self.migrate_tareas()
        self.migrate_acciones()

    def migrate_tareas(self):
        """Read EXCEL_SHEET_TAREAS → insert into tareas table"""
        # Read Excel with pandas
        # Map columns: tarea_id, tarea, responsable, descripcion,
        #              fecha_siguiente_accion, tema, estado
        # Normalize dates via data_quality.normalize_date()
        # Normalize text via data_quality.normalize_multiline_text()
        # Insert in batches of BATCH_COMMIT_SIZE

    def migrate_acciones(self):
        """Read EXCEL_SHEET_ACCIONES → insert into acciones_realizadas table"""
        # Read Excel with pandas
        # Map columns: tarea_id, accion, estado
        # Validate tarea_id references exist
        # Insert in batches
```

Column mapping will be flexible — the engine reads headers and maps them via a configurable mapping dict in settings.py (allowing users to adapt to their Excel layout).

---

## 3. Backend API

### 3.1 Configuration (`.env`)

```env
LOG_LEVEL=INFO
LOG_FILE=task_manager_backend.log

API_PREFIX=/api/v1
API_TITLE=Task Manager API
API_VERSION=1.0.0

DATABASE_PATH=              # Empty = auto-detect ../db/task_manager.db
DATABASE_ECHO=false

CORS_ORIGINS=["http://localhost:5173"]

# Agent (optional, for future chat integration)
ANTHROPIC_API_KEY=
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.3
AGENT_MAX_TOOL_ROUNDS=10
AGENT_API_BASE_URL=http://localhost:8000/api/v1
```

### 3.2 SQLAlchemy Models (`models.py`)

Replace all 24 models with 4 new ones:

```python
class Tarea(Base):
    __tablename__ = "tareas"
    tarea_id = Column(Text, primary_key=True)
    tarea = Column(Text, nullable=False)
    responsable = Column(Text)
    descripcion = Column(Text)
    fecha_siguiente_accion = Column(Text)
    tema = Column(Text)
    estado = Column(Text)
    fecha_creacion = Column(Text)
    fecha_actualizacion = Column(Text)

class AccionRealizada(Base):
    __tablename__ = "acciones_realizadas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tarea_id = Column(Text, ForeignKey("tareas.tarea_id", ondelete="CASCADE"), nullable=False)
    accion = Column(Text, nullable=False)
    estado = Column(Text)
    fecha_creacion = Column(Text)
    fecha_actualizacion = Column(Text)

class EstadoTarea(Base):
    __tablename__ = "estados_tareas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
    color = Column(Text)

class EstadoAccion(Base):
    __tablename__ = "estados_acciones"
    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
    color = Column(Text)
```

### 3.3 Pydantic Schemas (`schemas.py`)

```python
# Search
class SearchFilter(BaseModel):
    field: str
    operator: str  # eq, ne, gt, gte, lt, lte, like, ilike, in, not_in, is_null, is_not_null
    value: Any = None

class SearchRequest(BaseModel):
    filters: list[SearchFilter] = []
    order_by: str | None = None
    order_dir: str = "asc"
    limit: int = 50
    offset: int = 0

class PaginatedResponse(BaseModel):
    total: int
    data: list[dict]
    limit: int
    offset: int

# Tareas
class TareaCreate(BaseModel):
    tarea_id: str
    tarea: str
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: str | None = None
    tema: str | None = None
    estado: str | None = None

class TareaUpdate(BaseModel):
    tarea: str | None = None
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: str | None = None
    tema: str | None = None
    estado: str | None = None

# Acciones
class AccionCreate(BaseModel):
    tarea_id: str
    accion: str
    estado: str | None = None

class AccionUpdate(BaseModel):
    accion: str | None = None
    estado: str | None = None

# Estados (parametric)
class EstadoCreate(BaseModel):
    valor: str
    orden: int = 0
    color: str | None = None

class EstadoUpdate(BaseModel):
    valor: str | None = None
    orden: int | None = None
    color: str | None = None
```

### 3.4 API Endpoints

#### Tareas Router (`routers/tareas.py`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tareas` | List tareas (paginated) |
| `GET` | `/tareas/{tarea_id}` | Get tarea by ID |
| `POST` | `/tareas` | Create tarea |
| `PUT` | `/tareas/{tarea_id}` | Update tarea |
| `DELETE` | `/tareas/{tarea_id}` | Delete tarea (cascades to acciones) |
| `POST` | `/tareas/search` | Search tareas with filters |
| `GET` | `/tareas/filter-options` | Get distinct values for filter dropdowns |

#### Acciones Router (`routers/acciones.py`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/acciones` | List all acciones (paginated) |
| `GET` | `/acciones/tarea/{tarea_id}` | Get acciones for a tarea |
| `GET` | `/acciones/{id}` | Get accion by ID |
| `POST` | `/acciones` | Create accion |
| `PUT` | `/acciones/{id}` | Update accion |
| `DELETE` | `/acciones/{id}` | Delete accion |

#### Estados Routers (`routers/estados.py`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/estados-tareas` | List all estados for tareas |
| `POST` | `/estados-tareas` | Create estado |
| `PUT` | `/estados-tareas/{id}` | Update estado |
| `DELETE` | `/estados-tareas/{id}` | Delete estado |
| `GET` | `/estados-acciones` | List all estados for acciones |
| `POST` | `/estados-acciones` | Create estado |
| `PUT` | `/estados-acciones/{id}` | Update estado |
| `DELETE` | `/estados-acciones/{id}` | Delete estado |

### 3.5 Files to Keep (adapted)

| File | Action |
|------|--------|
| `main.py` | Keep structure, update router imports (4 routers only), keep CORS + middleware + health check |
| `config.py` | Keep pattern, update settings for task manager |
| `database.py` | Keep as-is, update DB filename to `task_manager.db` |
| `crud.py` | Keep generic CRUDBase, remove calculated fields integration |
| `search.py` | Keep flexible search engine as-is |
| `schemas.py` | Replace with new schemas |
| `models.py` | Replace with 4 new models |
| `table_registry.py` | Update to 4 tables |

### 3.6 Files/Directories to Remove

- `calculated_fields/` — entirely (no calculated fields in new schema)
- `services/` — entirely (no transaction processing, Excel write-back)
- `agent/` — keep structure but simplify tools to task-focused
- `charts/` — remove (not needed for MVP)
- All old routers in `routers/` — replace with 3 new router files
- `router_factory.py` — remove (only 3 routers, no need for factory)

### 3.7 Agent Module

Keep the agent module but adapt for task management:

**Tools (simplified to 4):**

| Tool | Description |
|------|-------------|
| `buscar_tareas` | Search tareas with filters |
| `obtener_tarea` | Get tarea details + acciones |
| `listar_estados` | List parametric estados (tareas + acciones) |
| `buscar_acciones` | Search acciones by tarea or globally |

Keep: `orchestrator.py`, `config.py`, `api_client.py` (adapt URLs), `system_prompt.py` (rewrite for task context), `tools_definition.py` (new 4 tools), `tools_executor.py` (adapt)

---

## 4. Frontend

### 4.1 Configuration (`.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Task Manager
```

Remove: `VITE_DASHBOARD_TOP_VALUE_THRESHOLD`, `VITE_DASHBOARD_RECENT_DAYS`

### 4.2 Routes (`App.jsx`)

| Route | Access | Page | Description |
|-------|--------|------|-------------|
| `/` | Public | LandingPage | Rebranded for Task Manager + changelog |
| `/sign-in` | Public | Clerk SignIn | |
| `/sign-up` | Public | Clerk SignUp | |
| `/search` | Private | SearchPage | Task search with filters |
| `/detail/:tarea_id` | Private | DetailPage | Tarea detail + acciones CRUD |
| `/chat` | Private | ChatPage | AI assistant (adapted) |
| `*` | — | NotFoundPage | 404 |

Remove routes: `/dashboard`, `/informes/*`, `/register`, `/jobs`, `/parametricas`

### 4.3 Landing Page

Recreate `features/landing/LandingPage.jsx` for Task Manager:

- **HeroSection**: New branding — "Task Manager" title, description about task tracking, CTA buttons
- **ChangelogSection**: Keep exactly as-is (reads from `lib/changelog.js`)
- Remove: AboutSection, FeaturesSection, AnalyticsSection, ProblemSection, ProcessSection, SecuritySection, PricingSection (can be re-added later)
- Remove: useOverviewStats hook (no stats endpoint)

### 4.4 Search Page

Adapt `features/search/SearchPage.jsx`:

**Filters:**
- `tarea_id` — text input
- `tarea` — text input (ilike search)
- `responsable` — dropdown (from filter-options)
- `tema` — dropdown (from filter-options)
- `estado` — dropdown (from estados_tareas parametric table)
- `fecha_siguiente_accion` — date range

**Columns (default):**
- tarea_id, tarea, responsable, tema, estado, fecha_siguiente_accion

**Features to keep:**
- Server-side sorting + pagination
- ColumnConfigurator (drag-and-drop)
- Export (TSV, CSV, JSON, Excel)
- Filter chips
- Row click → navigate to detail

**Features to remove:**
- Saved searches (simplify for MVP)
- Favorites
- Card grid view (table only for MVP)
- GroupBySelector
- LtpModal
- InitiativeDrawer (replace with simple row click → detail)

### 4.5 Detail Page

Simplify `features/detail/DetailPage.jsx`:

**Sections:**
1. **Tarea Info** — Key-value display of tarea fields + edit button
2. **Acciones Realizadas** — Table of acciones with create/edit/delete

**Features to keep:**
- SectionAccordion pattern
- EntityFormModal (for editing tarea and creating/editing acciones)
- DetailHeader (adapted: show tarea_id, tarea title, estado badge)

**Features to remove:**
- All 20+ portfolio-specific sections
- DetailNav sidebar (only 2 sections)
- MobileDetailNav
- SectionHistoryModal
- All section-specific components
- Related Initiatives, Activity Timeline
- Importes table

### 4.6 Chat Page

Keep `features/chat/` as-is but update:
- System prompt context (task manager, not portfolio)
- Tool step rendering (adapted tool names)

### 4.7 Components to Keep

**`components/ui/`** — Keep all 18 components as-is:
- button, badge, card, skeleton, tooltip, input, label, checkbox, datepicker, currency-input, select, multi-select, combobox, dialog, dropdown-menu, sheet, accordion, collapsible, confirm-dialog

**`components/layout/`** — Keep and adapt:
- `Layout.jsx` — Keep structure
- `Navbar.jsx` — Simplify: remove Informes dropdown, remove Admin dropdown, keep Dashboard → Search, keep theme toggle, keep user button
- `Footer.jsx` — Keep as-is
- Remove: `GlobalSearch.jsx` (simplify for MVP)

**`components/shared/`** — Keep:
- `ProtectedRoute.jsx` — as-is
- `ErrorBoundary.jsx` — as-is
- `ColumnConfigurator.jsx` + `SortableColumnItem.jsx` — as-is
- `NotFoundPage.jsx` — as-is
- `EmptyState.jsx` — as-is
- `EstadoTag.jsx` — adapt for task estados
- Skeletons: `SearchSkeleton.jsx`, `DetailSkeleton.jsx`

**`components/shared/`** — Remove:
- `InitiativeDrawer.jsx`
- `CurrencyCell.jsx`
- `ConsoleDialog.jsx`
- `JsonViewerModal.jsx`
- `SummaryViewerModal.jsx`
- `SidebarNav.jsx`
- `Breadcrumb.jsx` (optional: keep if wanted)
- Skeletons: `DashboardSkeleton.jsx`, `ReportSkeleton.jsx`

**`components/theme/`** — Keep all as-is (ThemeProvider, ModeToggle, ColorThemeProvider, ColorThemeSelector)

### 4.8 Libraries to Keep

| File | Action |
|------|--------|
| `lib/utils.js` | Keep `cn()`. Remove currency formatters (not needed for MVP) |
| `lib/logger.js` | Keep as-is |
| `lib/storage.js` | Keep as-is |
| `lib/version.js` | Reset to `{ major: 1, minor: 1 }` |
| `lib/changelog.js` | Reset array: single entry for v1.001 (Task Manager MVP) |
| `lib/estadoOrder.js` | Replace with task estados order |

Remove: `lib/estadoColors.js`, `lib/badgeColors.js`, `lib/themes.js`, `lib/routeMeta.js`, `lib/sharepoint.js`

### 4.9 Providers

Keep all providers:
- `Providers.jsx` — Keep full stack (Clerk, Theme, Query, Chat, Toaster)
- `QueryProvider.jsx` — Keep as-is

### 4.10 Hooks

Keep: `usePageTitle.js`
Remove: `useParametroColors.js`

### 4.11 Features to Remove

- `features/dashboard/` — entirely
- `features/reports/` — entirely
- `features/parametricas/` — entirely (estados managed via API directly for now)
- `pages/RegisterPage.jsx`, `pages/JobsPage.jsx`

---

## 5. MCP Server

### 5.1 Configuration (`.env`)

```env
API_BASE_URL=http://localhost:8000/api/v1
API_TIMEOUT=30
LOG_LEVEL=INFO
LOG_FILE=task_manager_mcp.log
MAX_QUERY_ROWS=500
DEFAULT_QUERY_ROWS=50
MCP_TRANSPORT=stdio
MCP_HOST=0.0.0.0
MCP_PORT=8001
```

Remove chart configuration (no charts for MVP).

### 5.2 Module Structure

```
mcp_server/src/mcp_portfolio/   → rename package to mcp_tareas/
├── __init__.py
├── __main__.py
├── server.py                # FastMCP "Task Manager"
├── api_client.py            # Simplified: search, get, list
├── config.py                # Updated settings
├── logging_config.py        # Keep as-is (update log file name)
├── table_metadata.py        # 4 tables only
└── tools/
    ├── __init__.py
    ├── busqueda.py          # buscar_tareas, buscar_acciones
    ├── detalle.py           # obtener_tarea (tarea + acciones)
    └── esquema.py           # listar_tablas, describir_tabla, obtener_valores_campo
```

Remove: `tools/agregacion.py`, `tools/sql_query.py`, `tools/visualizacion.py`, `charts/`

### 5.3 MCP Tools (6 tools)

| Tool | Description |
|------|-------------|
| `buscar_tareas` | Search tareas with filters (POST /tareas/search) |
| `buscar_acciones` | Get acciones for a tarea (GET /acciones/tarea/{tarea_id}) |
| `obtener_tarea` | Get full tarea details + its acciones |
| `listar_tablas` | List available tables with descriptions |
| `describir_tabla` | Get column metadata for a table |
| `obtener_valores_campo` | Get distinct values for a field (filter options) |

---

## 6. Code Cleanup Summary

### Remove Entirely
- `management/src/calculate/`
- `management/src/export/`
- `management/src/validate/`
- `management/src/scan/`
- `management/src/summarize/`
- `backend/app/calculated_fields/`
- `backend/app/services/`
- `backend/app/charts/`
- `backend/app/router_factory.py`
- All old routers in `backend/app/routers/`
- `mcp_server/src/mcp_portfolio/charts/`
- `frontend/src/features/dashboard/`
- `frontend/src/features/reports/`
- `frontend/src/features/parametricas/`
- `frontend/src/pages/`

### Adapt
- `management/manage.py` — new commands
- `management/src/config/settings.py` — new config vars
- `management/src/migrate/engine.py` — new migration engine
- `backend/app/main.py` — new routers
- `backend/app/models.py` — new models
- `backend/app/schemas.py` — new schemas
- `backend/app/crud.py` — simplify (remove calculated fields)
- `backend/app/agent/` — new tools and prompts
- `frontend/src/App.jsx` — new routes
- `frontend/src/features/landing/` — rebrand
- `frontend/src/features/search/` — adapt for tareas
- `frontend/src/features/detail/` — simplify for tareas + acciones
- `mcp_server/` — new tools and metadata

### Keep As-Is
- `frontend/src/components/ui/*`
- `frontend/src/components/theme/*`
- `frontend/src/components/layout/Layout.jsx`, `Footer.jsx`
- `frontend/src/lib/logger.js`, `storage.js`
- `frontend/src/providers/*`
- `frontend/src/api/client.js`
- Logging infrastructure across all modules
- `.env` pattern across all modules

---

## 7. Documentation Updates

### 7.1 `CLAUDE.md`
Complete rewrite describing:
- New project name and purpose
- 4-table schema
- Management CLI (4 commands)
- Backend API (4 routers)
- Frontend (Landing + Search + Detail + Chat)
- MCP server (6 tools)
- Development setup and running instructions

### 7.2 `README.md`
Complete rewrite with:
- Task Manager project description
- Quick start guide
- Module descriptions
- Database schema
- API endpoints summary

### 7.3 `specs/architecture/architecture_backend.md`
Rewrite for:
- 4 models, 4 routers
- Simplified CRUD + search
- Agent module with 4 tools
- No calculated fields, no transaction processing

### 7.4 `specs/architecture/architecture_frontend.md`
Rewrite for:
- 4 routes (Landing, Search, Detail, Chat)
- Simplified search with task filters
- Detail with 2 sections (tarea info + acciones)
- Preserved component library

### 7.5 DB Filename
Rename from `portfolio.db` to `task_manager.db` in all configuration defaults.
