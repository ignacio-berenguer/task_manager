# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio Digital — a full-stack portfolio management system for IT initiatives. The system consolidates data from 5 Excel workbooks (~90,000 rows across 30+ sheets) into a normalized SQLite database, exposes it through a REST API, and provides a rich web application with dashboards, search, reports, and detail views.

**Four Modules:**

| Module | Technology | Purpose |
|--------|-----------|---------|
| `management/` | Python 3.12 + pandas | CLI tool: Excel-to-SQLite migration, calculation, validation, export |
| `backend/` | Python 3.12 + FastAPI + SQLAlchemy | REST API with CRUD, flexible search, reports, calculated fields |
| `frontend/` | React 19 + Vite + Tailwind CSS | SPA with dashboard, search, 6 report pages, initiative detail |
| `mcp_server/` | Python 3.12 + MCP SDK + httpx | MCP server for AI agents: read-only portfolio access via 11 tools |

**Shared Resources:**
- `db/` — SQLite database + schema DDL
- `logs/` — Centralized log directory (all modules)
- `specs/` — Technical specifications, architecture docs, feature specs

## Setup and Running

### Management (Migration CLI)

```bash
cd management
uv sync
uv run python manage.py complete_process                  # Full pipeline: recreate + migrate + calculate + export + scan
uv run python manage.py init                               # Create .db file + schema
uv run python manage.py recreate_tables                    # Drop all tables, recreate from schema.sql
uv run python manage.py migrate                            # Excel → SQLite
uv run python manage.py validate                           # Check data quality
uv run python manage.py calculate_datos_relevantes         # Compute datos_relevantes table
uv run python manage.py export_datos_relevantes            # Export to Excel
uv run python manage.py scan_documents                     # Scan folders → documentos table
uv run python manage.py summarize_documentos               # LLM summarize pending documents
uv run python manage.py summarize_documentos --portfolio-ids SPA_25_11,SPA_25_12  # Filter by portfolio
uv run python manage.py summarize_documentos --reprocess   # Reprocess all (not just Pendiente)
uv run python manage.py summarize_documentos --json-output-to-console  # Print colored JSON to console
uv run python manage.py migrate --db custom.db             # Custom database path
```

**Dependencies:** pandas, openpyxl (managed via `uv`)

### Backend (FastAPI API)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

**Dependencies:** fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings, python-dotenv

### Frontend (React SPA)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
```

**Key dependencies:** React 19, react-router-dom 6, @tanstack/react-query 5, @tanstack/react-table 8, @dnd-kit (drag-and-drop), recharts, @clerk/clerk-react, tailwindcss 4, xlsx, lucide-react

### MCP Server (AI Agent Interface)

**Prerequisite:** Backend API must be running on port 8000.

```bash
cd mcp_server
uv sync
uv run -m mcp_portfolio                                    # Start (stdio mode)
MCP_TRANSPORT=sse uv run -m mcp_portfolio                   # Start (SSE mode, port 8001)
```

**11 MCP tools** (all in Spanish): buscar_iniciativas, buscar_en_tabla, obtener_iniciativa, obtener_documentos, contar_iniciativas, totalizar_importes, listar_tablas, describir_tabla, obtener_valores_campo, ejecutar_consulta_sql, generar_grafico.

**Dependencies:** mcp[cli], httpx, python-dotenv

## Project Structure

```
portfolio_migration/
├── management/                      # Migration CLI tool
│   ├── manage.py                    # CLI entry point (9 commands)
│   ├── .env / .env.example          # Configuration
│   ├── src/
│   │   ├── core/                    # logging_config.py, data_quality.py
│   │   ├── config/                  # settings.py (loads .env)
│   │   ├── init/                    # db_init.py
│   │   ├── migrate/                 # engine.py, excel_readers.py
│   │   ├── calculate/               # engine.py, estado_functions.py, importe_functions.py, lookup_functions.py, helper_functions.py
│   │   ├── export/                  # excel_export.py
│   │   └── validate/                # validator.py
│   ├── excel_source/                # Excel workbooks (gitignored)
│   └── excel_output/                # Excel output (gitignored)
│
├── db/
│   ├── schema.sql                   # Complete DDL (28 tables)
│   └── portfolio.db                 # SQLite database (gitignored)
│
├── backend/                         # FastAPI REST API
│   ├── app/
│   │   ├── main.py                  # Entry point + CORS + router registration
│   │   ├── config.py                # Environment config
│   │   ├── database.py              # SQLite connection
│   │   ├── models.py                # 24 SQLAlchemy ORM models
│   │   ├── calculated_fields/        # On-the-fly computed fields (~51 fields)
│   │   │   ├── __init__.py          # Module exports
│   │   │   ├── definitions.py       # Field mappings & metadata (FIELD_CALCULATORS)
│   │   │   ├── lookup.py            # Lookup functions (datos_descriptivos, datos_relevantes, informacion_economica)
│   │   │   ├── cache.py             # LookupCache for batch processing
│   │   │   ├── estado.py            # Estado/justification calculation functions
│   │   │   ├── utils.py             # Utility calculations (debe_tener, grupo_importes)
│   │   │   └── service.py           # CalculatedFieldService orchestrator
│   │   ├── schemas.py               # Pydantic validation schemas
│   │   ├── crud.py                  # Reusable CRUD operations
│   │   ├── search.py                # Flexible search with operators
│   │   ├── router_factory.py        # Generic CRUD router factory (12 routers use this)
│   │   ├── table_registry.py        # TABLE_MODELS mapping
│   │   ├── services/
│   │   │   ├── transaction_processor.py  # JSON diff processor
│   │   │   ├── excel_mapping.py          # DB-to-Excel field mapping config
│   │   │   └── excel_writer.py           # Excel write-back via xlwings
│   │   └── routers/                 # 25 API endpoint files
│   ├── pyproject.toml
│   └── .env                         # Configuration (gitignored)
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── api/client.js            # Axios + Clerk JWT interceptors
│   │   ├── components/
│   │   │   ├── ui/                  # Base components (Button, Dialog, MultiSelect, etc.)
│   │   │   ├── layout/              # Navbar, Footer, Layout
│   │   │   ├── theme/               # ThemeProvider, ModeToggle
│   │   │   └── shared/              # ProtectedRoute, ColumnConfigurator, ErrorBoundary, NotFoundPage
│   │   ├── features/
│   │   │   ├── landing/             # Public marketing page (8 sections)
│   │   │   ├── dashboard/           # KPIs, charts, filters, sidebar nav
│   │   │   ├── search/              # Initiative search + data grid + export
│   │   │   ├── reports/             # 6 report pages (GenericReportPage pattern)
│   │   │   └── detail/              # Initiative detail (20 accordion sections, CRUD)
│   │   ├── lib/                     # estadoOrder.js, logger.js, storage.js, utils.js
│   │   └── providers/               # QueryProvider, combined Providers
│   ├── .env / .env.example
│   ├── package.json
│   └── vite.config.js
│
├── mcp_server/                      # MCP server for AI agents
│   ├── pyproject.toml               # mcp[cli], httpx, python-dotenv
│   ├── .env / .env.example          # Configuration
│   └── src/mcp_portfolio/           # Server + 11 MCP tools
│       ├── server.py                # FastMCP instance + entry point
│       ├── api_client.py            # HTTP client for FastAPI backend
│       ├── table_metadata.py        # Table descriptions + search capabilities
│       └── tools/                   # busqueda, detalle, agregacion, esquema
│
├── logs/                            # Centralized logs (gitignored)
├── specs/
│   ├── specs.md                     # Core technical specifications
│   ├── architecture/                # Architecture documents
│   │   ├── architecture_management.md
│   │   ├── architecture_backend.md
│   │   ├── architecture_frontend.md
│   │   └── architecture_mcp_server.md
│   └── features/                    # Feature specs
│       ├── feature_NNN/             # Active features (in progress)
│       └── implemented/             # Completed features (feature_001–feature_027)
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

**28 Tables** with `portfolio_id` (TEXT) as the consistent primary key across workbooks:

| Category | Tables | Rows |
|----------|--------|------|
| Core | iniciativas, grupos_iniciativas | 832, 55 |
| Descriptive | datos_descriptivos | 837 |
| Financial | informacion_economica, facturacion | 812, 127 |
| Operational | datos_ejecucion, hechos | 211, 3,530 |
| Benefits | beneficios (current only, excludes snapshots) | 26,568 |
| Supporting | etiquetas, justificaciones, ltp, wbes, dependencias | 7,278 / 689 / 95 / 122 |
| Additional | notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt | various |
| Fichas | fichas | 7,787 |
| Computed | datos_relevantes (60+ calculated columns) | ~837 |
| Documents | documentos, documentos_items | variable |
| Parametric | parametros, etiquetas_destacadas | variable |
| Audit | migracion_metadata, transacciones, transacciones_json | ~9,000 |

## Backend API

### Endpoints

**Standard CRUD** (all 28 tables):
- `GET /api/v1/{table}` — List (paginated, limit/offset)
- `GET /api/v1/{table}/{id}` — Get by ID
- `POST /api/v1/{table}` — Create
- `PUT /api/v1/{table}/{id}` — Update
- `DELETE /api/v1/{table}/{id}` — Delete

**Flexible Search** (8 key tables — datos-relevantes, iniciativas, hechos, datos-descriptivos, etiquetas, acciones, ltp, informacion-economica):
```json
POST /api/v1/{table}/search
{
  "filters": [{"field": "nombre", "operator": "ilike", "value": "%digital%"}],
  "order_by": "fecha_inicio", "order_dir": "desc",
  "limit": 100, "offset": 0
}
```
Operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `is_null`, `is_not_null`

**Report Endpoints** (6 reports, each has filter-options GET + search POST):
- `/hechos/report-hechos-filter-options` + `/hechos/search-report-hechos`
- `/ltp/report-ltps-filter-options` + `/ltp/search-report-ltps`
- `/acciones/report-acciones-filter-options` + `/acciones/search-report-acciones`
- `/etiquetas/report-etiquetas-filter-options` + `/etiquetas/search-report-etiquetas`
- `/transacciones/report-transacciones-filter-options` + `/transacciones/search-report-transacciones`
- `/transacciones-json/report-filter-options` + `/transacciones-json/search-report`

**Cross-Table**:
- `GET /api/v1/portfolio/{pid}` — All data for a portfolio_id
- `POST /api/v1/portfolio/search` — Multiple portfolio_ids with table selection

**Transaction Processing**:
- `POST /api/v1/transacciones-json/process` — Apply JSON diffs to database
- `POST /api/v1/transacciones-json/process-excel` — Trigger async Excel write-back
- `GET /api/v1/transacciones-json/process-excel-status` — Poll Excel processing status
- `GET /api/v1/transacciones-json/by-portfolio/{pid}` — Get JSON transactions for a portfolio

### Calculated Fields

~51 calculated fields across 19 tables are computed on-the-fly by the `calculated_fields/` module and injected into API responses via `model_to_dict_with_calculated()`. Uses `LookupCache` for batch processing to avoid N+1 queries. API response shape unchanged for consumers.

### Configuration (.env)

```env
LOG_LEVEL=INFO
LOG_FILE=portfolio_backend.log
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
API_PREFIX=/api/v1
API_TITLE=Portfolio Digital API
API_VERSION=1.0.0
DATABASE_PATH=              # Empty = auto-detect relative to project root
DATABASE_ECHO=false         # Set to true to log SQL queries
CORS_ORIGINS=["http://localhost:5173"]
EXCEL_SOURCE_DIR=../management/excel_source  # Path to Excel source files for write-back
```

## Frontend Application

### Routes

| Route | Access | Page | Description |
|-------|--------|------|-------------|
| `/` | Public | LandingPage | Marketing page with 8 sections |
| `/sign-in`, `/sign-up` | Public | Clerk auth | Authentication |
| `/dashboard` | Private | DashboardPage | KPIs, 12 charts, filters, sidebar nav |
| `/search` | Private | SearchPage | Flexible search + configurable data grid + export |
| `/informes/hechos` | Private | ReportPage | Hechos by date range + portfolio data |
| `/informes/ltps` | Private | GenericReportPage | LTPs by responsable/estado |
| `/informes/acciones` | Private | GenericReportPage | Acciones with date/estado filters |
| `/informes/etiquetas` | Private | GenericReportPage | Etiquetas search |
| `/informes/transacciones` | Private | GenericReportPage | Transaction audit trail |
| `/informes/transacciones-json` | Private | GenericReportPage | JSON diffs + process button |
| `/detail/:portfolio_id` | Private | DetailPage | 20 data sections with CRUD |

### Dashboard

- **4 KPI cards**: Total initiatives, Budget (year), Approved, In Execution
- **6 chart pairs** (12 cards): Priorizacion, Unidad, Framework, Cluster, Estado — each showing count and importe
- **2 list cards**: Top value initiatives, Recent changes
- **9 filters**: Year, Digital Framework, Unidad, Cluster, Estado, Previstas, Cerrada Econ., Excl. Canceladas, Excl. EPTs
- **Sidebar navigation**: Sticky left sidebar (xl+ screens) with section links
- **Chart navigation**: Double-click bar → Search page with pre-populated filters

### Search Page

- **9 filter criteria**: Portfolio ID, Nombre, Digital Framework, Unidad, Estado, Cluster, Tipo, Etiquetas, Cerrada Economicamente
- **Configurable grid**: 60+ available columns with drag-and-drop reordering (ColumnConfigurator)
- **Export**: TSV, CSV, JSON, Excel
- **Server-side sorting and pagination** (25/50/100/200 rows)
- **All preferences persisted** to localStorage

### Reports (6 pages)

All use `GenericReportPage` pattern (except Hechos which has custom implementation):
- Configurable columns with drag-and-drop reordering
- Server-side pagination and sorting
- Per-report localStorage persistence
- Data-driven filter panels

### Detail Page

- **18 accordion sections** showing all related data for an initiative
- **CRUD operations** on Notas via `transacciones_json` table (create, edit, delete)
- **Importes table**: Budget, SM200, Aprobado, CITETIC, Facturacion, Importe by year (2024–2028)
- **Links**: portfolio_id links to detail page throughout the app

### Key Frontend Patterns

**Route-Based Code Splitting** (`src/App.jsx`):
- All protected routes use `React.lazy()` + `Suspense` for on-demand loading
- Vendor chunks split in `vite.config.js`: react, tanstack, clerk, recharts
- `ErrorBoundary` wraps each protected route for graceful error handling
- 404 catch-all route renders `NotFoundPage`

**Column Configurator** (`src/components/shared/ColumnConfigurator.jsx`):
- Dialog with drag-and-drop visible columns (top) + categorized available columns (bottom)
- Uses `@dnd-kit/core` + `@dnd-kit/sortable`
- Shared across Search and all Report pages
- Column order persisted in the `columns` array in localStorage

**Shared localStorage Utility** (`src/lib/storage.js`):
- `createStorage(prefix)` factory creates namespaced storage interfaces
- Used by searchStorage, reportStorage, filterStorage
- Methods: `saveJSON`, `loadJSON`, `saveString`, `loadString`, `loadInt`, `remove`

**Estado Workflow Order** (`src/lib/estadoOrder.js`):
- All estado dropdowns use canonical workflow order, NOT alphabetical
- Applies to Dashboard, Search, and all Report filter panels

**Cross-Page Navigation** (React Router `location.state`):
- Dashboard → Search: passes filter criteria on chart double-click
- Dashboard → Hechos Report: passes date/dimension filters

**Authentication**: Clerk (JWT tokens auto-injected via Axios interceptors)

**Logging**: `createLogger('ContextName')` → browser console, color-coded + timestamped

### Frontend Configuration (.env)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Portfolio Digital
VITE_DASHBOARD_TOP_VALUE_THRESHOLD=1000000
VITE_DASHBOARD_RECENT_DAYS=7
```

## Key Implementation Details

### Naming Convention

- **Spanish column names** with accents removed (Ano → anio, Descripcion → descripcion)
- Lowercase with underscores: fecha_inicio, portfolio_id

### Data Quality Handling

- **Dates**: Excel serial → ISO 8601; invalid → NULL + fecha_XXX_valida = 0
- **Formula errors**: #REF!, #N/A → NULL, logged
- **Currency**: REAL rounded to 2 decimals
- **Text**: CRLF normalization

### Computed Table: datos_relevantes

Consolidates data from multiple tables into a single denormalized view per initiative (60+ columns):
- **Lookups**: 17 from datos_descriptivos + informacion_economica
- **Estado functions**: estado_iniciativa, estado_aprobacion, estado_ejecucion, etc.
- **Importe functions**: budget, SM200, aprobado, facturado for years 2024–2028
- **Date functions**: fecha_sm100, fecha_aprobada_con_cct, fecha_en_ejecucion
- **Performance**: All reference data preloaded into memory caches (~8 bulk SQL queries instead of ~35K per-row queries)

See `specs/features/implemented/feature_002/specs.md` for complete specifications.

## Custom Claude Code Skills

Four custom skills are available in `.claude/skills/`:

| Skill | Command | Description |
|-------|---------|-------------|
| create_feature | `/create_feature <description>` | Scaffolds `specs/features/feature_NNN/requirements.md` with next available number |
| plan_feature | `/plan_feature feature_NNN` | Plans a feature that has requirements.md ready |
| develop_feature | `/develop_feature feature_NNN` | Implements feature from specs & plan, creates task list, implements step by step |
| close_feature | `/close_feature feature_NNN` | Verifies docs are updated, moves to `implemented/`, commits + pushes |

## Critical Development Notes

### FastAPI Route Ordering
**Static routes MUST be defined before dynamic path parameter routes** in routers. E.g., `GET /report-hechos-filter-options` must come before `GET /{id}`. FastAPI attempts the dynamic match first and returns 422 rather than falling through.

### Estado Workflow Order
All `estado` dropdowns across the app must use the canonical order from `src/lib/estadoOrder.js`, NOT alphabetical. This applies to dashboard filters, search filters, and all report filter panels with `sortByEstado: true`.

### PRESERVED_TABLES — Data Protection
The `PRESERVED_TABLES` list in `management/src/init/db_init.py` protects tables from being emptied during `recreate_tables`. Currently protected: `transacciones_json`. The `documentos` table is now migrated from Excel during the migration process. Only the `init` command (which deletes the entire .db file) destroys all data.

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
- **Logs**: Check `logs/portfolio_migration.log` (management), `logs/portfolio_backend.log` (backend), or `logs/portfolio_mcp.log` (MCP server)
- **Log level**: Configurable via `.env` in each module (INFO, DEBUG, WARNING, ERROR)
- **Architecture docs**: `specs/architecture/architecture_management.md`, `specs/architecture/architecture_backend.md`, `specs/architecture/architecture_frontend.md`, `specs/architecture/architecture_mcp_server.md`

## Testing

```bash
# Management - Full pipeline
cd management
uv run python manage.py complete_process --db test.db

# Management - Step by step
uv run python manage.py init --db test.db
uv run python manage.py migrate --db test.db
uv run python manage.py validate --db test.db
uv run python manage.py calculate_datos_relevantes --db test.db
uv run python manage.py export_datos_relevantes --db test.db

# Management - Test imports
uv run python -c "from src.core import setup_logging; print('Core OK')"
uv run python -c "from src.migrate import migrate_all; print('Migrate OK')"
uv run python -c "from src.calculate import main; print('Calculate OK')"

# Frontend - Build check
cd frontend
npm run build
```

## Logging

### Management Module
- File: `logs/portfolio_migration.log`
- Six module loggers: portfolio_main, portfolio_init, portfolio_migration, portfolio_validate, portfolio_calculate, portfolio_export
- Each run marked with "NEW EXECUTION" timestamp separator
- Mode: Append

### Backend Module
- File: `logs/portfolio_backend.log`
- Configurable via `backend/.env`

### Frontend
- Browser console via `createLogger()` utility
- Color-coded, timestamped
- Level configurable via `VITE_LOG_LEVEL`
