"""
Factory for generating standard CRUD routers.

Eliminates boilerplate across ~15 nearly identical router files.
Routers with custom endpoints (reports, search, etc.) keep their own file.

Usage:
    from .router_factory import create_crud_router
    from .models import Beneficio
    from .schemas import BeneficioCreate, BeneficioUpdate

    router = create_crud_router(
        model=Beneficio,
        prefix="/beneficios",
        tag="Beneficios",
        entity_name="Beneficio",
        create_schema=BeneficioCreate,
        update_schema=BeneficioUpdate,
    )
"""
import logging
from typing import Type, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import Base, get_db
from .crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from .schemas import SearchRequest, PaginatedResponse
from .search import search

logger = logging.getLogger(__name__)


def create_crud_router(
    model: Type[Base],
    prefix: str,
    tag: str,
    entity_name: str,
    create_schema: Type[BaseModel] | None = None,
    update_schema: Type[BaseModel] | None = None,
    include_search: bool = False,
) -> APIRouter:
    """
    Create a standard CRUD router for a model.

    Args:
        model: SQLAlchemy model class
        prefix: URL prefix (e.g., "/beneficios")
        tag: OpenAPI tag for grouping
        entity_name: Human-readable name for error messages
        create_schema: Pydantic schema for create validation (defaults to dict)
        update_schema: Pydantic schema for update validation (defaults to dict)
        include_search: Whether to include a POST /search endpoint

    Returns:
        Configured APIRouter with standard CRUD endpoints
    """
    router = APIRouter(prefix=prefix, tags=[tag])
    crud = CRUDBase(model)

    # Determine body types
    create_body = create_schema if create_schema else dict
    update_body = update_schema if update_schema else dict

    @router.get("/", response_model=PaginatedResponse)
    def list_items(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
    ):
        result = crud.get_multi(db, skip=skip, limit=limit)
        result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
        return result

    # Static routes MUST come before dynamic /{id} route
    @router.get("/portfolio/{portfolio_id}")
    def get_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
        objs = crud.get_all_by_portfolio_id(db, portfolio_id)
        return [model_to_dict_with_calculated(db, obj) for obj in objs]

    @router.get("/{id}")
    def get_item(id: int, db: Session = Depends(get_db)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")
        return model_to_dict_with_calculated(db, obj)

    @router.post("/", status_code=201)
    def create_item(data: create_body, db: Session = Depends(get_db)):
        input_data = data if isinstance(data, dict) else data.model_dump(exclude_unset=True)
        return model_to_dict_with_calculated(db, crud.create(db, input_data))

    @router.put("/{id}")
    def update_item(id: int, data: update_body, db: Session = Depends(get_db)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")
        input_data = data if isinstance(data, dict) else data.model_dump(exclude_unset=True)
        return model_to_dict_with_calculated(db, crud.update(db, obj, input_data))

    @router.delete("/{id}")
    def delete_item(id: int, db: Session = Depends(get_db)):
        if not crud.delete(db, id):
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")
        return {"status": "deleted"}

    if include_search:
        @router.post("/search", response_model=PaginatedResponse)
        def search_items(request: SearchRequest, db: Session = Depends(get_db)):
            return search(db, model, request)

    return router
