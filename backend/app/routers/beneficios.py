"""
Router for beneficios table - Full CRUD.
"""
from ..models import Beneficio
from ..schemas import BeneficioCreate, BeneficioUpdate
from ..router_factory import create_crud_router

router = create_crud_router(
    model=Beneficio,
    prefix="/beneficios",
    tag="Beneficios",
    entity_name="Beneficio",
    create_schema=BeneficioCreate,
    update_schema=BeneficioUpdate,
)
