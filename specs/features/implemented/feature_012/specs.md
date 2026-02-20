# Feature 12: Calculated Fields

## Overview

This feature introduces a distinction between **master fields** (stored in database) and **calculated fields** (computed on-the-fly by the API). Calculated fields are derived from other tables and should not be stored or modified directly.

## Technology Stack

- **Framework:** FastAPI (existing)
- **ORM:** SQLAlchemy 2.0 (existing)
- **New Package:** `app/calculated_fields/` - Calculation functions

---

## 1. Calculated Fields Definition

### 1.1 Completely Calculated Tables (Read-Only)

These tables have ALL fields calculated:

| Table | Description |
|-------|-------------|
| `datos_relevantes` | Computed by management module, all 60+ columns |
| `iniciativas` | Computed from multiple sources |

### 1.2 Tables with Calculated Fields

The following tables have specific fields that are calculated:

| Table | Calculated Fields | Source |
|-------|-------------------|--------|
| **datos_descriptivos** | estado_de_la_iniciativa, justificacion_regulatoria, falta_justificacion_regulatoria | hechos, justificaciones |
| **justificaciones** | nombre, digital_framework_level_1 | datos_descriptivos |
| **grupos_iniciativas** | nombre_componente, importe_2025_componente, importe_2025_grupo | datos_relevantes |
| **informacion_economica** | nombre, referente_bi, cluster_2025, digital_framework_level_1, origen, estado, debe_tener_cini, debe_tener_capex_opex, debe_tener_fecha_prevista_pes, debe_tener_wbe, budget_2026, importe_2025, importe_2026 | datos_descriptivos, datos_relevantes, hechos |
| **facturacion** | descripcion | datos_descriptivos |
| **datos_ejecucion** | nombre, unidad, estado_de_la_iniciativa, fecha_de_ultimo_estado, origen, importe_2025, importe_facturado_2025, tipo_agrupacion | datos_descriptivos, datos_relevantes, facturacion |
| **hechos** | nombre, referente_bi | datos_descriptivos |
| **beneficios** | nombre, estado_de_la_iniciativa | datos_descriptivos, datos_relevantes |
| **etiquetas** | nombre | datos_descriptivos |
| **ltp** | nombre, digital_framework_level_1 | datos_descriptivos |
| **wbes** | nombre | datos_descriptivos |
| **notas** | nombre, referente_bi | datos_descriptivos |
| **avance** | descripcion | datos_descriptivos |
| **acciones** | nombre, unidad, estado, cluster_2025, tipo, siguiente_accion, siguiente_accion_comentarios, referente_bi, referente_b_unit, referente_ict, importe_2025, importe_2026 | datos_descriptivos, datos_relevantes |
| **descripciones** | nombre, digital_framework_level_1, estado_de_la_iniciativa, referente_b_unit | datos_descriptivos, datos_relevantes |
| **estado_especial** | nombre | datos_descriptivos |
| **investment_memos** | nombre | datos_descriptivos |
| **impacto_aatt** | nombre, estado_de_la_iniciativa, digital_framework_level_1, fecha_prevista_finalizacion, fecha_finalizacion_ict, falta_evaluacion_impacto_aatt | datos_descriptivos, datos_relevantes |

---

## 2. Calculation Functions

### 2.1 Function Categories

| Category | Function | Description |
|----------|----------|-------------|
| **Lookup** | `lookup_from_datos_descriptivos()` | Get field value from datos_descriptivos by portfolio_id |
| **Lookup** | `lookup_from_datos_relevantes()` | Get field value from datos_relevantes by portfolio_id |
| **Lookup** | `lookup_from_informacion_economica()` | Get field value from informacion_economica by portfolio_id |
| **Importe** | `calc_importe()` | Calculate importe based on year and type |
| **Importe** | `calc_importe_facturado()` | Sum facturacion by year |
| **Boolean** | `calc_debe_tener_*()` | Business rules for required fields |
| **Boolean** | `calc_falta_*()` | Check if required field is missing |
| **Justificacion** | `calc_justificacion_regulatoria()` | Get regulatory justification |

### 2.2 Field to Function Mapping

#### Simple Lookups from datos_descriptivos

These fields are direct lookups using `portfolio_id`:

```python
LOOKUP_DATOS_DESCRIPTIVOS = {
    "nombre": "nombre",
    "unidad": "unidad",
    "origen": "origen",
    "digital_framework_level_1": "digital_framework_level_1",
    "cluster_2025": "cluster_2025",
    "referente_bi": "referente_bi",
    "referente_b_unit": "referente_b_unit",
    "tipo_agrupacion": "tipo_agrupacion",
}
```

#### Simple Lookups from datos_relevantes

These fields are direct lookups using `portfolio_id`:

```python
LOOKUP_DATOS_RELEVANTES = {
    "estado_de_la_iniciativa": "estado_de_la_iniciativa",
    "estado": "estado_de_la_iniciativa",  # Alias
    "fecha_de_ultimo_estado": "fecha_de_ultimo_estado",
    "tipo": "tipo",
    "importe_2025": "importe_2025",
    "importe_2026": "importe_2026",
    "budget_2026": "budget_2026",
    "siguiente_accion": "siguiente_accion",
    "siguiente_accion_comentarios": "fecha_limite_comentarios",
    "fecha_prevista_finalizacion": "fecha_prevista_pes",
}
```

Note: `estado_de_la_iniciativa` and `fecha_de_ultimo_estado` are looked up from `datos_relevantes`, which is pre-computed by the management module.

#### Lookups from informacion_economica

```python
LOOKUP_INFORMACION_ECONOMICA = {
    "capex_opex": "capex_opex",
    "cini": "cini",
    "fecha_prevista_pes": "fecha_prevista_pes",
}
```

#### Calculated Functions

| Field | Function | Logic |
|-------|----------|-------|
| `justificacion_regulatoria` | `calc_justificacion_regulatoria()` | Lookup from justificaciones table by tipo |
| `falta_justificacion_regulatoria` | `calc_falta_justificacion()` | 1 if justificacion_regulatoria is empty, 0 otherwise |
| `importe_2025` | `calc_importe(2025, "Importe")` | Calculate from hechos |
| `importe_2026` | `calc_importe(2026, "Importe")` | Calculate from hechos |
| `importe_facturado_2025` | `calc_importe_facturado(2025)` | Sum from facturacion |
| `budget_2026` | `calc_importe(2026, "Budget")` | Calculate from hechos |
| `debe_tener_cini` | `calc_debe_tener("cini")` | Business rule check |
| `debe_tener_capex_opex` | `calc_debe_tener("capex_opex")` | Business rule check |
| `debe_tener_fecha_prevista_pes` | `calc_debe_tener("fecha_prevista_pes")` | Business rule check |
| `debe_tener_wbe` | `calc_debe_tener("wbe")` | Business rule check |
| `falta_evaluacion_impacto_aatt` | `calc_falta_evaluacion()` | Check if impact evaluation is missing |
| `nombre_componente` | `lookup_grupos("nombre")` | Get nombre from datos_relevantes for componente |
| `importe_2025_componente` | `lookup_grupos("importe_2025")` | Get importe from datos_relevantes for componente |
| `importe_2025_grupo` | `sum_grupo_importes()` | Sum importe_2025 of all components |

---

## 3. API Behavior

### 3.1 Create/Update Operations

When creating or updating records, calculated fields are:
1. **Stripped from input** - Not saved to database
2. **Ignored in validation** - Not required in request body
3. **Logged as warning** if provided in input

### 3.2 Read Operations (GET, Search)

When reading records:
1. **Fetch master data** from database
2. **Calculate** each calculated field using the appropriate function
3. **Merge** calculated values with master data
4. **Return** complete record with all fields

### 3.3 Response Behavior

All responses include calculated fields computed on-the-fly:

```json
{
  "id": 1,
  "portfolio_id": "P001",
  "master_field_1": "value",
  "master_field_2": "value",
  "nombre": "Calculated from datos_descriptivos",
  "estado_de_la_iniciativa": "Calculated from hechos"
}
```

---

## 4. Directory Structure

```text
backend/app/
├── calculated_fields/
│   ├── __init__.py           # Package init, exports
│   ├── definitions.py        # Field definitions and mappings
│   ├── lookup.py             # Lookup functions
│   ├── estado.py             # Estado calculation functions
│   ├── importe.py            # Importe calculation functions
│   └── utils.py              # Helper functions
├── crud.py                   # Modified: strip calculated fields on write
├── search.py                 # Modified: add calculated fields on read
└── routers/
    └── *.py                  # Modified: use enhanced CRUD
```

---

## 5. Configuration

### 5.1 Field Definitions (definitions.py)

```python
# Tables with calculated fields
CALCULATED_FIELDS = {
    "datos_descriptivos": [
        "estado_de_la_iniciativa",
        "justificacion_regulatoria",
        "falta_justificacion_regulatoria"
    ],
    "hechos": ["nombre", "referente_bi"],
    "beneficios": ["nombre", "estado_de_la_iniciativa"],
    # ... etc
}

# Completely calculated tables (read-only, no writes allowed)
READONLY_TABLES = ["datos_relevantes", "iniciativas"]

# Field to calculation function mapping
FIELD_CALCULATORS = {
    "nombre": ("lookup", "datos_descriptivos", "nombre"),
    "estado_de_la_iniciativa": ("function", "calc_estado_iniciativa"),
    "importe_2025": ("function", "calc_importe", {"year": 2025, "type": "Importe"}),
    # ... etc
}
```

---

## 6. Error Handling

| Scenario | Behavior |
|----------|----------|
| Calculated field in POST/PUT body | Warning log, field stripped |
| Lookup source record not found | Return None/null |
| Calculation error | Log error, return None/null |
| Circular dependency | Prevented by design (datos_relevantes is pre-computed) |

---

## 7. Performance Considerations

1. **Batch lookups**: For list operations, batch all lookups by portfolio_id
2. **Caching**: datos_relevantes is pre-computed, used as cache
3. **Lazy calculation**: Only calculate fields requested (future optimization)

---

## 8. Testing

```python
# Test calculated field stripping
def test_create_strips_calculated_fields():
    data = {"portfolio_id": "P001", "nombre": "Should be stripped"}
    result = crud.create(db, data)
    # Assert nombre was not saved

# Test calculated field population
def test_read_populates_calculated_fields():
    result = crud.get(db, id=1)
    assert result["nombre"] is not None  # Calculated from datos_descriptivos
```
