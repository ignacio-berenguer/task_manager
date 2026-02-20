# Feature 10: Application Modularization

## Overview

This feature restructures the portfolio_migration project from a standalone application into a modular architecture. The current functionality becomes the "management" module, with new placeholder folders for "backend" and "frontend" modules. This sets the foundation for a larger application with multiple components.

## Current Structure

```
portfolio_migration/
├── main.py                          # CLI entry point
├── schema.sql                       # Database schema
├── copy_excel_sources.sh            # Excel copy script
├── pyproject.toml                   # Python project config
├── .python-version                  # Python version file
├── .env                             # Environment config
├── .env.example                     # Environment template
├── uv.lock                          # Package lock file
├── .venv/                           # Virtual environment
├── CLAUDE.md                        # Claude instructions
├── README.md                        # Project documentation
├── .gitignore                       # Git ignore rules
├── specs/                           # Specifications
│   ├── specs.md
│   ├── architecture.md
│   └── features/
├── src/                             # Source code
│   ├── __init__.py
│   ├── core/
│   ├── config/
│   ├── init/
│   ├── migrate/
│   ├── calculate/
│   ├── export/
│   └── validate/
├── excel_source/                    # Excel inputs (gitignored)
├── excel_output/                    # Excel outputs (gitignored)
├── portfolio.db                     # SQLite database (gitignored)
└── portfolio_migration.log          # Log file (gitignored)
```

## Target Structure

```
portfolio_migration/
├── management/                      # Current portfolio_migration functionality
│   ├── main.py                      # CLI entry point
│   ├── schema.sql                   # Database schema
│   ├── copy_excel_sources.sh        # Excel copy script
│   ├── pyproject.toml               # Python project config
│   ├── .python-version              # Python version file
│   ├── .env                         # Environment config
│   ├── .env.example                 # Environment template
│   ├── uv.lock                      # Package lock file
│   ├── .venv/                       # Virtual environment
│   ├── src/                         # Source code (unchanged internal structure)
│   │   ├── __init__.py
│   │   ├── core/
│   │   ├── config/
│   │   ├── init/
│   │   ├── migrate/
│   │   ├── calculate/
│   │   ├── export/
│   │   └── validate/
│   ├── excel_source/                # Excel inputs (gitignored)
│   ├── excel_output/                # Excel outputs (gitignored)
│   └── portfolio.db                 # SQLite database (gitignored)
│
├── backend/                         # Future backend module (placeholder)
│   └── .gitkeep                     # Keep empty folder in git
│
├── frontend/                        # Future frontend module (placeholder)
│   └── .gitkeep                     # Keep empty folder in git
│
├── logs/                            # Centralized logs folder
│   └── portfolio_migration.log      # Log file (gitignored)
│
├── specs/                           # Specifications (shared, at root)
│   ├── specs.md
│   ├── architecture.md
│   └── features/
│
├── CLAUDE.md                        # Claude instructions (at root)
├── README.md                        # Project documentation (at root)
└── .gitignore                       # Git ignore rules (at root)
```

## Changes Required

### 1. Create New Directory Structure

- Create `management/` folder
- Create `backend/` folder with `.gitkeep`
- Create `frontend/` folder with `.gitkeep`
- Create `logs/` folder

### 2. Move Files to Management Module

Files to move to `management/`:
- `main.py`
- `schema.sql`
- `copy_excel_sources.sh`
- `pyproject.toml`
- `.python-version`
- `.env`
- `.env.example`
- `uv.lock`
- `.venv/` (entire directory)
- `src/` (entire directory)

### 3. Keep Files at Root Level

Files that stay at root:
- `CLAUDE.md`
- `README.md`
- `.gitignore`
- `specs/` directory (entire directory)
- `.git/` (unchanged)
- `.claude/` (unchanged)
- `.vscode/` (unchanged)

### 4. Update Logging Configuration

The log file should now be stored in `logs/` at the project root:
- Change default LOG_FILE from `portfolio_migration.log` to `../logs/portfolio_migration.log`
- The logging config needs to create the logs directory if it doesn't exist
- Update `.env` and `.env.example` accordingly

### 5. Update .gitignore

The `.gitignore` at root level needs to account for the new structure:
- Keep existing patterns for excel files, databases, logs
- Add patterns for management-specific ignored files
- Ensure `logs/*.log` is properly ignored
- Keep `.gitkeep` files tracked

### 6. Update Configuration Paths

In `src/config/settings.py`:
- The `.env` file path calculation will work correctly since it uses relative path from the settings.py file
- No changes needed as paths are relative to where the command is run

In `src/core/logging_config.py`:
- Update log file path to be relative to project root (`../logs/`)
- Ensure log directory is created if it doesn't exist

## Code Changes Required

### management/src/config/settings.py

No changes needed - the `.env` path is calculated relative to the settings.py file location, which will work correctly after the move.

### management/src/core/logging_config.py

Update to write logs to the project root's `logs/` folder:

```python
from pathlib import Path

# Calculate logs directory (relative to management folder)
_management_dir = Path(__file__).parent.parent.parent
_project_root = _management_dir.parent
_logs_dir = _project_root / 'logs'

# Ensure logs directory exists
_logs_dir.mkdir(exist_ok=True)

# Update LOG_FILE to use the logs directory
LOG_FILE = str(_logs_dir / settings.LOG_FILE)
```

### management/.env and management/.env.example

Update the LOG_FILE setting:
```env
# Log file name (will be stored in PROJECT_ROOT/logs/)
LOG_FILE=portfolio_migration.log
```

### Root .gitignore

Update to include:
```gitignore
# Logs directory
logs/*.log

# Management module specific
management/.venv
management/*.db
management/__pycache__/
management/src/**/__pycache__/
management/excel_source/
management/excel_output/
```

## Execution Instructions

After the refactoring, the application will be executed from the `management/` directory:

```bash
# Navigate to management folder
cd management

# Initialize database
uv run python main.py init

# Run migration
uv run python main.py migrate

# Run full pipeline
uv run python main.py full_calculation_datos_relevantes
```

Alternatively, from project root:

```bash
# Run from project root
cd management && uv run python main.py full_calculation_datos_relevantes
```

## Validation Criteria

1. **Functionality preserved**: All existing commands work identically
2. **Logs in correct location**: Logs appear in `PROJECT_ROOT/logs/portfolio_migration.log`
3. **No import errors**: All module imports work correctly
4. **Database creation**: Database is created in `management/portfolio.db`
5. **Excel paths**: Excel input/output paths work correctly
6. **Git history**: Git history is preserved for moved files

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Git history loss for moved files | Use `git mv` to preserve history |
| Import path issues | Test all commands after move |
| .env path resolution | Verify settings.py path calculation works |
| Virtual environment issues | Recreate .venv if needed with `uv sync` |

## Testing Plan

```bash
# After refactoring, from management/ folder:

# 1. Verify uv environment works
cd management
uv sync

# 2. Test module imports
uv run python -c "from src.core import setup_logging; print('Core OK')"
uv run python -c "from src.migrate import migrate_all; print('Migrate OK')"
uv run python -c "from src.calculate import main; print('Calculate OK')"

# 3. Test full pipeline
uv run python main.py full_calculation_datos_relevantes --db test.db

# 4. Verify log location
ls -la ../logs/portfolio_migration.log

# 5. Cleanup test database
rm test.db
```
