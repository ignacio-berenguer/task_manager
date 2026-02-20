"""
Router for wbes table - Full CRUD.
"""
from ..models import WBE
from ..router_factory import create_crud_router

router = create_crud_router(
    model=WBE,
    prefix="/wbes",
    tag="WBEs",
    entity_name="WBE",
)
