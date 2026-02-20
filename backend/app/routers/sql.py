"""SQL query execution endpoint — read-only SQL against the portfolio database."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from ..database import get_db
from ..schemas import SQLExecuteRequest, SQLExecuteResponse
from ..services.sql_validator import execute_safe_query

logger = logging.getLogger("portfolio_backend")

router = APIRouter(prefix="/sql", tags=["SQL Query"])


@router.post("/execute", response_model=SQLExecuteResponse)
def execute_sql(request: SQLExecuteRequest, db: Session = Depends(get_db)):
    """Execute a read-only SQL SELECT query against the portfolio database.

    Only SELECT statements are allowed. INSERT, UPDATE, DELETE, DROP, ALTER,
    and other mutating operations are rejected. A row limit is enforced
    to prevent excessive result sets.
    """
    try:
        result = execute_safe_query(db, request.sql, request.max_rows)
        return result
    except ValueError as e:
        logger.warning("SQL validation rejected: %s — Query: %s", e, request.sql[:200])
        raise HTTPException(status_code=400, detail=str(e))
    except OperationalError as e:
        error_msg = str(e.orig) if e.orig else str(e)
        logger.warning("SQL execution error: %s — Query: %s", error_msg, request.sql[:200])
        raise HTTPException(
            status_code=400,
            detail=f"Error ejecutando la consulta SQL: {error_msg}",
        )
    except Exception as e:
        logger.error("SQL unexpected error: %s — Query: %s", e, request.sql[:200])
        raise HTTPException(
            status_code=500,
            detail="Error interno ejecutando la consulta SQL.",
        )
