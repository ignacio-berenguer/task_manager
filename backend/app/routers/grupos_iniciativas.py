"""
Router for grupos_iniciativas table - Full CRUD.
"""
from ..models import GrupoIniciativa
from ..schemas import GrupoIniciativaCreate, GrupoIniciativaUpdate
from ..router_factory import create_crud_router

router = create_crud_router(
    model=GrupoIniciativa,
    prefix="/grupos-iniciativas",
    tag="Grupos Iniciativas",
    entity_name="GrupoIniciativa",
    create_schema=GrupoIniciativaCreate,
    update_schema=GrupoIniciativaUpdate,
)
