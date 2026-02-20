# Feature 020: Cierre Económico Iniciativa - Technical Specifications

## Overview

Add support for a new estado value "Cierre económico iniciativa" in the hechos table. This involves:
1. A new calculated boolean field `iniciativa_cerrada_economicamente` in `datos_relevantes`
2. Excluding this estado from all estado and importe calculations
3. Exposing the new field through the full stack (backend API, frontend dashboard/search/detail)

## Requirement 1: New Calculated Field in datos_relevantes

### Database Schema Change

Add a new TEXT column to `datos_relevantes` in `db/schema.sql`:

```sql
-- After estado_requisito_legal TEXT,
iniciativa_cerrada_economicamente TEXT,  -- "Si" or "No"
```

**Rationale for TEXT type:** The existing codebase uses TEXT with "Si"/"No" values for all boolean-like fields (e.g., `en_presupuesto_del_ano`, `esta_en_los_206_me_de_2026`). Maintaining this convention ensures consistency.

### Calculation Logic

**New function in `management/src/calculate/helper_functions.py`:**

```python
def iniciativa_cerrada_economicamente(conn, portfolio_id):
    """
    Check if initiative has been económicamente closed.
    Returns "Si" if a hechos record exists with estado = 'Cierre económico iniciativa',
    otherwise "No".
    """
    SELECT 1 FROM hechos
    WHERE portfolio_id = ? AND estado = 'Cierre económico iniciativa'
    LIMIT 1
```

- Returns `"Si"` if any record found, `"No"` otherwise
- Follows the exact pattern of `en_presupuesto_del_ano()` and `esta_en_los_206_me_de_2026()`

### Integration in Calculation Engine

**File: `management/src/calculate/engine.py`**

Add to `calculate_row()` return dict:
```python
'iniciativa_cerrada_economicamente': iniciativa_cerrada_economicamente(conn, portfolio_id),
```

Add the import in engine.py alongside existing helper function imports.

### Excel Export Mapping

**File: `management/src/export/excel_export.py`**

Add to `DATOS_RELEVANTES_COLUMN_MAPPING`:
```python
'iniciativa_cerrada_economicamente': 'Iniciativa cerrada económicamente',
```

Note: The requirements prompt has a typo "econonómicamente" - we use the corrected spelling.

## Requirement 2: Backend and Frontend Integration

### 2.1 Backend Changes

#### SQLAlchemy Model (`backend/app/models.py`)

Add to `DatosRelevante` class, after `estado_requisito_legal`:
```python
iniciativa_cerrada_economicamente = Column(Text)
```

No changes needed to:
- **Router** (`datos_relevantes.py`): Uses generic `SELECT *` / `model_to_dict()`, so the new column is automatically included in all GET and search responses
- **CRUD** (`crud.py`): Generic CRUDBase handles all columns dynamically
- **Search** (`search.py`): Generic search supports any model column as filter field

The new field will automatically be available as a filter in the `POST /datos-relevantes/search` endpoint using any operator (eq, ne, in, etc.).

### 2.2 Frontend Changes

#### Column Definitions (`frontend/src/features/search/utils/columnDefinitions.js`)

Add to `ALL_COLUMNS` array in the "Estado" category:
```javascript
{ id: 'iniciativa_cerrada_economicamente', label: 'Cerrada Econ.', type: 'text', category: 'Estado' },
```

#### Dashboard Page - Default Filters

**File: `frontend/src/features/dashboard/hooks/useDatosRelevantes.js`**

Current base filter:
```javascript
filters: [
  { field: 'estado_de_la_iniciativa', operator: 'ne', value: 'Cancelada' },
]
```

Updated base filter:
```javascript
filters: [
  { field: 'estado_de_la_iniciativa', operator: 'ne', value: 'Cancelado' },
  { field: 'iniciativa_cerrada_economicamente', operator: 'ne', value: 'Si' },
]
```

Note on "Cancelado" vs "Cancelada": The existing filter already uses `ne: 'Cancelada'`. The requirement mentions `estado <> "Cancelado"`. Since the actual data uses "Cancelada" (feminine, matching "iniciativa"), we keep `'Cancelada'` as-is. If the requirement intends a different value, the exact string can be adjusted.

**Dashboard FilterBar:** Add a toggle/checkbox for "Incluir cerradas económicamente" that removes the `iniciativa_cerrada_economicamente` filter when enabled. This follows the pattern of the existing FilterBar component.

#### Search Page - Default Filters

**File: `frontend/src/features/search/hooks/useSearchInitiatives.js`**

Add `iniciativa_cerrada_economicamente` as a filter in `buildSearchRequest()`:
```javascript
// New: Cerrada económicamente filter
{ key: 'cerradaEconomicamente', field: 'iniciativa_cerrada_economicamente' },
```

**Default filter state:** `cerradaEconomicamente: ['No']` - only show non-closed initiatives by default.

**Filter UI:** Add a checkbox or multi-select filter in the FilterPanel for "Cerrada Econ." with options ["Si", "No"].

#### Detail Page

**File: `frontend/src/features/detail/components/sections/ImportesSection.jsx`**

Add `iniciativa_cerrada_economicamente` to the fields displayed in the datos_relevantes section, in the "Other fields" area alongside `en_presupuesto_del_ano`, `calidad_valoracion`, etc.

Display format: Use the existing KeyValueDisplay component with:
```javascript
{ key: 'iniciativa_cerrada_economicamente', label: 'Iniciativa Cerrada Econ.', type: 'text' }
```

## Requirement 3: Exclude from Estado and Importe Calculations

### Estado Functions Exclusions

"Cierre económico iniciativa" must be added to `excluded_states` in every estado function that queries hechos, so this estado is never considered the "current" estado of an initiative.

#### `estado_iniciativa()` - `estado_functions.py`
```python
# Current:
excluded_states = ('Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado')
# Updated:
excluded_states = ('Cierre económico iniciativa', 'Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado')
```

#### `fecha_de_ultimo_estado()` - `estado_functions.py`
```python
# Same update as estado_iniciativa
excluded_states = ('Cierre económico iniciativa', 'Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado')
```

#### `estado_aprobacion_iniciativa()` - `estado_functions.py`
```python
# Current:
excluded_states = (
    'En ejecucion', 'Finalizado', 'Pendiente PES', 'PES completado',
    'Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado',
)
# Updated:
excluded_states = (
    'Cierre económico iniciativa',
    'En ejecucion', 'Finalizado', 'Pendiente PES', 'PES completado',
    'Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado',
)
```

#### `estado_ejecucion_iniciativa()` - `estado_functions.py`
```python
# Current:
excluded_states = ('Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado')
# Updated:
excluded_states = ('Cierre económico iniciativa', 'Facturacion cierre ano', 'Importe Planificado', 'Importe Estimado')
```

### Helper Functions Default Exclusions

#### `ultimo_id()` - `helper_functions.py`
```python
# Current default:
excluded_states = ('Importe Planificado', 'Facturacion cierre ano')
# Updated default:
excluded_states = ('Cierre económico iniciativa', 'Importe Planificado', 'Facturacion cierre ano')
```

#### `ultimo_id_aprobado()` - `helper_functions.py`
```python
# Current default:
excluded_states = (
    'Importe Planificado', 'Importe Estimado', 'Facturacion cierre ano',
    'En ejecucion', 'Finalizado', 'Pendiente PES', 'PES completado',
)
# Updated default:
excluded_states = (
    'Cierre económico iniciativa',
    'Importe Planificado', 'Importe Estimado', 'Facturacion cierre ano',
    'En ejecucion', 'Finalizado', 'Pendiente PES', 'PES completado',
)
```

### Importe Functions - No Changes Needed

The importe functions (`_importe_iniciativa`, `_importe_en_aprobacion`, `_importe_sm200`, `_importe_re`, `_importe_planificado_fijo`) use **explicit estado inclusion lists** (e.g., `estado IN ('Aprobada', 'Aprobada con CCT', ...)`). Since "Cierre económico iniciativa" is not in any of these inclusion lists, it is already implicitly excluded from all importe calculations. No changes are required.

## Files Modified Summary

| File | Change |
|------|--------|
| `db/schema.sql` | Add `iniciativa_cerrada_economicamente TEXT` column |
| `management/src/calculate/helper_functions.py` | New function + update `ultimo_id`/`ultimo_id_aprobado` defaults |
| `management/src/calculate/estado_functions.py` | Add to excluded_states in 4 functions |
| `management/src/calculate/engine.py` | Add to `calculate_row()` + import |
| `management/src/export/excel_export.py` | Add column mapping |
| `backend/app/models.py` | Add column to DatosRelevante model |
| `frontend/src/features/search/utils/columnDefinitions.js` | Add column definition |
| `frontend/src/features/dashboard/hooks/useDatosRelevantes.js` | Add default filter |
| `frontend/src/features/dashboard/components/FilterBar.jsx` | Add toggle for cerrada económicamente |
| `frontend/src/features/search/hooks/useSearchInitiatives.js` | Add default filter |
| `frontend/src/features/search/components/FilterPanel.jsx` | Add filter control |
| `frontend/src/features/detail/components/sections/ImportesSection.jsx` | Display new field |
| `specs/architecture_frontend.md` | Document new feature |
| `README.md` | Update documentation |

## Data Flow

```
hechos table (estado = "Cierre económico iniciativa")
    |
    v
calculate_datos_relevantes (management CLI)
    |-- helper_functions.iniciativa_cerrada_economicamente() --> "Si" / "No"
    |-- estado_functions.* --> excludes "Cierre económico iniciativa"
    |
    v
datos_relevantes table (iniciativa_cerrada_economicamente = "Si" or "No")
    |
    v
Backend API (automatic via SQLAlchemy model)
    |-- GET /datos-relevantes/ --> includes field
    |-- POST /datos-relevantes/search --> filterable
    |
    v
Frontend
    |-- Dashboard: default filter (ne "Si") + toggle
    |-- Search: default filter (eq "No") + checkbox filter
    |-- Detail: displayed in ImportesSection
```
