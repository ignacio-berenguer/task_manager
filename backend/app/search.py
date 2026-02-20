"""
Flexible search operations for database models.

This module provides advanced search capabilities with support for
calculated fields that are computed on-the-fly.
"""
import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, inspect
from typing import Type, Any
from .database import Base
from .schemas import SearchRequest, SearchFilter
from .crud import model_to_dict, batch_model_to_dict_with_calculated
from .calculated_fields import get_calculated_fields

logger = logging.getLogger(__name__)


def apply_filter(query, model: Type[Base], filter: SearchFilter):
    """Apply a single filter to a query."""
    column = getattr(model, filter.field, None)
    if column is None:
        raise ValueError(f"Invalid field: {filter.field}")

    match filter.operator:
        case "eq":
            return query.filter(column == filter.value)
        case "ne":
            return query.filter(column != filter.value)
        case "gt":
            return query.filter(column > filter.value)
        case "gte":
            return query.filter(column >= filter.value)
        case "lt":
            return query.filter(column < filter.value)
        case "lte":
            return query.filter(column <= filter.value)
        case "like":
            return query.filter(column.like(filter.value))
        case "ilike":
            return query.filter(column.ilike(filter.value))
        case "in":
            if isinstance(filter.value, list):
                return query.filter(column.in_(filter.value))
            return query.filter(column.in_([filter.value]))
        case "not_in":
            if isinstance(filter.value, list):
                return query.filter(~column.in_(filter.value))
            return query.filter(~column.in_([filter.value]))
        case "is_null":
            return query.filter(column.is_(None))
        case "is_not_null":
            return query.filter(column.isnot(None))
        case _:
            raise ValueError(f"Invalid operator: {filter.operator}")


def search(
    db: Session,
    model: Type[Base],
    request: SearchRequest,
    populate_calculated: bool = True
) -> dict[str, Any]:
    """
    Execute a flexible search query.

    Args:
        db: Database session
        model: SQLAlchemy model class
        request: Search request with filters, ordering, pagination
        populate_calculated: Whether to populate calculated fields (default True)

    Returns:
        Dictionary with total count, data, limit, and offset
    """
    table_name = model.__tablename__
    query = db.query(model)

    # Apply filters
    for f in request.filters:
        try:
            query = apply_filter(query, model, f)
        except ValueError as e:
            logger.warning(f"Invalid filter: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    # Get total count before pagination
    total = query.count()

    # Apply ordering
    if request.order_by:
        column = getattr(model, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)
        else:
            logger.warning(f"Invalid order_by field: {request.order_by}")

    # Apply pagination
    data = query.offset(request.offset).limit(request.limit).all()

    # Convert to dictionaries and populate calculated fields if needed
    if populate_calculated and get_calculated_fields(table_name):
        data_dicts = batch_model_to_dict_with_calculated(db, data, table_name)
    else:
        data_dicts = [model_to_dict(row) for row in data]

    logger.info(
        f"Search on {table_name}: "
        f"{len(request.filters)} filters, {total} total, "
        f"returning {len(data_dicts)} records"
    )

    return {
        "total": total,
        "data": data_dicts,
        "limit": request.limit,
        "offset": request.offset
    }


def get_model_fields(model: Type[Base]) -> list[str]:
    """Get list of field names for a model."""
    return [column.name for column in inspect(model).columns]
