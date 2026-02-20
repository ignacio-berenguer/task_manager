# Feature 10: Implementation Plan

## Summary

Restructure portfolio_migration into a modular application with `management/`, `backend/`, and `frontend/` folders. Move all current functionality to the management module while keeping specs, documentation, and git configuration at the root level. Centralize logs in a `logs/` folder at the project root.

## Implementation Steps

### Step 1: Create New Directory Structure

Create the new folders:

```bash
mkdir -p management
mkdir -p backend
mkdir -p frontend
mkdir -p logs
```

Create placeholder files for empty directories:

```bash
touch backend/.gitkeep
touch frontend/.gitkeep
```

### Step 2: Move Files to Management Module

Use `git mv` to preserve git history:

```bash
# Move Python project files
git mv main.py management/
git mv schema.sql management/
git mv copy_excel_sources.sh management/
git mv pyproject.toml management/
git mv .python-version management/
git mv uv.lock management/

# Move source code
git mv src management/

# Move environment files (these might not be tracked by git)
mv .env management/
mv .env.example management/ 2>/dev/null || true

# Move virtual environment (not tracked by git)
mv .venv management/
```

### Step 3: Update Logging Configuration

**File**: `management/src/core/logging_config.py`

Update to write logs to the project root's `logs/` folder:

```python
"""
Centralized logging configuration for portfolio migration.

This module provides logging setup that can be shared across all modules.
"""

import logging
import sys
from pathlib import Path

from src.config import settings

# Calculate logs directory (relative to management folder -> project root)
_management_dir = Path(__file__).parent.parent.parent
_project_root = _management_dir.parent
_logs_dir = _project_root / 'logs'

# Ensure logs directory exists
_logs_dir.mkdir(exist_ok=True)

# Configure logging from config module
LOG_LEVEL = settings.LOG_LEVEL
LOG_FILE = str(_logs_dir / settings.LOG_FILE)
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


def setup_logging():
    """
    Configure centralized logging for all modules.
    All modules (main, init_db, migrate, validate) will log to the same file.
    Logs are appended to preserve history across multiple executions.
    """
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)

    # Remove any existing handlers
    root_logger.handlers.clear()

    # File handler - logs everything to file in append mode
    file_handler = logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    root_logger.addHandler(file_handler)

    # Console handler - logs INFO and above to console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    root_logger.addHandler(console_handler)

    # Return logger for main module
    return logging.getLogger('portfolio_main')
```

### Step 4: Update Environment Files

**File**: `management/.env.example`

Update comments to reflect new log location:

```env
# Portfolio Migration Configuration
# Copy this file to .env and customize as needed

# Logging settings (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
# Log file name (stored in PROJECT_ROOT/logs/ directory)
LOG_FILE=portfolio_migration.log

# Local Excel source directory (relative to management folder or absolute path)
EXCEL_SOURCE_DIR=excel_source

# Excel output settings
EXCEL_OUTPUT_DIR=excel_output
EXCEL_OUTPUT_FILE=PortfolioDigital_DatosRelevantes_Calculation.xlsx
EXCEL_OUTPUT_WORKSHEET=Datos Relevantes
EXCEL_OUTPUT_TABLE=DatosRelevantes

# Windows path for copy_excel_sources.sh script (WSL mount path)
WINDOWS_EXCEL_PATH=/mnt/c/path/to/your/excel/files

# Database settings (relative to management folder)
DATABASE_PATH=portfolio.db
```

**File**: `management/.env`

Update comments (keep existing paths):

```env
# Portfolio Migration Configuration
# Copy this file to .env and customize as needed

# Logging settings (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
# Log file name (stored in PROJECT_ROOT/logs/ directory)
LOG_FILE=portfolio_migration.log

# Local Excel source directory (relative to management folder or absolute path)
EXCEL_SOURCE_DIR=/mnt/c/temp/excel_source

# Excel output settings
EXCEL_OUTPUT_DIR=/mnt/c/temp/excel_output
EXCEL_OUTPUT_FILE=PortfolioDigital_DatosRelevantes_Calculation.xlsx
EXCEL_OUTPUT_WORKSHEET=Datos Relevantes
EXCEL_OUTPUT_TABLE=DatosRelevantes

# Windows path for copy_excel_sources.sh script (WSL mount path)
WINDOWS_EXCEL_PATH=/mnt/c/Users/ES07239146B/OneDrive - Enel Spa/Documents/edistribucion/Teams-SPBI/1.Business Improvement/Iniciativas Digitales/Portfolio

# Database settings (relative to management folder)
DATABASE_PATH=portfolio.db
```

### Step 5: Update Root .gitignore

**File**: `.gitignore` (at project root)

Replace with comprehensive patterns for new structure:

```gitignore
# Python-generated files
__pycache__/
*.py[oc]
build/
dist/
wheels/
*.egg-info

# Virtual environments
.venv

# Claude
.claude

# Environment files with secrets
.env

# Excel files
*.xlsx
*.xlsm
*.xlsb

# Database files
*.db
*.sqlite3
*.db-shm
*.db-wal

# Logs
logs/*.log
*.log

# Management module specific (redundant patterns for clarity)
management/.venv/
management/__pycache__/
management/src/**/__pycache__/
management/excel_source/
management/excel_output/
management/*.db
management/*.log

# Keep .gitkeep files
!.gitkeep
```

### Step 6: Recreate Virtual Environment

After moving files, recreate the virtual environment:

```bash
cd management
rm -rf .venv
uv sync
```

### Step 7: Test All Commands

```bash
cd management

# Test module imports
uv run python -c "from src.core import setup_logging; print('Core OK')"
uv run python -c "from src.migrate import migrate_all; print('Migrate OK')"
uv run python -c "from src.calculate import main; print('Calculate OK')"
uv run python -c "from src.export import export_datos_relevantes; print('Export OK')"

# Test full pipeline
uv run python main.py full_calculation_datos_relevantes --db test.db

# Verify log is in correct location
cat ../logs/portfolio_migration.log | tail -20

# Cleanup
rm test.db
```

### Step 8: Update Documentation

#### 8.1 Update CLAUDE.md

Update to reflect new structure:

- Update Project Structure section
- Update file paths in examples
- Update testing commands with `cd management` prefix

#### 8.2 Update README.md

Update to reflect new structure:

- Update project overview
- Update directory structure
- Update running instructions with `cd management` prefix
- Update all path references

#### 8.3 Update specs/architecture.md

Update to reflect new structure:

- Update package structure diagram
- Add note about modular architecture
- Update file paths

### Step 9: Clean Up

Remove any leftover files or empty directories at root level:

```bash
# Remove old log file if exists at root
rm -f portfolio_migration.log
rm -f portfolio_mismatched_migration.txt

# Remove old __pycache__ at root
rm -rf __pycache__

# Verify structure
ls -la
ls -la management/
ls -la backend/
ls -la frontend/
ls -la logs/
ls -la specs/
```

## Files Modified

| File | Change |
|------|--------|
| `management/src/core/logging_config.py` | Update log file path to use `PROJECT_ROOT/logs/` |
| `management/.env` | Update comments |
| `management/.env.example` | Update comments and template |
| `.gitignore` | Update patterns for new structure |
| `CLAUDE.md` | Update all paths and structure documentation |
| `README.md` | Update all paths and instructions |
| `specs/architecture.md` | Update structure documentation |

## Files Moved

| From | To |
|------|-----|
| `main.py` | `management/main.py` |
| `schema.sql` | `management/schema.sql` |
| `copy_excel_sources.sh` | `management/copy_excel_sources.sh` |
| `pyproject.toml` | `management/pyproject.toml` |
| `.python-version` | `management/.python-version` |
| `.env` | `management/.env` |
| `.env.example` | `management/.env.example` |
| `uv.lock` | `management/uv.lock` |
| `.venv/` | `management/.venv/` |
| `src/` | `management/src/` |

## Files Created

| File | Purpose |
|------|---------|
| `backend/.gitkeep` | Keep empty backend folder in git |
| `frontend/.gitkeep` | Keep empty frontend folder in git |
| `logs/` | Directory for centralized logs |

## Testing Plan

1. **Environment Setup**:
   ```bash
   cd management
   uv sync
   ```

2. **Import Tests**:
   ```bash
   uv run python -c "from src.core import setup_logging; print('OK')"
   uv run python -c "from src.config import settings; print('OK')"
   uv run python -c "from src.init import create_database; print('OK')"
   uv run python -c "from src.migrate import migrate_all; print('OK')"
   uv run python -c "from src.validate import validate_all; print('OK')"
   uv run python -c "from src.calculate import main; print('OK')"
   uv run python -c "from src.export import export_datos_relevantes; print('OK')"
   ```

3. **Command Tests**:
   ```bash
   # Individual commands
   uv run python main.py init --db test.db
   uv run python main.py migrate --db test.db
   uv run python main.py validate --db test.db
   uv run python main.py calculate_datos_relevantes --db test.db

   # Full pipeline
   uv run python main.py full_calculation_datos_relevantes --db test_pipeline.db
   ```

4. **Log Location Verification**:
   ```bash
   ls -la ../logs/
   tail -20 ../logs/portfolio_migration.log
   ```

5. **Cleanup**:
   ```bash
   rm test.db test_pipeline.db
   ```

## Rollback Plan

If issues arise:

1. Restore files from git:
   ```bash
   git checkout HEAD~1 -- main.py schema.sql src/ pyproject.toml .python-version uv.lock
   ```

2. Move .env back to root:
   ```bash
   mv management/.env .
   ```

3. Recreate virtual environment at root:
   ```bash
   rm -rf management/.venv
   uv sync
   ```

4. Remove new directories:
   ```bash
   rm -rf management backend frontend logs
   ```

## Summary of Changes

This refactoring:
1. **Moves** all portfolio_migration code to `management/` folder
2. **Creates** placeholder `backend/` and `frontend/` folders for future modules
3. **Centralizes** logs in `PROJECT_ROOT/logs/` folder
4. **Keeps** specs, documentation, and git config at project root
5. **Preserves** all existing functionality - no behavioral changes
