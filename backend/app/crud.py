"""Generic CRUD operations for Task Manager."""

import logging
from datetime import datetime
from typing import Any, Generic, TypeVar

from sqlalchemy import func, inspect
from sqlalchemy.orm import Session

from app.database import Base

LOG = logging.getLogger("task_manager_backend")

ModelType = TypeVar("ModelType", bound=Base)


def model_to_dict(obj) -> dict:
    """Convert SQLAlchemy model instance to dictionary."""
    if obj is None:
        return None
    return {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}


class CRUDBase(Generic[ModelType]):
    """Generic CRUD operations for a SQLAlchemy model."""

    def __init__(self, model: type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> ModelType | None:
        """Get a record by primary key."""
        pk = inspect(self.model).mapper.primary_key[0]
        return db.query(self.model).filter(pk == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """Get multiple records with pagination."""
        return db.query(self.model).offset(skip).limit(limit).all()

    def count(self, db: Session) -> int:
        """Count all records."""
        return db.query(func.count()).select_from(self.model).scalar()

    def create(self, db: Session, obj_in: dict) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: dict) -> ModelType:
        """Update an existing record."""
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        if hasattr(db_obj, "fecha_actualizacion"):
            db_obj.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: Any) -> bool:
        """Delete a record by primary key."""
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False
