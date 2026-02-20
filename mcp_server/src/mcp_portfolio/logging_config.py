"""Logging configuration — file + stderr (NEVER stdout for stdio MCP)."""

import logging
import sys

from . import config


def setup_logging() -> logging.Logger:
    """Configure and return the portfolio_mcp logger."""
    logger = logging.getLogger("portfolio_mcp")
    logger.setLevel(getattr(logging, config.LOG_LEVEL.upper(), logging.INFO))

    # Avoid duplicate handlers on repeated calls
    if logger.handlers:
        return logger

    formatter = logging.Formatter(config.LOG_FORMAT)

    # File handler — logs/portfolio_mcp.log (append)
    config.LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    file_handler = logging.FileHandler(config.LOG_FILE_PATH, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Stream handler — stderr only (stdout is reserved for MCP JSON-RPC)
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(formatter)
    stderr_handler.setLevel(logging.WARNING)
    logger.addHandler(stderr_handler)

    return logger
