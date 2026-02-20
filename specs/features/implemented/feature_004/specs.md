# Feature 04: Configuration File and Excel Copy Script

## Overview

Add a configuration system using `.env` file and create a bash script to copy Excel source files from Windows OneDrive to the WSL project.

**Status:** Implemented

---

## Components

### 1. Bash Script: `copy_excel_sources.sh`

Standalone script to copy Excel files from Windows OneDrive path to local `excel_source/` directory.

**Source path (Windows/WSL):**
```
Windows: C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Teams-SPBI\1.Business Improvement\Iniciativas Digitales\Portfolio
WSL:     /mnt/c/Users/ES07239146B/OneDrive - Enel Spa/Documents/edistribucion/Teams-SPBI/1.Business Improvement/Iniciativas Digitales/Portfolio
```

**Files to copy:**
- `PortfolioDigital_Master.xlsm`
- `PortfolioDigital_Beneficios.xlsm`
- `PortfolioDigital_Facturado.xlsx`
- `PortfolioDigital_Transacciones.xlsm`

**Script features:**
- Read source path from `.env` file (WINDOWS_EXCEL_PATH)
- Verify source files exist before copying
- Create target directory if needed
- Report success/failure for each file
- Color-coded output (green=success, red=error)

---

### 2. Configuration File: `.env`

**Settings:**

| Variable | Default | Description |
|----------|---------|-------------|
| `EXCEL_SOURCE_DIR` | `excel_source` | Local directory containing Excel files |
| `WINDOWS_EXCEL_PATH` | *(OneDrive path)* | Windows path for copy script |
| `DATABASE_PATH` | `portfolio.db` | SQLite database file path |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FILE` | `portfolio_migration.log` | Log file path |

**Note:** `.gitignore` already includes `.env` files (line 16-17).

---

### 3. Configuration Module: `config.py`

Python module to load and provide access to configuration settings.

**Features:**
- Load settings from `.env` file using `python-dotenv`
- Provide defaults when `.env` doesn't exist
- Convert LOG_LEVEL string to logging constant
- Single source of truth for all configurable values
- Centralized Excel file names dictionary

**Exported variables:**
```python
EXCEL_SOURCE_DIR: str      # Default: 'excel_source'
WINDOWS_EXCEL_PATH: str    # Default: ''
DATABASE_PATH: str         # Default: 'portfolio.db'
LOG_FILE: str              # Default: 'portfolio_migration.log'
LOG_LEVEL: int             # Default: logging.INFO (20)
EXCEL_FILES: dict          # Dictionary of Excel file names
```

---

## File Structure

```
portfolio_migration/
├── config.py              # Configuration module (NEW)
├── .env.example           # Template with defaults (NEW, committed)
├── .env                   # Actual config (NEW, gitignored)
├── copy_excel_sources.sh  # Bash copy script (NEW)
├── main.py                # Updated to use config
├── excel_readers.py       # Updated to use config
├── migrate.py             # Updated to use config
├── validate.py            # Updated to use config
├── calculate.py           # Updated to use config
├── init_db.py             # Updated to use config
└── pyproject.toml         # Added python-dotenv dependency
```

---

## Usage

### Setup Configuration

```bash
# Copy template to create local config
cp .env.example .env

# Edit .env if needed (e.g., change LOG_LEVEL to DEBUG)
```

### Copy Excel Files from OneDrive

```bash
# Make script executable (one-time)
chmod +x copy_excel_sources.sh

# Run copy script
./copy_excel_sources.sh
```

### Override Configuration

Environment variables can override `.env` values:
```bash
# Run with DEBUG logging
LOG_LEVEL=DEBUG uv run python main.py migrate

# Use different database
DATABASE_PATH=test.db uv run python main.py init
```

---

## Backward Compatibility

- If `.env` doesn't exist, all defaults remain the same as before
- Existing CLI `--db` and `--excel-dir` flags continue to work and override config values
- No changes to existing command-line interface

---

## Dependencies

- `python-dotenv>=1.0.0` - Added to `pyproject.toml`
