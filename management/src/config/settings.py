"""
Configuration management for task manager migration.

Loads settings from .env file with sensible defaults.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Calculate paths
_management_dir = Path(__file__).parent.parent.parent
_project_root = _management_dir.parent

# Load .env file from management directory
_env_path = _management_dir / '.env'
load_dotenv(_env_path)

# --- Logging ---
LOG_FILE: str = os.getenv('LOG_FILE', 'task_manager.log')
_log_level_str: str = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_LEVEL: int = getattr(logging, _log_level_str, logging.INFO)

# --- Database (PostgreSQL) ---
DB_HOST: str = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT: int = int(os.getenv('DB_PORT', '5432'))
DB_USER: str = os.getenv('DB_USER', 'task_user')
DB_PASSWORD: str = os.getenv('DB_PASSWORD', 'your_secure_password')
DB_NAME: str = os.getenv('DB_NAME', 'tasksmanager')

DATABASE_URL: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- Schema path ---
SCHEMA_PATH: str = str(_project_root / 'db' / 'schema.sql')

# --- Excel Source ---
EXCEL_SOURCE_DIR: str = os.getenv('EXCEL_SOURCE_DIR', 'excel_source')
EXCEL_SOURCE_FILE: str = os.getenv('EXCEL_SOURCE_FILE', 'tareas.xlsx')
EXCEL_SHEET_TAREAS: str = os.getenv('EXCEL_SHEET_TAREAS', 'Tareas')
EXCEL_TABLE_TAREAS: str = os.getenv('EXCEL_TABLE_TAREAS', 'Tareas')

# --- Batch Processing ---
BATCH_COMMIT_SIZE: int = int(os.getenv('BATCH_COMMIT_SIZE', '100'))


def validate_config(command: str, excel_dir: str = None) -> None:
    """
    Validate configuration for a given command.

    Checks that required files and directories exist before executing commands.
    Raises SystemExit with clear error messages listing all missing items.

    Args:
        command: The CLI command being executed
        excel_dir: Excel source directory (overrides EXCEL_SOURCE_DIR if provided)
    """
    excel = excel_dir or EXCEL_SOURCE_DIR
    missing = []

    # Commands that require Excel source files
    if command in ('migrate', 'complete_process'):
        excel_path = Path(excel)
        if not excel_path.exists():
            missing.append(f"Excel source directory not found: {excel_path}")
        else:
            excel_file = excel_path / EXCEL_SOURCE_FILE
            if not excel_file.exists():
                missing.append(f"Excel file not found: {excel_file}")

    if missing:
        msg = f"Configuration validation failed for '{command}':\n"
        for item in missing:
            msg += f"  - {item}\n"
        raise SystemExit(msg)
