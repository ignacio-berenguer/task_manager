# Implementation Plan — Feature 030: CUD Operations for 13 Entities

## Phase 0: Foundation — Configuration Files & Generic Components

### Step 0.1: Create entity configuration files

Create the centralized configuration files that parametrize defaults, long-text fields, and monetary fields.

**Files to create:**
- `frontend/src/features/detail/config/entityDefaults.js` — Default values per entity
- `frontend/src/features/detail/config/entityFieldConfig.js` — Long-text fields, monetary fields, select options, read-only fields per entity

### Step 0.2: Create CurrencyInput component

**File to create:** `frontend/src/components/ui/currency-input.jsx`

Masked input for monetary fields. Displays `1.234,56 €` format, stores raw float. Used by hechos (importe, importe_ri, importe_re).

### Step 0.3: Create generic EntityFormModal

**File to create:** `frontend/src/features/detail/components/EntityFormModal.jsx`

Data-driven modal that receives a field configuration array and renders the appropriate form. Encapsulates all CUD patterns from feature_029:
- useUser() for identity
- useEffect on `open` for form state reset
- Auto-focus on first editable field
- Change detection for UPDATE (only sends dirty fields)
- Toast notifications (sonner)
- ConfirmDialog for delete (with commit message validation)
- Tab order: fields → commit → submit (tabIndex={-1} on Eliminar/Cancelar)
- Transaction payload building and submission

Each field definition in the config array specifies:
```javascript
{
  key: 'field_name',        // database column name
  label: 'Display Label',   // form label
  type: 'text|longtext|date|datetime|currency|select|number',
  required: false,           // HTML required attribute
  readOnly: false,           // disabled input
  readOnlyOnEdit: false,     // read-only only in edit mode (e.g., portfolio_id)
  options: [],               // for select type: array of { value, label }
}
```

Default values are resolved from `entityDefaults.js` at modal open time. Long-text fields are resolved from `entityFieldConfig.js` to render `<textarea>` vs `<Input>`.

### Step 0.4: Backend — Enhance transaction_processor for hechos id_hecho

**File to modify:** `backend/app/services/transaction_processor.py`

Add auto-generation of `id_hecho` for hechos INSERT when not provided. Query `max(id_hecho)` and use `max + 1` (or 1 if no records exist).

---

## Phase 1: 1:N Entities with SimpleTable Display (7 entities)

These follow the exact Notas pattern. Each entity needs:
1. Field definitions array for EntityFormModal
2. Section component updated with edit capability (Pencil buttons per row)
3. DetailPage updated with headerAction (Plus button) and create modal state

### Step 1.1: justificaciones

**Files to modify:**
- `frontend/src/features/detail/components/sections/JustificacionesSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for justificaciones

**Fields:** tipo_justificacion, valor (longtext), fecha_modificacion (datetime), origen_registro

### Step 1.2: descripciones

**Files to modify:**
- `frontend/src/features/detail/components/sections/DescripcionesSection.jsx` — Add Pencil edit buttons per card, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for descripciones

**Fields:** tipo_descripcion, descripcion (longtext), origen_registro, comentarios (longtext)

### Step 1.3: etiquetas

**Files to modify:**
- `frontend/src/features/detail/components/sections/EtiquetasSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for etiquetas

**Fields:** etiqueta, valor, origen_registro, comentarios (longtext)
**Special:** fecha_modificacion auto-set to current date (included in cambios but not shown in form as editable)

### Step 1.4: wbes

**Files to modify:**
- `frontend/src/features/detail/components/sections/WbesSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for wbes

**Fields:** anio (number, default=current year), wbe_pyb, descripcion_pyb, wbe_can, descripcion_can

### Step 1.5: dependencias

**Files to modify:**
- `frontend/src/features/detail/components/sections/DependenciasSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for dependencias

**Fields:** descripcion_dependencia (longtext), fecha_dependencia (date), comentarios (longtext)

### Step 1.6: ltp

**Files to modify:**
- `frontend/src/features/detail/components/sections/LtpSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for ltp

**Fields:** responsable, tarea (longtext), siguiente_accion (longtext), estado, comentarios (longtext)

### Step 1.7: hechos

**Files to modify:**
- `frontend/src/features/detail/components/sections/HechosSection.jsx` — Add Pencil edit buttons per row, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for hechos

**Fields:** partida_presupuestaria, importe (currency), estado, fecha (date, default=today), importe_ri (currency), importe_re (currency), notas (longtext), racional (longtext), calidad_estimacion
**Special:** id_hecho auto-generated by backend

### Step 1.8: grupos_iniciativas

**Files to modify:**
- `frontend/src/features/detail/components/sections/GruposIniciativasSection.jsx` — Add Pencil edit buttons, `portfolioId`/`onRefetch` props, edit modal state
- `frontend/src/features/detail/DetailPage.jsx` — Add Plus button headerAction, create modal state for grupos_iniciativas

**Fields:** portfolio_id_grupo, portfolio_id_componente, nombre_grupo, tipo_agrupacion_grupo, tipo_agrupacion_componente
**Special:** No `portfolio_id` column — the create modal includes these fields directly, transaction clave_primaria uses `{ id: record.id }`

---

## Phase 2: 1:1 Entities with KeyValueDisplay (4 entities)

These entities show a single record. The CUD pattern is slightly different:
- If no record exists → show "Create" button (Plus icon) in section header
- If record exists → show "Edit" button (Pencil icon) in section header
- Edit modal pre-fills all current values
- Delete removes the single record

### Step 2.1: datos_descriptivos

**Files to modify:**
- `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx` — Add `portfolioId`/`onRefetch` props (edit trigger handled in DetailPage)
- `frontend/src/features/detail/DetailPage.jsx` — Add Pencil/Plus headerAction, modal state for datos_descriptivos

**Fields:** portfolio_id (readOnlyOnEdit), nombre, unidad, origen, digital_framework_level_1, prioridad_descriptiva_bi, priorizacion, tipo_proyecto, referente_bi, referente_b_unit, referente_enabler_ict, it_partner, codigo_jira, tipo_agrupacion

### Step 2.2: informacion_economica

**Files to modify:**
- `frontend/src/features/detail/components/sections/InformacionEconomicaSection.jsx` — Add `portfolioId`/`onRefetch` props
- `frontend/src/features/detail/DetailPage.jsx` — Add Pencil/Plus headerAction, modal state

**Fields:** cini, capex_opex (select: CAPEX/OPEX/PENDIENTE DEFINIR), fecha_prevista_pes (date), cluster, finalidad_budget, proyecto_especial, clasificacion, tlc, tipo_inversion, observaciones (longtext)

### Step 2.3: estado_especial

**Files to modify:**
- `frontend/src/features/detail/components/sections/EstadoEspecialSection.jsx` — Add `portfolioId`/`onRefetch` props
- `frontend/src/features/detail/DetailPage.jsx` — Add Pencil/Plus headerAction, modal state

**Fields:** estado_especial, comentarios (longtext), fecha_modificacion (date, auto-set to current date)

### Step 2.4: acciones

**Files to modify:**
- `frontend/src/features/detail/components/sections/AccionesSection.jsx` — Add edit capability
- `frontend/src/features/detail/DetailPage.jsx` — Add headerAction, modal state

**Fields:** siguiente_accion_comentarios (longtext)
**Note:** Acciones is treated as 1:N in the DB (no unique constraint), but only one field is editable. The modal will be minimal. Per-row edit via Pencil icons in the SimpleTable.

---

## Phase 3: New Section — impacto_aatt

### Step 3.1: Create ImpactoAattSection component

**File to create:** `frontend/src/features/detail/components/sections/ImpactoAattSection.jsx`

KeyValueDisplay pattern (1:1 entity) showing:
- tiene_impacto_en_aatt, afecta_a_ut_red_mt_bt, afecta_om_cc, afecta_pm, afecta_hseq, afecta_inspecciones, afecta_at, comentario

### Step 3.2: Integrate into DetailPage

**Files to modify:**
- `frontend/src/features/detail/components/sections/index.js` — Export ImpactoAattSection
- `frontend/src/features/detail/DetailPage.jsx` — Add ImpactoAatt SectionAccordion with CUD headerAction
  - Extract `impacto_aatt` data using `getFirstOrSelf(data.impacto_aatt)`
  - Position after Estado Especial section

### Step 3.3: Add CUD capability

Same pattern as estado_especial (1:1 entity with Pencil/Plus in header).

**Fields:** tiene_impacto_en_aatt, afecta_a_ut_red_mt_bt, afecta_om_cc, afecta_pm, afecta_hseq, afecta_inspecciones, afecta_at, comentario (longtext)

---

## Phase 4: Documentation & Cleanup

### Step 4.1: Update architecture_frontend.md

- Add section on entity configuration files (entityDefaults.js, entityFieldConfig.js)
- Add section on EntityFormModal generic component
- Update section 14.4 with complete entity CUD status table
- Document CurrencyInput component

### Step 4.2: Update architecture_backend.md

- Document id_hecho auto-generation in transaction_processor

### Step 4.3: Update README.md

- Add feature_030 description to feature history
- Update Detail Page capabilities description

---

## Implementation Strategy: Subagent Delegation

Per Requirement 3, use subagents to conserve context window:

- **Phase 0** can be implemented with 2-3 parallel subagents (config files, CurrencyInput, EntityFormModal, backend change)
- **Phase 1** entities can be implemented in batches of 2-3 parallel subagents, each handling one entity's section updates + DetailPage wiring
- **Phase 2** entities can similarly be parallelized
- **Phase 3** is a single subagent (new component + DetailPage integration)
- **Phase 4** documentation updates can be done sequentially after all code is complete

Each subagent receives:
1. The NotaFormModal.jsx + NotasSection.jsx as reference implementation
2. The EntityFormModal.jsx generic component (created in Phase 0)
3. The specific entity's field definitions from specs.md
4. The current section component to modify
5. Clear instructions on what to create/modify

---

## File Summary

### New files (5):
1. `frontend/src/features/detail/config/entityDefaults.js`
2. `frontend/src/features/detail/config/entityFieldConfig.js`
3. `frontend/src/features/detail/components/EntityFormModal.jsx`
4. `frontend/src/components/ui/currency-input.jsx`
5. `frontend/src/features/detail/components/sections/ImpactoAattSection.jsx`

### Modified files (16):
1. `backend/app/services/transaction_processor.py` — id_hecho auto-generation
2. `frontend/src/features/detail/DetailPage.jsx` — 13 new modal states + headerActions
3. `frontend/src/features/detail/components/sections/JustificacionesSection.jsx`
4. `frontend/src/features/detail/components/sections/DescripcionesSection.jsx`
5. `frontend/src/features/detail/components/sections/EtiquetasSection.jsx`
6. `frontend/src/features/detail/components/sections/WbesSection.jsx`
7. `frontend/src/features/detail/components/sections/DependenciasSection.jsx`
8. `frontend/src/features/detail/components/sections/LtpSection.jsx`
9. `frontend/src/features/detail/components/sections/HechosSection.jsx`
10. `frontend/src/features/detail/components/sections/GruposIniciativasSection.jsx`
11. `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx`
12. `frontend/src/features/detail/components/sections/InformacionEconomicaSection.jsx`
13. `frontend/src/features/detail/components/sections/EstadoEspecialSection.jsx`
14. `frontend/src/features/detail/components/sections/AccionesSection.jsx`
15. `frontend/src/features/detail/components/sections/index.js`
16. `specs/architecture/architecture_frontend.md`
17. `specs/architecture/architecture_backend.md`
18. `README.md`

### Estimated Complexity

- **Phase 0:** Medium — Generic EntityFormModal is the most complex piece (~200-250 lines)
- **Phase 1:** Low per entity — Each entity follows the same pattern, mostly configuration
- **Phase 2:** Low per entity — Similar pattern with 1:1 variations
- **Phase 3:** Low — Standard KeyValueDisplay section + CUD wiring
- **Phase 4:** Low — Documentation updates
