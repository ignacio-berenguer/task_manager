"""
Router for facturacion table - Full CRUD.
"""
from ..models import Facturacion
from ..schemas import FacturacionCreate, FacturacionUpdate
from ..router_factory import create_crud_router

router = create_crud_router(
    model=Facturacion,
    prefix="/facturacion",
    tag="Facturacion",
    entity_name="Facturacion",
    create_schema=FacturacionCreate,
    update_schema=FacturacionUpdate,
)
