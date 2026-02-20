"""SQL validation and safe execution service.

Validates that SQL queries are read-only SELECT statements,
enforces row limits, and provides defense-in-depth against SQL injection.
"""

import logging
import re
import time

import sqlparse
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import settings

logger = logging.getLogger("portfolio_backend")

# Keywords that indicate data modification or schema changes
_BLACKLISTED_KEYWORDS = {
    # DDL
    "CREATE", "DROP", "ALTER", "TRUNCATE", "RENAME",
    # DML (non-SELECT)
    "INSERT", "UPDATE", "DELETE", "REPLACE", "MERGE", "UPSERT",
    # DCL
    "GRANT", "REVOKE",
    # TCL
    "COMMIT", "ROLLBACK", "SAVEPOINT",
    # SQLite-specific dangerous
    "ATTACH", "DETACH", "REINDEX", "VACUUM",
}

# PRAGMAs that are safe (read-only)
_SAFE_PRAGMAS = {
    "table_info", "table_list", "table_xinfo",
    "index_list", "index_info", "foreign_key_list",
    "database_list", "compile_options",
}


def _strip_comments(sql: str) -> str:
    """Remove SQL comments to prevent hiding malicious code."""
    return sqlparse.format(sql, strip_comments=True).strip()


def _check_query_length(sql: str) -> None:
    """Reject overly long queries."""
    if len(sql) > settings.SQL_MAX_QUERY_LENGTH:
        raise ValueError(
            f"La consulta excede el largo máximo permitido "
            f"({len(sql)} > {settings.SQL_MAX_QUERY_LENGTH} caracteres)."
        )


def _check_single_statement(sql: str) -> None:
    """Reject queries with multiple statements."""
    statements = [s for s in sqlparse.split(sql) if s.strip()]
    if len(statements) > 1:
        raise ValueError(
            "Solo se permite una única sentencia SQL. "
            "No se permiten múltiples sentencias separadas por punto y coma."
        )


def _check_statement_type(sql: str) -> None:
    """Ensure the query is a SELECT statement using sqlparse."""
    parsed = sqlparse.parse(sql)
    if not parsed:
        raise ValueError("No se pudo analizar la consulta SQL.")

    stmt = parsed[0]
    stmt_type = stmt.get_type()

    # sqlparse returns 'SELECT' for SELECT statements
    if stmt_type != "SELECT":
        detected = stmt_type or "desconocido"
        raise ValueError(
            f"Solo se permiten consultas SELECT. "
            f"Tipo de sentencia detectado: {detected}"
        )


def _check_blacklisted_keywords(sql: str) -> None:
    """Reject queries containing dangerous keywords."""
    # Normalize: uppercase, collapse whitespace
    normalized = " ".join(sql.upper().split())

    for keyword in _BLACKLISTED_KEYWORDS:
        # Match as whole word to avoid false positives (e.g. "UPDATED_AT" column)
        pattern = rf"\b{keyword}\b"
        if re.search(pattern, normalized):
            # Special case: allow read-only PRAGMAs
            if keyword == "PRAGMA" or keyword in ("REINDEX", "VACUUM"):
                continue
            raise ValueError(
                f"SQL rechazado: la palabra clave '{keyword}' no está permitida. "
                f"Solo se permiten consultas SELECT de solo lectura."
            )

    # Check for PRAGMA specifically — only allow safe ones
    if re.search(r"\bPRAGMA\b", normalized):
        pragma_match = re.search(r"\bPRAGMA\s+(\w+)", normalized)
        if pragma_match:
            pragma_name = pragma_match.group(1).lower()
            if pragma_name not in _SAFE_PRAGMAS:
                raise ValueError(
                    f"PRAGMA '{pragma_name}' no está permitido. "
                    f"Solo se permiten PRAGMAs de lectura: {', '.join(sorted(_SAFE_PRAGMAS))}."
                )


def _enforce_row_limit(sql: str, max_rows: int) -> str:
    """Add or adjust LIMIT clause to enforce row limits."""
    normalized = " ".join(sql.upper().split())

    # Check if query already has a LIMIT clause
    limit_match = re.search(r"\bLIMIT\s+(\d+)\s*$", normalized)
    if limit_match:
        existing_limit = int(limit_match.group(1))
        if existing_limit > max_rows:
            # Replace the existing LIMIT with the enforced max
            sql = re.sub(
                r"(?i)\bLIMIT\s+\d+\s*$",
                f"LIMIT {max_rows}",
                sql.rstrip(),
            )
        return sql

    # Also handle LIMIT with OFFSET: LIMIT N OFFSET M
    limit_offset_match = re.search(r"\bLIMIT\s+(\d+)\s+OFFSET\s+\d+\s*$", normalized)
    if limit_offset_match:
        existing_limit = int(limit_offset_match.group(1))
        if existing_limit > max_rows:
            sql = re.sub(
                r"(?i)\bLIMIT\s+\d+(\s+OFFSET\s+\d+)\s*$",
                f"LIMIT {max_rows}\\1",
                sql.rstrip(),
            )
        return sql

    # No LIMIT clause — append one
    return f"{sql.rstrip()} LIMIT {max_rows}"


def validate_and_prepare_sql(sql: str, max_rows: int) -> str:
    """Validate SQL for safety and return the query with row limit enforced.

    Args:
        sql: The raw SQL query string.
        max_rows: Maximum number of rows to return.

    Returns:
        The validated, limit-enforced SQL string.

    Raises:
        ValueError: If validation fails, with a descriptive Spanish message.
    """
    if not sql or not sql.strip():
        raise ValueError("La consulta SQL está vacía.")

    # Cap max_rows at the configured hard limit
    max_rows = min(max_rows, settings.SQL_MAX_ROWS)

    # 1. Strip comments
    clean_sql = _strip_comments(sql)
    if not clean_sql:
        raise ValueError("La consulta SQL está vacía después de eliminar comentarios.")

    # 2. Check length
    _check_query_length(clean_sql)

    # 3. Single statement only
    _check_single_statement(clean_sql)

    # 4. Must be SELECT
    _check_statement_type(clean_sql)

    # 5. No blacklisted keywords
    _check_blacklisted_keywords(clean_sql)

    # 6. Enforce row limit
    safe_sql = _enforce_row_limit(clean_sql, max_rows)

    return safe_sql


def execute_safe_query(db: Session, sql: str, max_rows: int = 500) -> dict:
    """Validate and execute a SQL query, returning structured results.

    Args:
        db: SQLAlchemy database session.
        sql: The raw SQL query to validate and execute.
        max_rows: Maximum rows to return.

    Returns:
        Dict with keys: sql, columns, data, total_rows, truncated, execution_time_ms

    Raises:
        ValueError: If SQL validation fails.
        Exception: If query execution fails.
    """
    safe_sql = validate_and_prepare_sql(sql, max_rows)

    effective_max = min(max_rows, settings.SQL_MAX_ROWS)

    logger.info("SQL query executing: %s", safe_sql[:200])

    t0 = time.monotonic()
    result = db.execute(text(safe_sql))
    elapsed_ms = round((time.monotonic() - t0) * 1000)

    columns = list(result.keys())
    rows = [dict(row._mapping) for row in result.fetchall()]

    truncated = len(rows) >= effective_max

    logger.info(
        "SQL query completed: %d rows, %d ms, truncated=%s",
        len(rows), elapsed_ms, truncated,
    )

    return {
        "sql": safe_sql,
        "columns": columns,
        "data": rows,
        "total_rows": len(rows),
        "truncated": truncated,
        "execution_time_ms": elapsed_ms,
    }
