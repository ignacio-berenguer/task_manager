"""Logging configuration -- file + stderr (NEVER stdout for stdio MCP)."""

import logging
import sys

from .config import settings


def setup_logging() -> logging.Logger:
    """Configure and return the task_manager_mcp logger."""
    logger = logging.getLogger("task_manager_mcp")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    # Avoid duplicate handlers on repeated calls
    if logger.handlers:
        return logger

    formatter = logging.Formatter(settings.LOG_FORMAT)

    # File handler -- logs/task_manager_mcp.log (append)
    settings.LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    file_handler = logging.FileHandler(settings.LOG_FILE_PATH, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Stream handler -- stderr only (stdout is reserved for MCP JSON-RPC)
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(formatter)
    stderr_handler.setLevel(logging.WARNING)
    logger.addHandler(stderr_handler)

    return logger
