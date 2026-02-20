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
_db_dir = _project_root / 'db'

# Load .env file from management directory
_env_path = _management_dir / '.env'
load_dotenv(_env_path)

# --- Logging ---
LOG_FILE: str = os.getenv('LOG_FILE', 'task_manager.log')
_log_level_str: str = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_LEVEL: int = getattr(logging, _log_level_str, logging.INFO)

# --- Database ---
_db_path_env = os.getenv('DATABASE_PATH', '')
if _db_path_env:
    DATABASE_PATH: str = _db_path_env
else:
    DATABASE_PATH: str = str(_db_dir / 'task_manager.db')

# --- Excel Source ---
EXCEL_SOURCE_DIR: str = os.getenv('EXCEL_SOURCE_DIR', 'excel_source')
EXCEL_SOURCE_FILE: str = os.getenv('EXCEL_SOURCE_FILE', 'tareas.xlsx')
EXCEL_SHEET_TAREAS: str = os.getenv('EXCEL_SHEET_TAREAS', 'Tareas')
EXCEL_SHEET_ACCIONES: str = os.getenv('EXCEL_SHEET_ACCIONES', 'Acciones')

# --- Batch Processing ---
BATCH_COMMIT_SIZE: int = int(os.getenv('BATCH_COMMIT_SIZE', '100'))


def validate_config(command: str, db_path: str = None, excel_dir: str = None) -> None:
    """
    Validate configuration for a given command.

    Checks that required files and directories exist before executing commands.
    Raises SystemExit with clear error messages listing all missing items.

    Args:
        command: The CLI command being executed
        db_path: Database path (overrides DATABASE_PATH if provided)
        excel_dir: Excel source directory (overrides EXCEL_SOURCE_DIR if provided)
    """
    db = db_path or DATABASE_PATH
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

    # Commands that require the database to exist
    if command in ('migrate',):
        db_file = Path(db)
        if not db_file.exists():
            missing.append(f"Database not found: {db_file}")

    if missing:
        msg = f"Configuration validation failed for '{command}':\n"
        for item in missing:
            msg += f"  - {item}\n"
        raise SystemExit(msg)
