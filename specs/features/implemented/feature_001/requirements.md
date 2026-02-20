# Requirements Prompt for feature_001

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_001/specs.md' and './specs/features/feature_001/plan.md' in order to do that.

## Feature Brief

This is a new project based on an already existing one. The same architecture will be preserved, but the user interface, data model, API, MCP tools, agent, and management tools will be completely different. This first feature removes the old data model, code, and functionality, and creates a minimalistic first release:

1. **Management module**: Import data from an existing Excel file (name configured in `.env`) into a new database with tables `tareas` and `acciones_realizadas`.
2. **tareas** table fields: `tarea_id` (primary key), `tarea` (description), `responsable`, `descripcion`, `fecha_siguiente_accion` (date), `tema`, `estado`.
3. **acciones_realizadas** table: related to `tarea_id`, with fields `accion` and `estado`.
4. **Backend and frontend**: Landing page (rebranded as "Task Manager" with changelog), Search and Detail navigation on tareas, plus CRUD for tareas and acciones.
5. **MCP tools**: Tools for MCP agent and integrated chat to access tareas and acciones.
6. **Parametric tables**: `estados_tareas` and `estados_acciones` for estado values.
7. **Code cleanup**: Remove old domain-specific code, but preserve the architecture and reusable React components (ui, layout, shared, theme).
8. **Documentation update**: Completely update CLAUDE.md, README.md, specs/architecture_backend.md, specs/architecture_frontend.md to reflect the new project without references to the old one.

## User Story

As a task manager user, I want to import my tasks from an Excel file into a structured database, search and browse them through a web interface, and manage their lifecycle (including actions taken) so I can track task progress effectively.

## Key Requirements

### Requirement 1: New Database Schema

- Create `tareas` table with fields: `tarea_id` (TEXT, PK), `tarea` (TEXT), `responsable` (TEXT), `descripcion` (TEXT), `fecha_siguiente_accion` (DATE), `tema` (TEXT), `estado` (TEXT)
- Create `acciones_realizadas` table related to `tarea_id` (FK), with fields: `accion` (TEXT), `estado` (TEXT), plus an auto-increment primary key
- Create parametric tables `estados_tareas` and `estados_acciones` to hold valid estado values
- Remove old schema (28 tables) and replace with the new minimal schema

### Requirement 2: Management Module — Excel Import

- Configure the source Excel filename via `.env`
- Implement a CLI command to import tareas and acciones from the Excel file into SQLite
- Map Excel columns to the new schema fields
- Preserve the CLI pattern (manage.py with commands) but remove old commands that don't apply

### Requirement 3: Backend API — CRUD + Search

- Expose CRUD endpoints for `tareas` and `acciones_realizadas`
- Implement a search endpoint for tareas (flexible filters on key fields)
- Remove all old routers, models, and schemas; replace with new ones
- Preserve the FastAPI + SQLAlchemy architecture pattern

### Requirement 4: Frontend — Search + Detail + CRUD + Landing

- **Landing page**: Recreate the landing page for "Task Manager" branding and mission. Keep the changelog section so users can see version history.
- **Search page**: list tareas with filters (responsable, tema, estado, text search)
- **Detail page**: show tarea details with its acciones_realizadas
- **CRUD**: create, edit, delete tareas and acciones from the UI
- Remove old page content that references the portfolio domain, but adapt the pages to the new task manager domain
- **Preserve existing React components** (ui/, layout/, shared/, theme/) — they are reusable and should be kept even if not all are used immediately
- Preserve the React + Vite + Tailwind architecture pattern

### Requirement 5: MCP Server — Task Access Tools

- Provide MCP tools for searching and retrieving tareas and acciones
- Remove old MCP tools and replace with new ones relevant to the task manager
- Preserve the MCP server architecture pattern

### Requirement 6: Code Cleanup

- Remove old backend code: models, routers, schemas, crud, search, calculated_fields, services that reference the old portfolio domain
- Remove old management code: migrate, calculate, export, validate modules specific to the old domain
- Remove old MCP tools specific to the portfolio domain
- **Keep all reusable frontend components**: `components/ui/`, `components/layout/`, `components/shared/`, `components/theme/`, `lib/` utilities (storage.js, logger.js, utils.js, version.js, changelog.js) — these are generic and valuable for the new project
- Remove old feature-specific frontend code (dashboard charts, report pages, portfolio detail sections) but keep the component shells where they can be adapted
- Keep the architectural skeleton: directory structure, configuration patterns, logging, CORS setup
- Ensure no dead imports or references to removed code remain

### Requirement 7: Documentation Overhaul

- Completely rewrite CLAUDE.md to describe the new task manager project
- Update README.md with new project description, setup, and usage
- Update specs/architecture/architecture_backend.md for the new API
- Update specs/architecture/architecture_frontend.md for the new UI
- Remove all references to the old portfolio management system

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- This is a fresh start for the data model and functionality — old portfolio features are intentionally removed.
- The architectural patterns (module structure, config via .env, logging, CLI pattern, API pattern, frontend patterns) should be preserved even as the domain changes completely.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
