# Management Module Architecture

## Task Manager -- Migration CLI

### Overview

The Management module is a CLI tool that migrates task management data from an Excel workbook into a normalized SQLite database. It follows a modular, command-based structure with 4 CLI commands.

This module is located in the `management/` folder of the project.

---

## Project Structure

```
task_manager/
├── management/              # This module
│   ├── manage.py            # CLI entry point (4 commands)
│   ├── src/                 # Source code
│   ├── .env                 # Configuration (gitignored)
│   └── pyproject.toml       # Dependencies
├── db/
│   └── schema.sql           # Database DDL (4 tables + seed data)
├── backend/                 # Backend module
├── frontend/                # Frontend module
├── mcp_server/              # MCP server module
├── logs/                    # Centralized log directory
│   └── task_manager_migration.log
└── specs/                   # Technical specifications
```

## Package Structure

```
management/src/
├── __init__.py              # Package root
├── core/                    # Shared utilities
│   ├── logging_config.py    # Centralized logging setup (writes to PROJECT_ROOT/logs/)
│   └── data_quality.py      # Data normalization utilities
├── config/                  # Configuration
│   └── settings.py          # Environment-based configuration (loads .env)
├── init/                    # init and recreate_tables commands
│   └── db_init.py           # Database initialization and table recreation
└── migrate/                 # migrate command
    └── engine.py            # TareasMigrationEngine
```

---

## Dependency Graph

```
                    manage.py
                       │
    ┌──────────┬───────┼──────────┐
    │          │       │          │
    v          v       v          v
  init  recreate   migrate  complete_process
    │     tables      │          │
    │       │         │     (calls init +
    │       │         │      migrate)
    │       │         v
    │       │    TareasMigration
    │       │      Engine
    │       │         │
    └───────┼─────────┘
            │
            v
     config + core
            │
            v
      management/.env
```

---

## Module Responsibilities

### core/logging_config.py
- Provides `setup_logging()` function for centralized logging
- Configures file and console handlers
- Writes to `PROJECT_ROOT/logs/task_manager_migration.log`
- Automatically creates logs directory if it does not exist

### core/data_quality.py
- Data normalization functions:
  - `normalize_date()`: Excel serial dates to ISO 8601
  - `normalize_multiline_text()`: CRLF normalization
  - `detect_formula_error()`: Excel formula error detection

### config/settings.py
- Loads configuration from `management/.env` file
- Provides constants: DATABASE_PATH, EXCEL_SOURCE_DIR, LOG_LEVEL, etc.
- `validate_config(command, db_path, excel_dir)`: Startup validation of required files/directories before executing commands

### init/db_init.py
- `create_database(db_path)`: Creates SQLite database and executes `PROJECT_ROOT/db/schema.sql`. Prompts for confirmation if the database already exists.
- `recreate_tables(db_path)`: Drops all existing tables and recreates them from `schema.sql` without deleting the `.db` file.

### migrate/engine.py
- `TareasMigrationEngine` class: Reads Excel workbook, inserts tareas and acciones_realizadas into the database.
- `migrate_all()`: Entry point for the migration process.
- Handles column name normalization, data quality cleanup, and error tracking.

---

## CLI Commands

4 commands available (run from `management/` directory):

| Command | Description |
|---------|-------------|
| `init` | Initialize database (create schema), prompts for overwrite |
| `recreate_tables` | Drop all tables and recreate from schema.sql |
| `migrate` | Migrate data from Excel to SQLite |
| `complete_process` | Run full pipeline (recreate_tables + migrate) |

### Usage

```bash
cd management

# Initialize new database
uv run python manage.py init

# Recreate all tables (drop + create from schema)
uv run python manage.py recreate_tables

# Run full migration from Excel
uv run python manage.py migrate

# Run complete process (recreate + migrate)
uv run python manage.py complete_process

# Use custom database path
uv run python manage.py migrate --db custom.db

# Use custom Excel directory
uv run python manage.py migrate --excel-dir /path/to/excel
```

### complete_process

This command orchestrates the complete pipeline:

1. Recreate tables (drop all tables and recreate from schema.sql)
2. Migrate all data from Excel

---

## Data Flow

### Migration Flow

```
Excel File  -->  TareasMigrationEngine  -->  SQLite Database
                        │
                        v
                Data Quality Functions
                (normalize dates, text cleanup)
```

The migration reads from the configured Excel file and sheet, normalizes column names (remove accents, lowercase, underscores), applies data quality functions, and inserts records into the `tareas` and `acciones_realizadas` tables.

---

## Configuration (.env)

```env
# Logging
LOG_LEVEL=INFO
LOG_FILE=task_manager_migration.log

# Database
# DATABASE_PATH=            # Leave empty for default (PROJECT_ROOT/db/task_manager.db)

# Excel Source
EXCEL_SOURCE_DIR=excel_source
```

### Startup Validation

Before executing any command, `validate_config()` checks:
- **migrate, complete_process**: Excel source directory and required Excel files exist
- **recreate_tables**: Database file exists

Missing items are reported as a list of clear error messages before any processing begins.

---

## Error Handling

- All modules log errors to centralized log file (`PROJECT_ROOT/logs/task_manager_migration.log`)
- Migration errors are logged but do not stop the process for other rows
- Fatal errors print stack trace to console
- Keyboard interrupts are handled gracefully

---

## Testing

```bash
cd management

# Test init
uv run python manage.py init --db test.db

# Test migrate
uv run python manage.py migrate --db test.db

# Test full pipeline
uv run python manage.py complete_process --db test.db
```
