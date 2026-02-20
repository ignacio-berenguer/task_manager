# Technical Specification — feature_037: Parametric Tables

## 1. Overview

Add a parametric values system that stores dropdown options for 14 codified fields in a single database table. The migration CLI populates this table from actual data. The backend exposes an endpoint to retrieve values by parameter name. The frontend uses these values to render `<select>` dropdowns in all entity edit/create forms.

## 2. Design Decision: Single Table vs. Multiple Tables

**Chosen: Single `parametros` table** with a discriminator column `nombre_parametro`.

| Approach | Pros | Cons |
|----------|------|------|
| 14 separate tables | FK constraints, clearer schema | Schema bloat (14 DDL blocks, 14 models, 14 routers, 14 migration functions) |
| Single table | Minimal schema changes, 1 model, 1 router, 1 migration function, easy to add new parameters later | No FK constraints (not needed — these are reference values, not relational) |

Rationale: These are display/validation values, not relational entities. A single table is much simpler to maintain and extend. Adding a new parameter field in the future requires zero schema/code changes — just an INSERT.

## 3. Database Schema

### 3.1 New Table: `parametros`

```sql
-- ============================================================================
-- PARAMETRIC VALUES (Feature 037)
-- ============================================================================

-- Lookup values for codified fields (dropdowns in UI)
-- Populated during migration from actual data values
CREATE TABLE parametros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_parametro TEXT NOT NULL,    -- Field identifier (e.g. 'estado', 'cluster')
    valor TEXT NOT NULL,               -- The actual value
    orden INTEGER,                     -- Sort order (NULL = alphabetical)
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nombre_parametro, valor)
);

CREATE INDEX idx_parametros_nombre ON parametros (nombre_parametro);
```

### 3.2 Parametric Fields and Source Tables

| Parameter Name | Source Table | Source Column | Notes |
|---------------|-------------|---------------|-------|
| `digital_framework_level_1` | datos_descriptivos | digital_framework_level_1 | |
| `estado` | hechos | estado | Used in hechos and ltp forms |
| `origen` | datos_descriptivos | origen | |
| `priorizacion` | datos_descriptivos | priorizacion | |
| `tipo` | iniciativas | tipo | |
| `cluster` | datos_descriptivos | cluster | Also used in informacion_economica |
| `unidad` | datos_descriptivos | unidad | Also used in impacto_aatt |
| `anio` | facturacion | ano | Integer years, stored as text |
| `capex_opex` | informacion_economica | capex_opex | |
| `prioridad_descriptiva_bi` | datos_descriptivos | prioridad_descriptiva_bi | |
| `tipo_proyecto` | datos_descriptivos | tipo_proyecto | |
| `referente_bi` | datos_descriptivos | referente_bi | Also in impacto_aatt |
| `tipo_agrupacion` | datos_descriptivos | tipo_agrupacion | Also in grupos_iniciativas |
| `it_partner` | datos_descriptivos | it_partner | Also in impacto_aatt |

### 3.3 Special Case: `estado` — Canonical Sort Order

The `estado` field in `hechos` and `ltp` tables refers to the estado of a hecho/ltp record. These values have a **mandatory workflow sort order** defined by the `orden` column:

| orden | valor |
|-------|-------|
| 1 | Recepción |
| 2 | SM100 Redacción |
| 3 | SM100 Final |
| 4 | SM200 En Revision |
| 5 | SM200 Final |
| 6 | Análisis BI |
| 7 | Revisión Regulación |
| 8 | En Revisión P&C |
| 9 | Pendiente de Unidad Solicitante |
| 10 | Encolada por Prioridad |
| 11 | En Aprobación |
| 12 | Aprobada |
| 13 | Aprobada con CCT |
| 14 | En ejecución |
| 15 | Finalizado |
| 16 | Pendiente PES |
| 17 | PES Completado |
| 18 | Facturación cierre año |
| 19 | Cierre económico iniciativa |
| 20 | Importe Estimado |
| 21 | Importe Planificado |

During migration:
1. All known estado values above are inserted with their explicit `orden` value
2. Any additional estado values found in `hechos.estado` that are NOT in this list are inserted with `orden = NULL` (they will sort alphabetically after the ordered values)

This is the **only parameter** that uses the `orden` column. All other parameters have `orden = NULL` and sort alphabetically.

Note: `estado_de_la_iniciativa` is NOT included in this feature because it uses the separate canonical workflow ordering from `estadoOrder.js` and is currently only displayed read-only (computed by the system).

## 4. Management Module Changes

### 4.1 Migration Phase 9: Parametric Data

A new **Phase 9** is added to `migrate_all()` in `engine.py`, executed **after all other migrations** (after Phase 8: Fichas).

Steps:
1. **Truncate** `parametros` table (DELETE FROM parametros)
2. **Query** distinct non-NULL, non-empty values from each source table/column
3. **Insert** each value with its `nombre_parametro`
4. **Log** count per parameter name

### 4.2 Implementation: `populate_parametros()` Method

New method on `MigrationEngine`:

```python
PARAMETRIC_SOURCES = [
    ('digital_framework_level_1', 'datos_descriptivos', 'digital_framework_level_1'),
    ('estado', 'hechos', 'estado'),
    ('origen', 'datos_descriptivos', 'origen'),
    ('priorizacion', 'datos_descriptivos', 'priorizacion'),
    ('tipo', 'iniciativas', 'tipo'),
    ('cluster', 'datos_descriptivos', 'cluster'),
    ('unidad', 'datos_descriptivos', 'unidad'),
    ('anio', 'facturacion', 'ano'),
    ('capex_opex', 'informacion_economica', 'capex_opex'),
    ('prioridad_descriptiva_bi', 'datos_descriptivos', 'prioridad_descriptiva_bi'),
    ('tipo_proyecto', 'datos_descriptivos', 'tipo_proyecto'),
    ('referente_bi', 'datos_descriptivos', 'referente_bi'),
    ('tipo_agrupacion', 'datos_descriptivos', 'tipo_agrupacion'),
    ('it_partner', 'datos_descriptivos', 'it_partner'),
]
```

For each entry: `SELECT DISTINCT {column} FROM {table} WHERE {column} IS NOT NULL AND TRIM({column}) != ''`

For `anio`: cast INTEGER to TEXT via `CAST(ano AS TEXT)`.

**Special handling for `estado`:**

A predefined ordered list of 21 estado values is defined in the migration code. The process:
1. Insert all 21 known values with their `orden` (1–21), regardless of whether they exist in current data
2. Query `hechos.estado` for distinct values
3. Insert any additional values found in data (not in the known list) with `orden = NULL`

This ensures the dropdown always shows the full canonical set of estados in workflow order, plus any unexpected values at the end.

### 4.3 Logging

- INFO: "Phase 9: Populating parametric tables"
- INFO: Per parameter: "Parametro '{name}': {count} values"
- INFO: Summary: "Total parametric values: {total}"

## 5. Backend Changes

### 5.1 SQLAlchemy Model

New model `Parametro` in `models.py`:

```python
class Parametro(Base):
    __tablename__ = "parametros"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_parametro = Column(Text, nullable=False)
    valor = Column(Text, nullable=False)
    orden = Column(Integer)
    fecha_creacion = Column(DateTime, default=func.now())
```

### 5.2 API Router

New router `routers/parametros.py` with a **single read-only endpoint**:

```
GET /api/v1/parametros/{nombre_parametro}
```

Response: `{ "nombre_parametro": "cluster", "valores": ["Cluster A", "Cluster B", ...] }`

The endpoint:
1. Queries `SELECT valor, orden FROM parametros WHERE nombre_parametro = ? ORDER BY CASE WHEN orden IS NOT NULL THEN 0 ELSE 1 END, orden, valor`
2. Returns sorted list of string values
3. Returns empty list if parameter name not found (not 404 — allows graceful degradation)

No create/update/delete endpoints — parametros are managed exclusively by the migration CLI.

### 5.3 Router Registration

- Add to `main.py`: `app.include_router(parametros.router, prefix=settings.API_PREFIX)`
- No need to add to `table_registry.py` (not used for cross-table search or transaction processing)

## 6. Frontend Changes

### 6.1 API Hook: `useParametricOptions`

New hook in `frontend/src/features/detail/hooks/useParametricOptions.js`:

```javascript
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useParametricOptions(nombreParametro) {
  return useQuery({
    queryKey: ['parametros', nombreParametro],
    queryFn: async () => {
      const { data } = await apiClient.get(`/parametros/${nombreParametro}`)
      return data.valores
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (values change rarely)
    enabled: !!nombreParametro,
  })
}
```

### 6.2 EntityFormModal Enhancement

The `EntityFormModal` already supports `<select>` via `getSelectOptions()` from `entityFieldConfig.js`. Currently, options are **hardcoded** in that file.

**New approach**: Add a `parametric` property to field definitions. When present, `EntityFormModal` fetches options from the API instead of using hardcoded values.

Field definition change:
```javascript
// Before
{ key: 'cluster', label: 'Cluster' }

// After
{ key: 'cluster', label: 'Cluster', parametric: 'cluster' }
```

In `EntityFormModal.renderField()`:
1. Check if field has `parametric` property
2. If yes, use `useParametricOptions(field.parametric)` to get options
3. Render `<select>` with those options (plus an empty "Seleccionar..." placeholder)
4. Show loading state while fetching

### 6.3 Parametric Hook Integration

Since React hooks can't be called conditionally, `EntityFormModal` will use a wrapper approach:
- Collect all `parametric` field names from the fields array
- Fetch all parametric values with a single batch approach or individual queries
- Pass resolved options down to renderField

Implementation detail: Create a `useParametricFields` hook that accepts the fields array and returns a map of `{ fieldKey: options[] }`:

```javascript
export function useParametricFields(fields) {
  // Get unique parametric names from fields
  const parametricFields = fields.filter(f => f.parametric)

  // Use useQueries for parallel fetching
  const queries = useQueries({
    queries: parametricFields.map(f => ({
      queryKey: ['parametros', f.parametric],
      queryFn: () => apiClient.get(`/parametros/${f.parametric}`).then(r => r.data.valores),
      staleTime: 10 * 60 * 1000,
    }))
  })

  // Build map: { fieldKey: string[] }
  const optionsMap = {}
  parametricFields.forEach((f, i) => {
    optionsMap[f.key] = queries[i].data || []
  })

  return { optionsMap, isLoading: queries.some(q => q.isLoading) }
}
```

### 6.4 Field Configuration Updates

Add `parametric` property to field definitions in `DetailPage.jsx` and section components:

**DATOS_DESCRIPTIVOS_FIELDS:**
- `unidad` → `parametric: 'unidad'`
- `origen` → `parametric: 'origen'`
- `digital_framework_level_1` → `parametric: 'digital_framework_level_1'`
- `tipo_proyecto` → `parametric: 'tipo_proyecto'`
- `prioridad_descriptiva_bi` → `parametric: 'prioridad_descriptiva_bi'`
- `priorizacion` → `parametric: 'priorizacion'`
- `referente_bi` → `parametric: 'referente_bi'`
- `it_partner` → `parametric: 'it_partner'`
- `tipo_agrupacion` → `parametric: 'tipo_agrupacion'`

**INFO_ECONOMICA_FIELDS:**
- `capex_opex` → `parametric: 'capex_opex'` (replaces hardcoded SELECT_OPTIONS)
- `cluster` → `parametric: 'cluster'`

**HECHOS_FIELDS (in HechosSection.jsx):**
- `estado` → `parametric: 'estado'`

**GRUPOS_FIELDS (in GruposIniciativasSection.jsx):**
- `tipo_agrupacion_grupo` → `parametric: 'tipo_agrupacion'`
- `tipo_agrupacion_componente` → `parametric: 'tipo_agrupacion'`

**WBES_FIELDS (in WbesSection.jsx):**
- `anio` → `parametric: 'anio'`

**IMPACTO_AATT_FIELDS:**
- `unidad` → `parametric: 'unidad'`
- `referente_bi` → `parametric: 'referente_bi'`
- `it_partner` → `parametric: 'it_partner'`

### 6.5 Removing Hardcoded SELECT_OPTIONS

The `capex_opex` entry in `entityFieldConfig.js` SELECT_OPTIONS will be removed once its parametric equivalent is working. The `getSelectOptions()` function remains as a fallback for any fields that may still need hardcoded options in the future.

### 6.6 Select Rendering

The `<select>` rendering in `EntityFormModal` will:
1. Include a disabled placeholder option: `<option value="" disabled>Seleccionar...</option>`
2. List all parametric values as `<option value={val}>{val}</option>`
3. The current value from the form data is pre-selected
4. If the current value exists in data but NOT in parametros (legacy data), it is still shown as selected to prevent data loss

## 7. Files Modified

### Database
- `db/schema.sql` — Add `parametros` table DDL

### Management
- `management/src/migrate/engine.py` — Add `populate_parametros()` method, call in `migrate_all()` Phase 9

### Backend
- `backend/app/models.py` — Add `Parametro` model
- `backend/app/routers/parametros.py` — New router (read-only)
- `backend/app/routers/__init__.py` — Export new router
- `backend/app/main.py` — Register router

### Frontend
- `frontend/src/features/detail/hooks/useParametricOptions.js` — New hook
- `frontend/src/features/detail/components/EntityFormModal.jsx` — Support `parametric` field property
- `frontend/src/features/detail/DetailPage.jsx` — Add `parametric` to field defs
- `frontend/src/features/detail/components/sections/HechosSection.jsx` — Add `parametric` to estado field
- `frontend/src/features/detail/components/sections/GruposIniciativasSection.jsx` — Add `parametric` to tipo_agrupacion fields
- `frontend/src/features/detail/components/sections/WbesSection.jsx` — Add `parametric` to anio field
- `frontend/src/features/detail/components/sections/ImpactoAattSection.jsx` — Add `parametric` to fields (if it has edit form)
- `frontend/src/features/detail/config/entityFieldConfig.js` — Remove hardcoded capex_opex options

### Documentation
- `README.md` — Update table count, add parametros description
- `specs/architecture/architecture_backend.md` — Document parametros endpoint
- `specs/architecture/architecture_frontend.md` — Document parametric field pattern

## 8. Non-Goals

- No admin UI for managing parametric values (managed exclusively by migration)
- No FK constraints between entity tables and parametros (lookup only, not relational)
- No `estado_de_la_iniciativa` parameter (uses canonical order from `estadoOrder.js`)
- No parametric filtering in Dashboard/Search/Reports (those use existing filter-options endpoints)
