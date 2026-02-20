# Implementation Plan — feature_001: Task Manager MVP

## Phased Approach

The implementation is organized in 8 phases, working bottom-up (database → backend → frontend → MCP → docs). Each phase is designed to produce a testable milestone.

---

## Phase 1: Database Schema

**Goal:** Replace the old 28-table schema with the new 4-table task manager schema.

### Steps:

1.1. **Replace `db/schema.sql`** with the new schema containing:
   - `estados_tareas` (parametric)
   - `estados_acciones` (parametric)
   - `tareas` (core)
   - `acciones_realizadas` (core)
   - Indexes on key fields
   - Default seed data for estados

1.2. **Delete `db/portfolio.db`** (if present, it's gitignored) — the old DB is incompatible with the new schema.

**Validation:** Review schema.sql syntax manually.

---

## Phase 2: Management Module

**Goal:** Simplify the CLI to init + migrate for tareas/acciones from Excel.

### Steps:

2.1. **Update `management/src/config/settings.py`**:
   - Replace old Excel workbook references with new settings: `EXCEL_SOURCE_FILE`, `EXCEL_SHEET_TAREAS`, `EXCEL_SHEET_ACCIONES`
   - Update `DATABASE_PATH` default to `task_manager.db`
   - Update `LOG_FILE` default to `task_manager.log`
   - Remove settings for: datos_relevantes export, documentos, document scanner, LLM, etc.
   - Update `validate_config()` to validate new settings only

2.2. **Update `management/src/core/logging_config.py`**:
   - Update logger names from `portfolio_*` to `task_manager_*`
   - Keep the same logging infrastructure

2.3. **Update `management/src/core/data_quality.py`**:
   - Keep: `normalize_date()`, `normalize_multiline_text()`, `detect_formula_error()`, `normalize_portfolio_id()` (rename to `normalize_id()`)
   - Remove: `normalize_currency()`, `normalize_boolean()`, `remove_accents()` (not needed for new schema)
   - Or: keep all functions as utility — they don't hurt to have

2.4. **Update `management/src/init/db_init.py`**:
   - Keep `create_database()` and `recreate_tables()` functions
   - Remove `PRESERVED_TABLES` (no tables need preservation in new project)
   - Update schema path and DB name references

2.5. **Rewrite `management/src/migrate/engine.py`**:
   - New `TareasMigrationEngine` class
   - `migrate_tareas()`: read Excel sheet → normalize → insert into `tareas`
   - `migrate_acciones()`: read Excel sheet → normalize → insert into `acciones_realizadas`
   - Column mapping configured in settings or as constants in engine
   - Batch insert with BATCH_COMMIT_SIZE
   - Logging per table: rows read, rows inserted, errors

2.6. **Remove `management/src/migrate/excel_readers.py`** (old workbook-specific readers)

2.7. **Delete old modules entirely**:
   - `management/src/calculate/` (all files)
   - `management/src/export/` (all files)
   - `management/src/validate/` (all files)
   - `management/src/scan/` (all files)
   - `management/src/summarize/` (all files)

2.8. **Rewrite `management/manage.py`**:
   - Keep argparse structure
   - 4 commands: `init`, `recreate_tables`, `migrate`, `complete_process`
   - Remove old commands
   - Update imports
   - Keep session marker logging

2.9. **Update `management/.env.example`** with new settings

2.10. **Update `management/pyproject.toml`**:
   - Remove dependencies: `anthropic`, `pymupdf`, `python-docx` (not needed for MVP)
   - Keep: `pandas`, `openpyxl`, `python-dotenv`
   - Rename project to `task-manager-migration`

**Validation:** `uv run python manage.py init --db test.db` should create DB with 4 tables.

---

## Phase 3: Backend — Models, Schemas, Core

**Goal:** Replace old models/schemas with new task manager entities.

### Steps:

3.1. **Rewrite `backend/app/models.py`**:
   - 4 models: `Tarea`, `AccionRealizada`, `EstadoTarea`, `EstadoAccion`
   - Remove all 24 old models

3.2. **Rewrite `backend/app/schemas.py`**:
   - Keep: `SearchFilter`, `SearchRequest`, `PaginatedResponse`
   - Add: `TareaCreate`, `TareaUpdate`, `AccionCreate`, `AccionUpdate`, `EstadoCreate`, `EstadoUpdate`
   - Remove all old entity schemas

3.3. **Update `backend/app/table_registry.py`**:
   - 4 table mappings: `tareas`, `acciones_realizadas`, `estados_tareas`, `estados_acciones`

3.4. **Simplify `backend/app/crud.py`**:
   - Keep `CRUDBase` generic class
   - Remove `model_to_dict_with_calculated()` and `batch_model_to_dict_with_calculated()`
   - Keep `model_to_dict()` as simple dict conversion
   - Remove calculated fields imports

3.5. **Keep `backend/app/search.py`** as-is (generic, works with any model)

3.6. **Update `backend/app/database.py`**:
   - Update default DB path from `portfolio.db` to `task_manager.db`

3.7. **Update `backend/app/config.py`**:
   - Update defaults: `API_TITLE`, `LOG_FILE`
   - Remove chart/Excel-specific settings
   - Keep agent settings

3.8. **Delete `backend/app/router_factory.py`** (not needed with only 3 routers)

3.9. **Delete directories**:
   - `backend/app/calculated_fields/`
   - `backend/app/services/`
   - `backend/app/charts/`

**Validation:** `uv run python -c "from app.models import Tarea; print('OK')"` should work.

---

## Phase 4: Backend — Routers & API

**Goal:** Create the new API endpoints for tareas, acciones, and estados.

### Steps:

4.1. **Delete all old routers** in `backend/app/routers/` except `agent.py`

4.2. **Create `backend/app/routers/tareas.py`**:
   - CRUD endpoints (list, get, create, update, delete)
   - POST `/tareas/search` — flexible search
   - GET `/tareas/filter-options` — distinct values for responsable, tema, estado
   - Static routes before dynamic routes

4.3. **Create `backend/app/routers/acciones.py`**:
   - CRUD endpoints
   - GET `/acciones/tarea/{tarea_id}` — acciones for a specific tarea

4.4. **Create `backend/app/routers/estados.py`**:
   - CRUD for `estados_tareas` and `estados_acciones`
   - Two prefixes: `/estados-tareas` and `/estados-acciones`

4.5. **Update `backend/app/routers/agent.py`**:
   - Keep SSE chat endpoint
   - Verify it works with updated agent module

4.6. **Rewrite `backend/app/main.py`**:
   - Include 4 routers: tareas, acciones, estados, agent
   - Keep: CORS middleware, request logging middleware, health check, lifespan
   - Remove all old router includes

4.7. **Update `backend/app/agent/`**:
   - `tools_definition.py` — 4 new tools: buscar_tareas, obtener_tarea, listar_estados, buscar_acciones
   - `tools_executor.py` — route tool calls to new endpoints
   - `system_prompt.py` — rewrite for task manager context (Spanish)
   - `api_client.py` — update endpoint URLs
   - `table_metadata.py` — 4 tables with descriptions
   - Keep: `orchestrator.py`, `config.py` (no changes needed)

4.8. **Update `backend/.env.example`**

4.9. **Update `backend/pyproject.toml`**:
   - Remove: `xlwings`, `matplotlib`, `sqlparse`
   - Keep: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `pydantic-settings`, `python-dotenv`, `anthropic`, `httpx`
   - Rename project to `task-manager-backend`

**Validation:** Start server with `uv run uvicorn app.main:app --reload --port 8000`, verify health check and Swagger UI.

---

## Phase 5: Frontend — Core + Landing

**Goal:** Update routing, navbar, landing page for Task Manager branding.

### Steps:

5.1. **Update `frontend/src/App.jsx`**:
   - Routes: `/` (Landing), `/sign-in`, `/sign-up`, `/search`, `/detail/:tarea_id`, `/chat`, `*` (404)
   - Remove lazy imports for: Dashboard, Reports, Parametricas, Register, Jobs
   - Keep lazy imports for: Search, Detail, Chat

5.2. **Update `frontend/src/components/layout/Navbar.jsx`**:
   - Remove: Informes dropdown, Admin dropdown, GlobalSearch, ConsoleDialog, RecentInitiatives
   - Keep: Search link, Chat link, theme toggle, user button
   - Update branding: "Task Manager"

5.3. **Recreate `frontend/src/features/landing/LandingPage.jsx`**:
   - New HeroSection with Task Manager branding
   - Keep ChangelogSection as-is
   - Remove other sections (About, Features, Analytics, Problem, Process, Security, Pricing)
   - Remove useOverviewStats hook

5.4. **Update `frontend/src/lib/version.js`**:
   - Set `APP_VERSION = { major: 1, minor: 1 }`

5.5. **Update `frontend/src/lib/changelog.js`**:
   - Reset to single entry: `{ version: "1.001", feature: 1, title: "Task Manager MVP", summary: "..." }`

5.6. **Update `frontend/src/lib/estadoOrder.js`**:
   - Replace portfolio estados with task estados: `['Pendiente', 'En Progreso', 'Completada', 'Cancelada']`

5.7. **Update `frontend/src/hooks/usePageTitle.js`**:
   - Change app title suffix to "Task Manager"

5.8. **Update `frontend/.env.example`**:
   - `VITE_APP_NAME=Task Manager`
   - Remove dashboard-specific vars

5.9. **Update `frontend/src/providers/Providers.jsx`**:
   - Remove ColorThemeProvider if its source is removed (or keep if component is generic)

5.10. **Clean up `frontend/src/lib/`**:
   - Remove: `estadoColors.js`, `badgeColors.js`, `routeMeta.js`, `sharepoint.js`
   - Keep: `utils.js` (cn + formatters), `logger.js`, `storage.js`, `themes.js`

**Validation:** `npm run dev` — landing page loads with new branding.

---

## Phase 6: Frontend — Search + Detail

**Goal:** Adapt Search and Detail pages for tareas/acciones domain.

### Steps:

6.1. **Rewrite `frontend/src/features/search/`**:
   - `SearchPage.jsx` — adapted for tareas
   - `components/FilterPanel.jsx` — 5-6 filters (tarea_id, tarea text, responsable, tema, estado, fecha)
   - `components/DataGrid.jsx` — keep TanStack Table, update columns
   - `components/FilterChips.jsx` — keep as-is
   - `components/Pagination.jsx` — keep as-is
   - `components/ExportDropdown.jsx` — keep as-is
   - `hooks/useSearchTareas.js` — new hook calling POST /tareas/search
   - `hooks/useFilterOptions.js` — updated to call GET /tareas/filter-options
   - `hooks/useSearchPreferences.js` — keep with new default columns
   - `utils/searchStorage.js` — update DEFAULT_COLUMNS and prefix
   - `utils/columnDefinitions.js` — new column definitions for tareas
   - `utils/exportHelpers.js` — keep as-is
   - Remove: `CardGrid.jsx`, `GroupBySelector.jsx`, `SavedSearches.jsx`, `LtpModal.jsx`, `InitiativeCard.jsx`, `FavoritesToolbar.jsx`, `FavoritesDialog.jsx`, `CopySelectedButton.jsx`, `RowActions.jsx`
   - Remove hooks: `useFavorites.js`, `useSavedSearches.js`

6.2. **Rewrite `frontend/src/features/detail/`**:
   - `DetailPage.jsx` — simplified: header + tarea info + acciones table
   - `components/DetailHeader.jsx` — show tarea_id, tarea title, estado badge
   - `components/TareaInfoSection.jsx` — key-value display of tarea fields + edit button
   - `components/AccionesSection.jsx` — table of acciones with add/edit/delete buttons
   - `components/EntityFormModal.jsx` — keep (generic CRUD modal)
   - `hooks/useTareaDetail.js` — new hook: GET /tareas/{tarea_id} + GET /acciones/tarea/{tarea_id}
   - Remove: all 22 old section components, DetailNav, MobileDetailNav, SectionHistoryModal, EmptySectionsPanel, NotaFormModal
   - Remove all old hooks and config files
   - Keep: `SectionAccordion.jsx`, `KeyValueDisplay.jsx`, `SimpleTable.jsx`

6.3. **Delete removed feature directories**:
   - `frontend/src/features/dashboard/`
   - `frontend/src/features/reports/`
   - `frontend/src/features/parametricas/`
   - `frontend/src/pages/` (RegisterPage, JobsPage)

6.4. **Delete removed shared components**:
   - `InitiativeDrawer.jsx`, `CurrencyCell.jsx`, `ConsoleDialog.jsx`
   - `JsonViewerModal.jsx`, `SummaryViewerModal.jsx`, `SidebarNav.jsx`
   - `DashboardSkeleton.jsx`, `ReportSkeleton.jsx`

6.5. **Update `frontend/src/features/chat/`**:
   - Update `ChatContext.jsx` if needed (should work as-is)
   - The chat will use the updated backend agent with task-focused tools

**Validation:** `npm run dev` — Search page loads, clicking a row navigates to Detail page, CRUD works.

---

## Phase 7: MCP Server

**Goal:** Adapt MCP server for task management with 6 tools.

### Steps:

7.1. **Rename package** from `mcp_portfolio` to `mcp_tareas` (update `__main__.py`, imports, pyproject.toml)

7.2. **Update `server.py`**:
   - FastMCP name: "Task Manager"
   - Health check: `GET /tareas?limit=1`
   - Register new tools

7.3. **Rewrite `api_client.py`**:
   - Methods: `search_tareas()`, `get_tarea()`, `get_acciones()`, `list_tables()`, `get_table_fields()`, `get_field_values()`
   - Remove old methods (portfolio, SQL, etc.)

7.4. **Rewrite `table_metadata.py`**:
   - 4 tables with Spanish descriptions
   - Only `tareas` supports flexible search

7.5. **Rewrite tools**:
   - `tools/busqueda.py` — `buscar_tareas()`, `buscar_acciones()`
   - `tools/detalle.py` — `obtener_tarea()` (tarea + acciones)
   - `tools/esquema.py` — `listar_tablas()`, `describir_tabla()`, `obtener_valores_campo()`
   - Remove: `tools/agregacion.py`, `tools/sql_query.py`, `tools/visualizacion.py`
   - Delete: `charts/` directory

7.6. **Update `config.py`** — remove chart settings

7.7. **Update `logging_config.py`** — rename log file to `task_manager_mcp.log`

7.8. **Update `.env.example`** and `pyproject.toml`**:
   - Remove `matplotlib` dependency
   - Rename project to `task-manager-mcp`

**Validation:** `uv run -m mcp_tareas` starts without errors (with backend running).

---

## Phase 8: Documentation & Final Cleanup

**Goal:** Update all documentation to reflect the new Task Manager project.

### Steps:

8.1. **Rewrite `CLAUDE.md`**:
   - Project overview: Task Manager
   - 4-table schema
   - Management commands (4)
   - Backend endpoints
   - Frontend routes
   - MCP tools (6)
   - Development setup
   - Key patterns and conventions

8.2. **Rewrite `README.md`**:
   - Project description
   - Quick start
   - Architecture overview
   - API reference summary

8.3. **Rewrite `specs/architecture/architecture_backend.md`**:
   - New models, schemas, routers
   - Agent module with task tools
   - Configuration reference

8.4. **Rewrite `specs/architecture/architecture_frontend.md`**:
   - New routes and pages
   - Component inventory
   - State management

8.5. **Update `specs/architecture/architecture_management.md`** (if exists):
   - New CLI commands
   - Migration engine

8.6. **Update `specs/architecture/architecture_mcp_server.md`** (if exists):
   - New tools
   - API client methods

8.7. **Move old specs to archive**:
   - Move `specs/OLD/` content if needed

8.8. **Post-Implementation Checklist**:
   - Version + changelog entry ✓ (done in Phase 5)
   - README updated ✓
   - Architecture docs updated ✓
   - `npm run build` passes
   - Backend starts without errors
   - MCP server starts without errors
   - No dead imports or references to old project

8.9. **Final build verification**:
   - `cd frontend && npm run build` — no errors
   - `cd backend && uv run uvicorn app.main:app --port 8000` — starts clean
   - `cd management && uv run python manage.py init --db test.db` — creates DB
   - `cd mcp_server && uv run -m mcp_tareas` — starts (with backend)

---

## Dependency Graph

```
Phase 1 (Schema)
    ↓
Phase 2 (Management)  →  can test independently
    ↓
Phase 3 (Backend Core)
    ↓
Phase 4 (Backend Routers + Agent)  →  can test API independently
    ↓
Phase 5 (Frontend Core + Landing)
    ↓
Phase 6 (Frontend Search + Detail)  →  can test full stack
    ↓
Phase 7 (MCP Server)  →  can test independently
    ↓
Phase 8 (Documentation)
```

## Estimated File Count

| Action | Count |
|--------|-------|
| Files to create (new) | ~10 |
| Files to rewrite | ~25 |
| Files to delete | ~120+ |
| Files to keep as-is | ~30 |
| Documentation files to rewrite | 5-6 |
