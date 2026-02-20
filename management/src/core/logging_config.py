"""
Centralized logging configuration for task manager migration.

This module provides logging setup that can be shared across all modules.
Logs are written to PROJECT_ROOT/logs/ directory.
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
    All modules (main, init_db, migrate) will log to the same file.
    Logs are appended to preserve history across multiple executions.
    Log file is stored in PROJECT_ROOT/logs/ directory.
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
    return logging.getLogger('task_manager_main')
