"""
Router for datos_ejecucion table - Full CRUD.
"""
from ..models import DatosEjecucion
from ..schemas import DatosEjecucionCreate, DatosEjecucionUpdate
from ..router_factory import create_crud_router

router = create_crud_router(
    model=DatosEjecucion,
    prefix="/datos-ejecucion",
    tag="Datos Ejecucion",
    entity_name="DatosEjecucion",
    create_schema=DatosEjecucionCreate,
    update_schema=DatosEjecucionUpdate,
)
