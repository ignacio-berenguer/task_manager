"""
Generic CRUD operations for database models.

This module provides reusable CRUD operations with support for
calculated fields - fields that are computed on-the-fly rather
than stored in the database.
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, inspect
from typing import Type, TypeVar, Generic, Any
from .database import Base
from .calculated_fields import CalculatedFieldService, get_calculated_fields
from .calculated_fields.cache import LookupCache

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=Base)


class CRUDBase(Generic[ModelType]):
    """Generic CRUD operations for a SQLAlchemy model."""

    def __init__(self, model: Type[ModelType]):
        self.model = model
        self._pk_name = self._get_primary_key_name()
        self._table_name = model.__tablename__

    def _get_primary_key_name(self) -> str:
        """Get the primary key column name."""
        mapper = inspect(self.model)
        pk_columns = mapper.primary_key
        if pk_columns:
            return pk_columns[0].name
        return "id"

    def _strip_calculated_fields(self, db: Session, data: dict) -> dict:
        """Strip calculated fields from input data before saving."""
        service = CalculatedFieldService(db)
        return service.strip_calculated_fields(self._table_name, data)

    def get(self, db: Session, id: Any) -> ModelType | None:
        """Get a single record by primary key."""
        pk_column = getattr(self.model, self._pk_name)
        return db.query(self.model).filter(pk_column == id).first()

    def get_by_portfolio_id(self, db: Session, portfolio_id: str) -> ModelType | None:
        """Get a single record by portfolio_id."""
        if not hasattr(self.model, "portfolio_id"):
            return None
        return db.query(self.model).filter(
            self.model.portfolio_id == portfolio_id
        ).first()

    def get_all_by_portfolio_id(self, db: Session, portfolio_id: str) -> list[ModelType]:
        """Get all records for a portfolio_id."""
        if not hasattr(self.model, "portfolio_id"):
            return []
        return db.query(self.model).filter(
            self.model.portfolio_id == portfolio_id
        ).all()

    def get_multi(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> dict[str, Any]:
        """Get multiple records with pagination."""
        pk_column = getattr(self.model, self._pk_name)
        total = db.query(func.count(pk_column)).scalar() or 0
        data = db.query(self.model).offset(skip).limit(limit).all()
        return {
            "total": total,
            "data": data,
            "limit": limit,
            "offset": skip
        }

    def create(self, db: Session, obj_in: dict) -> ModelType:
        """
        Create a new record.

        Calculated fields are automatically stripped from input data.
        """
        # Strip calculated fields
        clean_data = self._strip_calculated_fields(db, obj_in)

        # Filter out None values and _sa_instance_state
        clean_data = {
            k: v for k, v in clean_data.items()
            if v is not None and not k.startswith("_")
        }
        db_obj = self.model(**clean_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Created {self._table_name} record")
        return db_obj

    def update(
        self,
        db: Session,
        db_obj: ModelType,
        obj_in: dict
    ) -> ModelType:
        """
        Update an existing record.

        Calculated fields are automatically stripped from input data.
        """
        # Strip calculated fields
        clean_data = self._strip_calculated_fields(db, obj_in)

        for field, value in clean_data.items():
            if value is not None and hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Updated {self._table_name} record")
        return db_obj

    def delete(self, db: Session, id: Any) -> bool:
        """Delete a record by primary key."""
        pk_column = getattr(self.model, self._pk_name)
        obj = db.query(self.model).filter(pk_column == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            logger.info(f"Deleted {self._table_name} record {id}")
            return True
        return False


def model_to_dict(obj: Any) -> dict:
    """Convert SQLAlchemy model to dictionary."""
    if obj is None:
        return {}
    result = {}
    for column in inspect(obj.__class__).columns:
        value = getattr(obj, column.name)
        result[column.name] = value
    return result


def model_to_dict_with_calculated(
    db: Session,
    obj: Any,
    table_name: str = None,
    cache: LookupCache = None
) -> dict:
    """
    Convert SQLAlchemy model to dictionary with calculated fields populated.

    Args:
        db: Database session
        obj: SQLAlchemy model instance
        table_name: Table name (optional, derived from model if not provided)
        cache: Optional LookupCache for batch processing
    """
    if obj is None:
        return {}

    base_dict = model_to_dict(obj)

    if table_name is None:
        table_name = obj.__class__.__tablename__

    calc_fields = get_calculated_fields(table_name)
    if not calc_fields:
        return base_dict

    service = CalculatedFieldService(db, cache=cache)
    return service.populate_calculated_fields(table_name, base_dict)


def batch_model_to_dict_with_calculated(
    db: Session,
    items: list,
    table_name: str = None
) -> list[dict]:
    """
    Convert a list of SQLAlchemy models to dicts with calculated fields,
    sharing a single LookupCache across all items.

    This eliminates N+1 queries: instead of querying datos_descriptivos
    once per field per record, the cache ensures each source record is
    loaded only once per portfolio_id.
    """
    if not items:
        return []

    if table_name is None:
        table_name = items[0].__class__.__tablename__

    calc_fields = get_calculated_fields(table_name)
    if not calc_fields:
        return [model_to_dict(item) for item in items]

    cache = LookupCache(db)
    service = CalculatedFieldService(db, cache=cache)
    result = []
    for item in items:
        base_dict = model_to_dict(item)
        full_dict = service.populate_calculated_fields(table_name, base_dict)
        result.append(full_dict)
    return result
