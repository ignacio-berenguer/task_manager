"""
Router for avance table - Full CRUD.
"""
from ..models import Avance
from ..schemas import AvanceCreate, AvanceUpdate
from ..router_factory import create_crud_router

router = create_crud_router(
    model=Avance,
    prefix="/avance",
    tag="Avance",
    entity_name="Avance",
    create_schema=AvanceCreate,
    update_schema=AvanceUpdate,
)
