# Feature 030 — CUD Operations for 13 Entities on Detail Page

## Overview

Extend the CUD (Create/Update/Delete) modal pattern established in feature_029 (Notas) to 13 additional entities: datos_descriptivos, informacion_economica, justificaciones, descripciones, etiquetas, grupos_iniciativas, wbes, dependencias, ltp, hechos, acciones, estado_especial, and impacto_aatt. All operations use the `transacciones_json` audit trail system.

## Entity Classification

### 1:1 Entities (single record per portfolio_id)

These entities have at most one record per initiative. The CUD modal for these entities offers **create** (if no record exists) or **edit+delete** (if record exists). The edit button appears in the section header (not per-row).

| Entity                | PK        | portfolio_id unique?     | Current Section Component                     |
| --------------------- | --------- | ------------------------ | --------------------------------------------- |
| datos_descriptivos    | id (auto) | No (but effectively 1:1) | DatosDescriptivosSection (KeyValueDisplay)    |
| informacion_economica | id (auto) | Yes (unique)             | InformacionEconomicaSection (KeyValueDisplay) |
| estado_especial       | id (auto) | Yes (unique)             | EstadoEspecialSection (KeyValueDisplay)       |
| impacto_aatt          | id (auto) | Yes (unique)             | **NEW** ImpactoAattSection (KeyValueDisplay)  |
| acciones              | id (auto) | No (but typically 1:1)   | AccionesSection (SimpleTable)                 |

### 1:N Entities (multiple records per portfolio_id)

These entities have multiple records per initiative. The CUD modal offers **create** (Plus button in section header) and **edit+delete** (Pencil icon per row). Follows the exact Notas pattern.

| Entity             | PK                  | Current Section Component               |
| ------------------ | ------------------- | --------------------------------------- |
| justificaciones    | id (auto)           | JustificacionesSection (SimpleTable)    |
| descripciones      | id (auto)           | DescripcionesSection (card layout)      |
| etiquetas          | id (auto)           | EtiquetasSection (SimpleTable)          |
| grupos_iniciativas | id (auto)           | GruposIniciativasSection (dual display) |
| wbes               | id (auto)           | WbesSection (SimpleTable)               |
| dependencias       | id (auto)           | DependenciasSection (SimpleTable)       |
| ltp                | id (auto)           | LtpSection (SimpleTable)                |
| hechos             | id_hecho (NOT auto) | HechosSection (SimpleTable)             |

## Entity Field Definitions

### (1) datos_descriptivos

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| portfolio_id | Portfolio ID | text | Yes (create) | - | Read-only in edit mode |
| nombre | Nombre | text | No | - | |
| unidad | Unidad | text | No | - | |
| origen | Origen | text | No | "Nuevo 26" | |
| digital_framework_level_1 | Digital Framework | text | No | - | |
| tipo_proyecto | Tipo | text | No | - | |
| prioridad_descriptiva_bi | Prioridad BI | text | No | "SIN DEFINIR" | |
| priorizacion | Priorizacion | text | No | "96 PENDIENTE PRIORIZAR" | |
| tipo_proyecto | Tipo Proyecto | text | No | "DEV" | |
| referente_bi | Referente BI | text | No | "SIN IDENTIFICAR" | |
| referente_b_unit | Referente B-Unit | text | No | "SIN IDENTIFICAR" | |
| referente_enabler_ict | Referente ICT | text | No | - | |
| it_partner | IT Partner | text | No | "SIN IDENTIFICAR" | |
| codigo_jira | Codigo Jira | text | No | - | |
| tipo_agrupacion | Tipo Agrupacion | text | No | "Iniciativa Individual" | |

**Read-only fields:** fecha_creacion, fecha_actualizacion (auto-managed by backend)

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (2) informacion_economica

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| cini | CINI | text | No | "PENDIENTE DEFINIR" | Requirements say "cono" but model has "cini" |
| capex_opex | CAPEX/OPEX | select | No | "PENDIENTE DEFINIR" | Options: "CAPEX", "OPEX", "PENDIENTE DEFINIR" |
| fecha_prevista_pes | Fecha Prevista PES | date | No | - | Date picker |
| cluster | Cluster | text | No | "PENDIENTE DEFINIR" | |
| finalidad_budget | Finalidad Budget | text | No | "PENDIENTE DEFINIR" | |
| proyecto_especial | Proyecto Especial | text | No | "PENDIENTE DEFINIR" | |
| clasificacion | Clasificacion | text | No | "PENDIENTE DEFINIR" | |
| tlc | TLC | text | No | "PENDIENTE DEFINIR" | |
| tipo_inversion | Tipo Inversion | text | No | "PENDIENTE DEFINIR" | |
| observaciones | Observaciones | longtext | No | - | Textarea |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (3) justificaciones

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| tipo_justificacion | Tipo Justificacion | text | No | - | |
| valor | Valor | longtext | No | - | Textarea |
| fecha_modificacion | Fecha Modificacion | datetime | No | current datetime | Datetime picker |
| origen_registro | Origen Registro | text | No | - | |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (4) descripciones

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| tipo_descripcion | Tipo Descripcion | text | No | - | |
| descripcion | Descripcion | longtext | No | - | Textarea |
| origen_registro | Origen Registro | text | No | - | |
| comentarios | Comentarios | longtext | No | - | Textarea |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (5) etiquetas

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| etiqueta | Etiqueta | text | No | - | |
| valor | Valor | text | No | - | |
| origen_registro | Origen Registro | text | No | - | |
| comentarios | Comentarios | longtext | No | - | Textarea |

**Read-only fields:** fecha_modificacion (auto-set to current date on create/update)

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (6) grupos_iniciativas

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| portfolio_id_grupo | Portfolio ID Grupo | text | No | - | |
| portfolio_id_componente | Portfolio ID Componente | text | No | - | |
| nombre_grupo | Nombre Grupo | text | No | - | |
| tipo_agrupacion_grupo | Tipo Agrupacion Grupo | text | No | - | |
| tipo_agrupacion_componente | Tipo Agrupacion Componente | text | No | - | |

**Note:** This entity does NOT have a `portfolio_id` column. Transaction clave_primaria uses `{ id: record.id }` for UPDATE/DELETE. For INSERT, we need the parent `portfolio_id` context — but since the entity doesn't have a `portfolio_id` column, the insert payload must include either `portfolio_id_grupo` or `portfolio_id_componente` depending on the relationship direction.

**Transaction clave_primaria:** `{ id: record.id }` for all operations.

### (7) wbes

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| anio | Anio | number | No | current year | Integer |
| wbe_pyb | WBE PyB | text | No | - | |
| descripcion_pyb | Descripcion PyB | text | No | - | |
| wbe_can | WBE CAN | text | No | - | |
| descripcion_can | Descripcion CAN | text | No | - | |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (8) dependencias

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| descripcion_dependencia | Descripcion Dependencia | longtext | No | - | Textarea |
| fecha_dependencia | Fecha Dependencia | date | No | - | Date picker (model stores as Text) |
| comentarios | Comentarios | longtext | No | - | Textarea |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (9) ltp

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| responsable | Responsable | text | No | - | |
| tarea | Tarea | longtext | No | - | Textarea |
| siguiente_accion | Siguiente Accion | longtext | No | - | Textarea |
| estado | Estado | text | No | - | |
| comentarios | Comentarios | longtext | No | - | Textarea |

**Note:** LTP has `fecha_creacion` as Text type (not DateTime), so backend auto-set of `fecha_actualizacion` works but `fecha_creacion` is handled differently.

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (10) hechos

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| partida_presupuestaria | Partida Presupuestaria | text | No | - | |
| importe | Importe | currency | No | - | Monetary: 2 decimal € mask |
| estado | Estado | text | No | - | |
| fecha | Fecha | date | No | current date | Date picker |
| importe_ri | Importe RI | currency | No | - | Monetary: 2 decimal € mask |
| importe_re | Importe RE | currency | No | - | Monetary: 2 decimal € mask |
| notas | Notas | longtext | No | - | Textarea |
| racional | Racional | longtext | No | - | Textarea |
| calidad_estimacion | Calidad Estimacion | text | No | - | |

**Special:** `id_hecho` is NOT auto-increment. For INSERT, the frontend must calculate next available id_hecho (max existing + 1) or backend must handle this.

**Transaction clave_primaria:** `{ id_hecho: record.id_hecho }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (11) acciones

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| siguiente_accion_comentarios | Comentarios Siguiente Accion | longtext | No | - | Textarea |

**Note:** Only one field is editable per the requirements. The modal will be minimal.

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (12) estado_especial

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| estado_especial | Estado Especial | text | No | - | |
| comentarios | Comentarios | longtext | No | - | Textarea |
| fecha_modificacion | Fecha Modificacion | date | No | current date | Auto-set on insert/update |

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

### (13) impacto_aatt

**Editable fields:**
| Field | Label | Type | Required | Default | Notes |
|-------|-------|------|----------|---------|-------|
| tiene_impacto_en_aatt | Tiene Impacto en AATT | text | No | - | |
| afecta_a_ut_red_mt_bt | Afecta UT Red MT/BT | text | No | - | |
| afecta_om_cc | Afecta OM CC | text | No | - | |
| afecta_pm | Afecta PM | text | No | - | |
| afecta_hseq | Afecta HSEQ | text | No | - | |
| afecta_inspecciones | Afecta Inspecciones | text | No | - | |
| afecta_at | Afecta AT | text | No | - | |
| comentario | Comentario | longtext | No | - | Textarea (note: column name is "comentario" singular, not "comentarios") |

**Note:** impacto_aatt has NO section component yet — must create `ImpactoAattSection.jsx`.

**Transaction clave_primaria:** `{ id: record.id }` for UPDATE/DELETE, `{ portfolio_id: portfolioId }` for INSERT

## Central Configuration System

### Default Values Configuration

All entity default values will be centralized in a single configuration file:

**File:** `frontend/src/features/detail/config/entityDefaults.js`

```javascript
export const ENTITY_DEFAULTS = {
  datos_descriptivos: {
    origen: "Nuevo 26",
    prioridad_descriptiva_bi: "SIN DEFINIR",
    priorizacion: "96 PENDIENTE PRIORIZAR",
    tipo_proyecto: "DEV",
    referente_bi: "SIN IDENTIFICAR",
    referente_b_unit: "SIN IDENTIFICAR",
    it_partner: "SIN IDENTIFICAR",
    tipo_agrupacion: "Iniciativa Individual",
  },
  informacion_economica: {
    cini: "PENDIENTE DEFINIR",
    capex_opex: "PENDIENTE DEFINIR",
    cluster: "PENDIENTE DEFINIR",
    finalidad_budget: "PENDIENTE DEFINIR",
    proyecto_especial: "PENDIENTE DEFINIR",
    clasificacion: "PENDIENTE DEFINIR",
    tlc: "PENDIENTE DEFINIR",
    tipo_inversion: "PENDIENTE DEFINIR",
  },
  justificaciones: {
    fecha_modificacion: () => new Date().toISOString().slice(0, 19), // datetime
  },
  wbes: {
    anio: () => new Date().getFullYear(),
  },
  hechos: {
    fecha: () => new Date().toISOString().slice(0, 10), // date
  },
  estado_especial: {
    fecha_modificacion: () => new Date().toISOString().slice(0, 10), // date
  },
  // Entities with no defaults: descripciones, etiquetas, grupos_iniciativas,
  // dependencias, ltp, acciones, impacto_aatt
};
```

### Long-Text Field Configuration

Long-text fields will be centralized in a single configuration file so that any field can be toggled between single-line `<Input>` and multi-line `<textarea>`:

**File:** `frontend/src/features/detail/config/entityFieldConfig.js`

```javascript
export const LONG_TEXT_FIELDS = {
  datos_descriptivos: [],
  informacion_economica: ["observaciones"],
  justificaciones: ["valor"],
  descripciones: ["descripcion", "comentarios"],
  etiquetas: ["comentarios"],
  grupos_iniciativas: [],
  wbes: [],
  dependencias: ["descripcion_dependencia", "comentarios"],
  ltp: ["tarea", "siguiente_accion", "comentarios"],
  hechos: ["notas", "racional"],
  acciones: ["siguiente_accion_comentarios"],
  estado_especial: ["comentarios"],
  impacto_aatt: ["comentario"],
};
```

### Monetary Field Configuration

Currency fields use a 2-decimal euro mask input:

```javascript
export const MONETARY_FIELDS = {
  hechos: ["importe", "importe_ri", "importe_re"],
};
```

## CUD Modal Behavior

### Create Mode (all entities)

1. Dialog opens with empty fields (except defaults from `ENTITY_DEFAULTS`)
2. `registrado_por` / `usuario` auto-set from Clerk `useUser()`
3. For 1:N entities: Plus button in SectionAccordion header
4. For 1:1 entities: Plus/Edit button in SectionAccordion header (contextual)
5. Submit creates INSERT transaction → process → refetch

### Edit Mode (all entities)

1. Dialog opens with current record values
2. Change detection: only changed fields in `cambios`
3. For 1:N entities: Pencil icon per row
4. For 1:1 entities: Pencil icon in section header
5. Submit creates UPDATE transaction → process → refetch

### Delete Mode (all entities)

1. Available in edit mode via "Eliminar" button
2. Requires commit message (validated before ConfirmDialog opens)
3. ConfirmDialog for confirmation
4. Submit creates DELETE transaction → process → refetch

### Special: etiquetas fecha_modificacion

The `fecha_modificacion` field in etiquetas is read-only in the form but auto-set to current date on insert and update. This is handled in the frontend by always including it in the `cambios` payload.

### Special: estado_especial fecha_modificacion

Similarly, `fecha_modificacion` is auto-set to current date on insert and update.

### Special: hechos id_hecho

Since `id_hecho` is not auto-increment, the INSERT transaction must determine the next available id. Strategy: the frontend sends the INSERT without `id_hecho`, and the transaction processor or a pre-processing step calculates `max(id_hecho) + 1` for the given portfolio_id (or globally).

**Decision:** The backend transaction_processor will be enhanced to auto-generate `id_hecho` for hechos INSERTs if not provided. This keeps the frontend simple and avoids race conditions.

## UI Components

### Generic EntityFormModal Pattern

To avoid code duplication, create a **generic `EntityFormModal`** component that is data-driven by a field configuration array. Each entity passes its field definitions, and the modal renders the appropriate input types (text, textarea, date, datetime, currency, select, read-only).

**File:** `frontend/src/features/detail/components/EntityFormModal.jsx`

**Props:**

- `open`, `onOpenChange` — dialog state
- `mode` — 'create' | 'edit'
- `entityName` — table name for transaction (e.g., 'hechos')
- `entityLabel` — display name (e.g., 'Hecho')
- `portfolioId` — current initiative
- `record` — existing record for edit mode (null for create)
- `fields` — array of field definitions (key, label, type, required, readOnly, options)
- `onSuccess` — refetch callback

This generic modal encapsulates all the CUD patterns:

- useUser() for identity
- Form state reset via useEffect on open
- Auto-focus on first editable field
- Change detection for UPDATE
- Toast notifications
- ConfirmDialog for delete
- Tab order (tabIndex={-1} on Eliminar/Cancelar)
- Commit message validation

### CurrencyInput Component

**File:** `frontend/src/components/ui/currency-input.jsx`

A masked input that:

- Displays value formatted as `1.234,56 ` with 2 decimal places
- Uses Spanish locale formatting (dot for thousands, comma for decimals)
- Stores raw numeric value internally
- Handles paste and keyboard input

### ImpactoAattSection Component

**File:** `frontend/src/features/detail/components/sections/ImpactoAattSection.jsx`

New section component using KeyValueDisplay pattern (1:1 entity). Must be added to the DetailPage and sections index.

## Backend Changes

### Transaction Processor Enhancement

**File:** `backend/app/services/transaction_processor.py`

Add special handling for `hechos` INSERT: auto-generate `id_hecho` if not provided in the payload. Calculate as `max(id_hecho) + 1` across all hechos records (or start at 1 if none exist).

### etiquetas fecha_modificacion auto-set

The transaction processor already auto-sets `fecha_actualizacion`. For etiquetas, the frontend will explicitly include `fecha_modificacion` in the cambios payload (set to current date).

Similarly for estado_especial `fecha_modificacion`.

## Architecture Documentation Updates

After implementation:

1. Update `specs/architecture/architecture_frontend.md` section 14.4 with:
   - Reference to `entityDefaults.js` and `entityFieldConfig.js` configuration files
   - Reference to `EntityFormModal` generic component
   - Updated entity CUD status table
2. Update `specs/architecture/architecture_backend.md` with:
   - `id_hecho` auto-generation in transaction processor
3. Update `README.md` with feature_030 description
