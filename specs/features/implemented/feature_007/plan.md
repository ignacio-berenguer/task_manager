# plan.md — feature_007: Migrate from SQLite to PostgreSQL

## Implementation Phases

The migration is organized in 5 phases, executed sequentially. Each phase can be tested before moving to the next.

---

## Phase 1: Schema and Dependencies

### Step 1.1: Rewrite `db/schema.sql` for PostgreSQL

**File:** `db/schema.sql`

- Remove all `PRAGMA` statements
- Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`
- Change date columns from `TEXT` to `DATE` or `TIMESTAMP` (see specs.md section 3.2)
- Replace `datetime('now')` defaults with `NOW()`
- Replace `INSERT OR IGNORE INTO` with `INSERT INTO ... ON CONFLICT DO NOTHING`
- Keep indexes and foreign key constraints (syntax is compatible)
- Keep `CREATE TABLE IF NOT EXISTS` (valid in PostgreSQL)

### Step 1.2: Add psycopg2-binary to dependencies

**Files:**
- `backend/pyproject.toml` — Add `"psycopg2-binary>=2.9.0"` to dependencies
- `management/pyproject.toml` — Add `"psycopg2-binary>=2.9.0"` to dependencies

### Step 1.3: Run `uv sync` in both modules

```bash
cd backend && uv sync
cd management && uv sync
```

---

## Phase 2: Backend Module

### Step 2.1: Update `backend/app/config.py`

- Remove `DATABASE_PATH: str = ""`
- Add PostgreSQL connection parameters:
  - `DB_HOST: str = "127.0.0.1"`
  - `DB_PORT: int = 5432`
  - `DB_USER: str = "task_user"`
  - `DB_PASSWORD: str = "your_secure_password"`
  - `DB_NAME: str = "tasksmanager"`
- Keep `DATABASE_ECHO: bool = False`

### Step 2.2: Update `backend/app/database.py`

- Remove SQLite path calculation logic (the `_db_path` variable, Path imports)
- Build PostgreSQL URL: `f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"`
- Remove `connect_args={"check_same_thread": False}` from `create_engine()`
- Keep `SessionLocal`, `Base`, and `get_db()` unchanged

### Step 2.3: Update `backend/app/models.py`

- Import `Date`, `DateTime` from `sqlalchemy`
- Change column types:
  - `Tarea.fecha_siguiente_accion`: `Column(Text)` → `Column(Date)`
  - `Tarea.fecha_creacion`: `Column(Text)` → `Column(DateTime)`
  - `Tarea.fecha_actualizacion`: `Column(Text)` → `Column(DateTime)`
  - `AccionRealizada.fecha_accion`: `Column(Text)` → `Column(Date)`
  - `AccionRealizada.fecha_creacion`: `Column(Text)` → `Column(DateTime)`
  - `AccionRealizada.fecha_actualizacion`: `Column(Text)` → `Column(DateTime)`

### Step 2.4: Update `backend/app/schemas.py`

- Import `date` from `datetime`
- Change field types in `TareaCreate` and `TareaUpdate`:
  - `fecha_siguiente_accion: str | None` → `date | None`
- Change field types in `AccionCreate` and `AccionUpdate`:
  - `fecha_accion: str | None` → `date | None`

### Step 2.5: Update `backend/app/crud.py`

- In `update()` method: change `datetime.now().isoformat()` to `datetime.now()` for `fecha_actualizacion`

### Step 2.6: Update `backend/.env.example`

- Replace `DATABASE_PATH=` with the 5 PostgreSQL variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)

### Step 2.7: Update `backend/.env` (actual)

- Same changes as .env.example with the actual credentials

---

## Phase 3: Management Module

### Step 3.1: Update `management/src/config/settings.py`

- Remove `DATABASE_PATH` calculation (the `_db_dir`, `_db_path_env` variables)
- Add PostgreSQL parameters:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Add computed `DATABASE_URL` property
- Update `validate_config()`:
  - Remove database file existence check for `migrate` command (no longer a file)

### Step 3.2: Rewrite `management/src/init/db_init.py`

- Replace `import sqlite3` with `import psycopg2`
- **`create_database()` → `init_schema()`:**
  - Accept connection parameters instead of `db_path`
  - Connect via `psycopg2.connect(host=..., port=..., user=..., password=..., dbname=...)`
  - Remove file existence checks and overwrite prompts
  - Execute schema.sql via `cursor.execute()` (psycopg2 handles multi-statement with `autocommit` or splitting)
  - Verify tables via `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
  - Remove PRAGMA verification
- **`recreate_tables()`:**
  - Connect via psycopg2
  - List existing tables from `pg_catalog.pg_tables`
  - Drop tables with `DROP TABLE IF EXISTS ... CASCADE`
  - Execute schema.sql
  - Verify tables
  - Restore preserved tables (if any)

### Step 3.3: Rewrite `management/src/migrate/engine.py`

- Replace `import sqlite3` with `import psycopg2`
- **`TareasMigrationEngine.__init__()`:**
  - Accept DB connection params (or DATABASE_URL) instead of `db_path`
  - Connect via `psycopg2.connect(...)` with `autocommit=False`
  - No need for `PRAGMA foreign_keys = ON`
- **`migrate_tareas()`:**
  - Replace `?` placeholders with `%s`
  - Replace `INSERT OR REPLACE INTO tareas` with `INSERT INTO tareas (...) VALUES (%s, ...) ON CONFLICT (tarea_id) DO UPDATE SET ...`
- **`migrate_acciones_from_notas()`:**
  - Replace `?` placeholders with `%s`
  - Replace raw `INSERT INTO` with parameterized `%s` syntax
- **`migrate_responsables()`:**
  - Replace `INSERT OR IGNORE INTO` with `INSERT INTO ... ON CONFLICT DO NOTHING`
  - Replace `?` placeholders with `%s`
  - Replace `cursor.rowcount` check (psycopg2 also supports `rowcount`)

### Step 3.4: Update `management/manage.py`

- Update description string from "Excel to SQLite" to "Excel to PostgreSQL"
- Remove `--db` CLI argument (no file path needed)
- Update all references from `args.db` to use settings.DATABASE_URL
- Update `init` command to call `init_schema()` instead of `create_database()`
- Update `recreate_tables` command to use psycopg2 connection
- Update `migrate` command: remove file existence check
- Update `complete_process` command

### Step 3.5: Update `management/src/core/data_quality.py`

- Update `log_quality_issue()` type hint: `conn: sqlite3.Connection` → generic or remove (it only uses logging)
- No other changes needed (functions are pure utilities)

### Step 3.6: Update `management/.env.example`

- Replace `# DATABASE_PATH=` with the 5 PostgreSQL variables
- Keep Excel source variables unchanged

### Step 3.7: Update `management/.env` (actual)

- Same changes as .env.example with actual credentials

---

## Phase 4: Test End-to-End

### Step 4.1: Initialize database schema

```bash
cd management
uv sync
uv run python manage.py init
```

Verify: tables created in PostgreSQL.

### Step 4.2: Run full migration

```bash
uv run python manage.py complete_process
```

Verify: tareas, acciones, responsables populated.

### Step 4.3: Start backend and test API

```bash
cd backend
uv sync
uv run python -m app.main
```

Verify:
- `GET /api/v1/tareas` returns data with date fields as ISO strings
- `POST /api/v1/tareas/search` works with date filters
- `GET /api/v1/tareas/{id}` returns proper dates
- `POST /api/v1/acciones` creates with proper dates
- CRUD operations all work

### Step 4.4: Test frontend (manual)

```bash
cd frontend
npm run dev
```

Verify:
- Search page loads and displays dates correctly
- Detail page shows dates
- Creating/editing acciones with dates works
- Date picker works correctly

---

## Phase 5: Documentation Updates

### Step 5.1: Update `CLAUDE.md`

- Change all references from SQLite to PostgreSQL
- Update database configuration section
- Update CLI commands (remove --db flag)
- Update connection setup instructions

### Step 5.2: Update `README.md`

- Update technology stack
- Update setup instructions with PostgreSQL prerequisites
- Update database configuration

### Step 5.3: Update `specs/architecture/architecture_backend.md`

- Change "Database: SQLite" to "Database: PostgreSQL"
- Update database.py description
- Update config.py environment variables
- Update dependencies list

### Step 5.4: Update version and changelog

- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js`
- Add changelog entry in `frontend/src/lib/changelog.js`

---

## Files Modified (Complete List)

| File | Change Type |
|------|------------|
| `db/schema.sql` | Rewrite for PostgreSQL; tarea_id → SERIAL PK |
| `backend/pyproject.toml` | Add psycopg2-binary |
| `backend/app/config.py` | Replace DATABASE_PATH with PG params |
| `backend/app/database.py` | PostgreSQL connection string |
| `backend/app/models.py` | Date/DateTime column types; tarea_id → Integer PK |
| `backend/app/schemas.py` | date types; remove tarea_id from TareaCreate; AccionCreate tarea_id → int |
| `backend/app/crud.py` | datetime.now() instead of .isoformat() |
| `backend/app/routers/tareas.py` | Path params str→int; remove text lookup helper; use CRUDBase.get/delete |
| `backend/app/routers/acciones.py` | tarea_id path param str→int |
| `backend/app/agent/tools_definition.py` | tarea_id type "string"→"integer" |
| `backend/app/agent/tools_executor.py` | URL construction with f-strings for integer tarea_id |
| `backend/app/agent/system_prompt.py` | tarea_id description: "texto"→"entero" |
| `backend/app/agent/table_metadata.py` | Updated field descriptions |
| `backend/.env.example` | PostgreSQL variables |
| `backend/.env` | PostgreSQL variables |
| `management/pyproject.toml` | Add psycopg2-binary |
| `management/src/config/settings.py` | PostgreSQL config |
| `management/src/init/db_init.py` | Rewrite for psycopg2 |
| `management/src/init/__init__.py` | Updated exports |
| `management/src/migrate/engine.py` | Rewrite for psycopg2; remove tarea_id column mapping; simple INSERT |
| `management/manage.py` | Update CLI for PostgreSQL |
| `management/src/core/data_quality.py` | Remove sqlite3 type hints |
| `management/.env.example` | PostgreSQL variables |
| `management/.env` | PostgreSQL variables |
| `frontend/src/features/search/SearchPage.jsx` | Remove tarea_id from new tarea form; filter ilike→eq |
| `frontend/src/lib/version.js` | Version bump (1.007) |
| `frontend/src/lib/changelog.js` | Changelog entry |
| `mcp_server/src/mcp_tareas/tools/detalle.py` | tarea_id: str→int |
| `mcp_server/src/mcp_tareas/tools/busqueda.py` | tarea_id: str→int |
| `mcp_server/src/mcp_tareas/table_metadata.py` | Updated field descriptions |
| `CLAUDE.md` | Update all SQLite references; tarea_id PK docs |
| `README.md` | Update setup/config docs; tarea_id PK docs |
| `specs/architecture/architecture_backend.md` | Update architecture; tarea_id PK |

**Files NOT modified:**
- `backend/app/search.py` (no changes — SQLAlchemy abstracts DB dialect)
- `backend/app/table_registry.py` (no changes)
- `frontend/src/features/detail/DetailPage.jsx` (no changes — integer tarea_id works transparently)
- `frontend/src/features/shared/ActionDialogs.jsx` (no changes — integer tarea_id works transparently)
