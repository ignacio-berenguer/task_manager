# Requirements Prompt for feature_007

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_007/specs.md' and './specs/features/feature_007/plan.md' in order to do that.

## Feature Brief

Change to PostgreSQL database. I want to change the application from SQLite to PostgreSQL. (1) Login details: server:127.0.0.1 user: task_user password: your_secure_password database: tasksmanager (2) Add every configuration to the .env file. (3) Ensure that the application keeps working and update the documentation.

## User Story

As a user, I want the application to use a PostgreSQL database instead of SQLite so that it supports concurrent access, better scalability, and production-grade reliability.

## Key Requirements

### Requirement 1: Replace SQLite with PostgreSQL across all modules

- Update the **backend** module (`backend/app/database.py`, `backend/app/config.py`) to connect to PostgreSQL instead of SQLite.
- Update the **management** module (`management/src/config/settings.py`, migration engine) to target PostgreSQL instead of SQLite.
- Update the **MCP server** configuration if it references the database directly.
- Replace `sqlite3`-specific DDL in `db/schema.sql` with PostgreSQL-compatible DDL (e.g., `AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY` or `SERIAL`, `TEXT` date columns review, etc.).

### Requirement 2: Database connection configuration via .env

- Add PostgreSQL connection parameters to each module's `.env` file:
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=5432`
  - `DB_USER=task_user`
  - `DB_PASSWORD=your_secure_password`
  - `DB_NAME=tasksmanager`
- Construct the SQLAlchemy connection string from these individual parameters.
- Update all `.env.example` files with the new variables and remove SQLite-specific variables (e.g., `DATABASE_PATH`).

### Requirement 3: Schema migration to PostgreSQL

- Create a PostgreSQL-compatible version of `db/schema.sql`.
- Ensure all constraints (PKs, FKs, ON DELETE CASCADE), indexes, and seed data work on PostgreSQL.
- The management CLI `recreate_tables` and `migrate` commands must work against PostgreSQL.

### Requirement 4: Dependency updates

- Add `psycopg2-binary` (or `asyncpg` if using async) to backend and management `pyproject.toml`.
- Remove `aiosqlite` or any SQLite-specific dependencies if present.

### Requirement 5: Convert date fields from TEXT to proper date types

- In SQLite, all date fields (`fecha_siguiente_accion`, `fecha_creacion`, `fecha_actualizacion` in `tareas`; `fecha_accion`, `fecha_creacion`, `fecha_actualizacion` in `acciones_realizadas`) are stored as TEXT (ISO 8601 strings).
- In PostgreSQL, these columns must use proper date/timestamp types (`DATE` or `TIMESTAMP`).
- Update `db/schema.sql` to define these columns with the appropriate PostgreSQL date/timestamp types.
- Update the SQLAlchemy ORM models (`backend/app/models.py`) to use `Date` or `DateTime` column types instead of `String`.
- Update Pydantic schemas (`backend/app/schemas.py`) to use `datetime.date` or `datetime.datetime` types accordingly.
- Ensure the management migration engine correctly parses date strings from Excel and inserts them as proper date/timestamp values.
- Ensure the API serializes dates in ISO 8601 format so the frontend continues to work without changes.

### Requirement 6: Maintain existing functionality

- All existing API endpoints, search functionality, CRUD operations, and AI agent must continue working unchanged.
- The frontend requires no changes (it talks to the API, not the database directly).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The PostgreSQL server is already installed and running on 127.0.0.1:5432.
- The database `tasksmanager`, user `task_user`, and password `your_secure_password` are already provisioned.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
