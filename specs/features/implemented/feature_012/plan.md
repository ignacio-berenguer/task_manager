# Feature 12: Implementation Plan

## Summary

Implement calculated fields handling in the backend API:
1. Define calculated fields in code
2. Strip calculated fields on Create/Update operations
3. Calculate fields on Read operations
4. Implement calculation functions

---

## Implementation Steps

### Step 1: Create Calculated Fields Package

**Create directory and files:**

```bash
mkdir -p backend/app/calculated_fields
touch backend/app/calculated_fields/__init__.py
```

**Files to create:**

| File | Purpose |
|------|---------|
| `definitions.py` | Field definitions and mappings |
| `lookup.py` | Lookup functions from other tables |
| `estado.py` | Estado calculation functions |
| `importe.py` | Importe calculation functions |
| `utils.py` | Helper functions |

---

### Step 2: Define Calculated Fields (definitions.py)

```python
"""
Calculated field definitions and mappings.
"""

# Tables that are completely calculated (read-only)
READONLY_TABLES = {"datos_relevantes", "iniciativas"}

# Calculated fields per table
CALCULATED_FIELDS = {
    "datos_descriptivos": [
        "estado_de_la_iniciativa",
        "justificacion_regulatoria",
        "falta_justificacion_regulatoria",
    ],
    "justificaciones": [
        "nombre",
        "digital_framework_level_1",
    ],
    "grupos_iniciativas": [
        "nombre_componente",
        "importe_2025_componente",
        "importe_2025_grupo",
    ],
    "informacion_economica": [
        "nombre",
        "referente_bi",
        "cluster_2025",
        "digital_framework_level_1",
        "origen",
        "estado",
        "debe_tener_cini",
        "debe_tener_capex_opex",
        "debe_tener_fecha_prevista_pes",
        "debe_tener_wbe",
        "budget_2026",
        "importe_2025",
        "importe_2026",
    ],
    "facturacion": ["descripcion"],
    "datos_ejecucion": [
        "nombre",
        "unidad",
        "estado_de_la_iniciativa",
        "fecha_de_ultimo_estado",
        "origen",
        "importe_2025",
        "importe_facturado_2025",
        "tipo_agrupacion",
    ],
    "hechos": ["nombre", "referente_bi"],
    "beneficios": ["nombre", "estado_de_la_iniciativa"],
    "etiquetas": ["nombre"],
    "ltp": ["nombre", "digital_framework_level_1"],
    "wbes": ["nombre"],
    "notas": ["nombre", "referente_bi"],
    "avance": ["descripcion"],
    "acciones": [
        "nombre",
        "unidad",
        "estado",
        "cluster_2025",
        "tipo",
        "siguiente_accion",
        "siguiente_accion_comentarios",
        "referente_bi",
        "referente_b_unit",
        "referente_ict",
        "importe_2025",
        "importe_2026",
    ],
    "descripciones": [
        "nombre",
        "digital_framework_level_1",
        "estado_de_la_iniciativa",
        "referente_b_unit",
    ],
    "estado_especial": ["nombre"],
    "investment_memos": ["nombre"],
    "impacto_aatt": [
        "nombre",
        "estado_de_la_iniciativa",
        "digital_framework_level_1",
        "fecha_prevista_finalizacion",
        "fecha_finalizacion_ict",
        "falta_evaluacion_impacto_aatt",
    ],
}

# Field calculation mappings
# Format: field_name -> (type, source, source_field) or (type, function_name, kwargs)
FIELD_CALCULATORS = {
    # Simple lookups from datos_descriptivos
    "nombre": ("lookup", "datos_descriptivos", "nombre"),
    "unidad": ("lookup", "datos_descriptivos", "unidad"),
    "origen": ("lookup", "datos_descriptivos", "origen"),
    "digital_framework_level_1": ("lookup", "datos_descriptivos", "digital_framework_level_1"),
    "cluster_2025": ("lookup", "datos_descriptivos", "cluster_2025"),
    "referente_bi": ("lookup", "datos_descriptivos", "referente_bi"),
    "referente_b_unit": ("lookup", "datos_descriptivos", "referente_b_unit"),
    "referente_ict": ("lookup", "datos_descriptivos", "referente_enabler_ict"),
    "tipo_agrupacion": ("lookup", "datos_descriptivos", "tipo_agrupacion"),
    "descripcion": ("lookup", "datos_descriptivos", "nombre"),  # descripcion = nombre

    # Lookups from datos_relevantes
    "estado_de_la_iniciativa": ("lookup", "datos_relevantes", "estado_de_la_iniciativa"),
    "estado": ("lookup", "datos_relevantes", "estado_de_la_iniciativa"),  # Alias
    "fecha_de_ultimo_estado": ("lookup", "datos_relevantes", "fecha_de_ultimo_estado"),
    "tipo": ("lookup", "datos_relevantes", "tipo"),
    "siguiente_accion": ("lookup", "datos_relevantes", "siguiente_accion"),
    "siguiente_accion_comentarios": ("lookup", "datos_relevantes", "fecha_limite_comentarios"),
    "fecha_prevista_finalizacion": ("lookup", "datos_relevantes", "fecha_prevista_pes"),

    # Calculated functions
    "justificacion_regulatoria": ("function", "calc_justificacion_regulatoria"),
    "falta_justificacion_regulatoria": ("function", "calc_falta_justificacion_regulatoria"),

    # Importe calculations
    "importe_2025": ("function", "calc_importe", {"year": 2025, "tipo": "Importe"}),
    "importe_2026": ("function", "calc_importe", {"year": 2026, "tipo": "Importe"}),
    "importe_facturado_2025": ("function", "calc_importe_facturado", {"year": 2025}),
    "budget_2026": ("function", "calc_importe", {"year": 2026, "tipo": "Budget"}),

    # Boolean fields
    "debe_tener_cini": ("function", "calc_debe_tener", {"field": "cini"}),
    "debe_tener_capex_opex": ("function", "calc_debe_tener", {"field": "capex_opex"}),
    "debe_tener_fecha_prevista_pes": ("function", "calc_debe_tener", {"field": "fecha_prevista_pes"}),
    "debe_tener_wbe": ("function", "calc_debe_tener", {"field": "wbe"}),
    "falta_evaluacion_impacto_aatt": ("function", "calc_falta_evaluacion_impacto"),

    # Grupos lookups (special - uses portfolio_id_componente)
    "nombre_componente": ("lookup_grupo", "datos_relevantes", "nombre"),
    "importe_2025_componente": ("lookup_grupo", "datos_relevantes", "importe_2025"),
    "importe_2025_grupo": ("function", "calc_sum_grupo_importes"),
}


def get_calculated_fields(table_name: str) -> list[str]:
    """Get list of calculated fields for a table."""
    return CALCULATED_FIELDS.get(table_name, [])


def is_readonly_table(table_name: str) -> bool:
    """Check if table is completely calculated (read-only)."""
    return table_name in READONLY_TABLES


def is_calculated_field(table_name: str, field_name: str) -> bool:
    """Check if a field is calculated for the given table."""
    return field_name in get_calculated_fields(table_name)
```

---

### Step 3: Implement Lookup Functions (lookup.py)

```python
"""
Lookup functions for calculated fields.
"""
from sqlalchemy.orm import Session
from typing import Any, Optional

from ..models import DatosDescriptivo, DatosRelevante, InformacionEconomica


def lookup_datos_descriptivos(
    db: Session,
    portfolio_id: str,
    field: str
) -> Optional[Any]:
    """Lookup a field from datos_descriptivos by portfolio_id."""
    obj = db.query(DatosDescriptivo).filter(
        DatosDescriptivo.portfolio_id == portfolio_id
    ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_datos_relevantes(
    db: Session,
    portfolio_id: str,
    field: str
) -> Optional[Any]:
    """Lookup a field from datos_relevantes by portfolio_id."""
    obj = db.query(DatosRelevante).filter(
        DatosRelevante.portfolio_id == portfolio_id
    ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_informacion_economica(
    db: Session,
    portfolio_id: str,
    field: str
) -> Optional[Any]:
    """Lookup a field from informacion_economica by portfolio_id."""
    obj = db.query(InformacionEconomica).filter(
        InformacionEconomica.portfolio_id == portfolio_id
    ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_grupo_componente(
    db: Session,
    portfolio_id_componente: str,
    field: str
) -> Optional[Any]:
    """Lookup a field from datos_relevantes for a grupo component."""
    return lookup_datos_relevantes(db, portfolio_id_componente, field)
```

---

### Step 4: Implement Justificacion Functions (estado.py)

```python
"""
Justificacion calculation functions.

Note: estado_de_la_iniciativa and fecha_de_ultimo_estado are now
looked up from datos_relevantes, not calculated here.
"""
from sqlalchemy.orm import Session
from typing import Optional

from ..models import Justificacion


def calc_justificacion_regulatoria(db: Session, portfolio_id: str) -> Optional[str]:
    """Get regulatory justification from justificaciones table."""
    result = db.query(Justificacion.valor).filter(
        Justificacion.portfolio_id == portfolio_id,
        Justificacion.tipo_justificacion.ilike('%legal%') |
        Justificacion.tipo_justificacion.ilike('%regulat%')
    ).first()

    return result[0] if result else None


def calc_falta_justificacion_regulatoria(db: Session, portfolio_id: str) -> int:
    """Return 1 if justificacion_regulatoria is missing, 0 otherwise."""
    justificacion = calc_justificacion_regulatoria(db, portfolio_id)
    return 0 if justificacion else 1
```

---

### Step 5: Implement Importe Functions (importe.py)

```python
"""
Importe calculation functions.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..models import Hecho, Facturacion


def calc_importe(
    db: Session,
    portfolio_id: str,
    year: int,
    tipo: str = "Importe"
) -> float:
    """Calculate importe based on year and type."""
    partida = f"{year}.0"

    if tipo == "Importe":
        return _importe_iniciativa(db, portfolio_id, partida)
    elif tipo == "Budget":
        return _importe_planificado(db, portfolio_id, partida)
    elif tipo == "SM200":
        return _importe_sm200(db, portfolio_id, partida)
    return 0.0


def _importe_iniciativa(db: Session, portfolio_id: str, partida: str) -> float:
    """Get importe from latest record matching specific estados."""
    valid_states = (
        'SM200 Final', 'Importe Planificado', 'Aprobada', 'Aprobada con CCT',
        'Revisión Regulación', 'En ejecución', 'SM200 En Revisión', 'Facturación cierre año'
    )
    result = db.query(Hecho.importe).filter(
        Hecho.portfolio_id == portfolio_id,
        Hecho.partida_presupuestaria == partida,
        Hecho.importe != 0,
        Hecho.estado.in_(valid_states)
    ).order_by(Hecho.id_hecho.desc()).first()

    return float(result[0]) if result and result[0] else 0.0


def _importe_sm200(db: Session, portfolio_id: str, partida: str) -> float:
    """Get importe from SM200 records."""
    result = db.query(Hecho.importe).filter(
        Hecho.portfolio_id == portfolio_id,
        Hecho.partida_presupuestaria == partida,
        Hecho.importe != 0,
        Hecho.estado.in_(['SM200 Final', 'SM200 En Revisión'])
    ).order_by(Hecho.id_hecho.desc()).first()

    return float(result[0]) if result and result[0] else 0.0


def _importe_planificado(db: Session, portfolio_id: str, partida: str) -> float:
    """Cascading logic: planificado_fijo -> SM200 -> importe."""
    # Try planificado fijo
    result = db.query(Hecho.importe).filter(
        Hecho.portfolio_id == portfolio_id,
        Hecho.partida_presupuestaria == partida,
        Hecho.importe != 0,
        Hecho.estado == 'Importe Planificado'
    ).order_by(Hecho.fecha.desc()).first()

    if result and result[0]:
        return float(result[0])

    # Try SM200
    sm200 = _importe_sm200(db, portfolio_id, partida)
    if sm200:
        return sm200

    # Fallback to importe
    return _importe_iniciativa(db, portfolio_id, partida)


def calc_importe_facturado(db: Session, portfolio_id: str, year: int) -> float:
    """Sum facturacion by year."""
    result = db.query(func.sum(Facturacion.importe)).filter(
        Facturacion.portfolio_id == portfolio_id,
        Facturacion.ano == year
    ).scalar()

    return float(result) if result else 0.0
```

---

### Step 6: Implement Utils (utils.py)

```python
"""
Utility functions for calculated fields.
"""
from sqlalchemy.orm import Session
from typing import Optional

from ..models import InformacionEconomica, DatosRelevante, GrupoIniciativa
from .lookup import lookup_datos_relevantes


def calc_debe_tener(db: Session, portfolio_id: str, field: str) -> int:
    """Check if a field should be required based on business rules."""
    # Lookup the current value
    obj = db.query(InformacionEconomica).filter(
        InformacionEconomica.portfolio_id == portfolio_id
    ).first()

    if not obj:
        return 0

    # Business rule: if importe_2025 > 0, field is required
    importe = lookup_datos_relevantes(db, portfolio_id, "importe_2025")
    if importe and float(importe) > 0:
        return 1
    return 0


def calc_falta_evaluacion_impacto(db: Session, portfolio_id: str) -> Optional[str]:
    """Check if impact evaluation is missing."""
    # This would check if tiene_impacto_en_aatt is set
    # For now, return None - implement based on business rules
    return None


def calc_sum_grupo_importes(db: Session, portfolio_id_grupo: str) -> float:
    """Sum importe_2025 of all components in a group."""
    # Get all components for this group
    components = db.query(GrupoIniciativa.portfolio_id_componente).filter(
        GrupoIniciativa.portfolio_id_grupo == portfolio_id_grupo
    ).all()

    total = 0.0
    for (pid_componente,) in components:
        importe = lookup_datos_relevantes(db, pid_componente, "importe_2025")
        if importe:
            total += float(importe)

    return total
```

---

### Step 7: Create Calculator Service (__init__.py)

```python
"""
Calculated fields package.
"""
from .definitions import (
    CALCULATED_FIELDS,
    READONLY_TABLES,
    FIELD_CALCULATORS,
    get_calculated_fields,
    is_readonly_table,
    is_calculated_field,
)
from .service import CalculatedFieldService

__all__ = [
    "CALCULATED_FIELDS",
    "READONLY_TABLES",
    "FIELD_CALCULATORS",
    "get_calculated_fields",
    "is_readonly_table",
    "is_calculated_field",
    "CalculatedFieldService",
]
```

**Create service.py:**

```python
"""
Service for calculating fields.
"""
import logging
from sqlalchemy.orm import Session
from typing import Any, Optional

from .definitions import FIELD_CALCULATORS, get_calculated_fields
from .lookup import (
    lookup_datos_descriptivos,
    lookup_datos_relevantes,
    lookup_informacion_economica,
    lookup_grupo_componente,
)
from .estado import (
    calc_justificacion_regulatoria,
    calc_falta_justificacion_regulatoria,
)
from .importe import calc_importe, calc_importe_facturado
from .utils import calc_debe_tener, calc_falta_evaluacion_impacto, calc_sum_grupo_importes

logger = logging.getLogger(__name__)


class CalculatedFieldService:
    """Service for calculating fields."""

    def __init__(self, db: Session):
        self.db = db

    def calculate_field(
        self,
        field_name: str,
        portfolio_id: str,
        record: dict = None
    ) -> Optional[Any]:
        """Calculate a single field value."""
        calculator = FIELD_CALCULATORS.get(field_name)
        if not calculator:
            return None

        calc_type = calculator[0]

        if calc_type == "lookup":
            source_table = calculator[1]
            source_field = calculator[2]
            if source_table == "datos_descriptivos":
                return lookup_datos_descriptivos(self.db, portfolio_id, source_field)
            elif source_table == "datos_relevantes":
                return lookup_datos_relevantes(self.db, portfolio_id, source_field)
            elif source_table == "informacion_economica":
                return lookup_informacion_economica(self.db, portfolio_id, source_field)

        elif calc_type == "lookup_grupo":
            # Special case for grupos - use portfolio_id_componente
            source_field = calculator[2]
            pid_componente = record.get("portfolio_id_componente") if record else None
            if pid_componente:
                return lookup_grupo_componente(self.db, pid_componente, source_field)

        elif calc_type == "function":
            func_name = calculator[1]
            kwargs = calculator[2] if len(calculator) > 2 else {}

            if func_name == "calc_justificacion_regulatoria":
                return calc_justificacion_regulatoria(self.db, portfolio_id)
            elif func_name == "calc_falta_justificacion_regulatoria":
                return calc_falta_justificacion_regulatoria(self.db, portfolio_id)
            elif func_name == "calc_importe":
                return calc_importe(self.db, portfolio_id, **kwargs)
            elif func_name == "calc_importe_facturado":
                return calc_importe_facturado(self.db, portfolio_id, **kwargs)
            elif func_name == "calc_debe_tener":
                return calc_debe_tener(self.db, portfolio_id, **kwargs)
            elif func_name == "calc_falta_evaluacion_impacto":
                return calc_falta_evaluacion_impacto(self.db, portfolio_id)
            elif func_name == "calc_sum_grupo_importes":
                return calc_sum_grupo_importes(self.db, portfolio_id)

        return None

    def populate_calculated_fields(
        self,
        table_name: str,
        record: dict
    ) -> dict:
        """Populate all calculated fields for a record."""
        portfolio_id = record.get("portfolio_id")
        if not portfolio_id:
            return record

        result = dict(record)
        for field in get_calculated_fields(table_name):
            try:
                value = self.calculate_field(field, portfolio_id, record)
                result[field] = value
            except Exception as e:
                logger.warning(f"Error calculating {field} for {portfolio_id}: {e}")
                result[field] = None

        return result

    def strip_calculated_fields(self, table_name: str, data: dict) -> dict:
        """Remove calculated fields from input data."""
        calc_fields = get_calculated_fields(table_name)
        result = {}
        for key, value in data.items():
            if key in calc_fields:
                logger.debug(f"Stripping calculated field {key} from input")
            else:
                result[key] = value
        return result
```

---

### Step 8: Modify CRUD Operations (crud.py)

Add calculated field handling:

```python
# Add to crud.py

from .calculated_fields import (
    CalculatedFieldService,
    get_calculated_fields,
    is_readonly_table,
)

class CRUDBase(Generic[ModelType]):
    # ... existing code ...

    def create(self, db: Session, obj_in: dict) -> ModelType:
        """Create a new record, stripping calculated fields."""
        table_name = self.model.__tablename__

        # Strip calculated fields
        service = CalculatedFieldService(db)
        clean_data = service.strip_calculated_fields(table_name, obj_in)

        # ... rest of create logic ...

    def update(self, db: Session, db_obj: ModelType, obj_in: dict) -> ModelType:
        """Update a record, stripping calculated fields."""
        table_name = self.model.__tablename__

        # Strip calculated fields
        service = CalculatedFieldService(db)
        clean_data = service.strip_calculated_fields(table_name, obj_in)

        # ... rest of update logic ...


def model_to_dict_with_calculated(
    db: Session,
    obj: Any,
    table_name: str
) -> dict:
    """Convert model to dict with calculated fields populated."""
    base_dict = model_to_dict(obj)
    service = CalculatedFieldService(db)
    return service.populate_calculated_fields(table_name, base_dict)
```

---

### Step 9: Modify Search Operations (search.py)

Add calculated field population to search results.

---

### Step 10: Update Routers

Update each router to use the enhanced CRUD with calculated fields.

---

### Step 11: Update Documentation

- Update `specs/architecture_backend.md`
- Update `README.md`

---

## Files to Create

| File | Purpose |
|------|---------|
| `backend/app/calculated_fields/__init__.py` | Package exports |
| `backend/app/calculated_fields/definitions.py` | Field definitions |
| `backend/app/calculated_fields/lookup.py` | Lookup functions |
| `backend/app/calculated_fields/estado.py` | Estado calculations |
| `backend/app/calculated_fields/importe.py` | Importe calculations |
| `backend/app/calculated_fields/utils.py` | Helper functions |
| `backend/app/calculated_fields/service.py` | Main service class |

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/crud.py` | Add calculated field stripping on write, population on read |
| `backend/app/search.py` | Add calculated field population to results |
| `backend/app/routers/*.py` | Use enhanced CRUD functions |
| `specs/architecture_backend.md` | Document calculated fields |
| `README.md` | Update documentation |

---

## Testing Plan

1. **Unit tests for each calculation function**
2. **Integration tests for CRUD operations**
3. **Verify calculated fields are stripped on write**
4. **Verify calculated fields are populated on read**
5. **Test search operations with calculated fields**

---

## Rollback Plan

If issues arise:
1. Remove `calculated_fields` package
2. Revert changes to crud.py and search.py
3. Revert router changes
