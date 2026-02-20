# Technical Specification — feature_064

## Overview

13 improvements across the stack: search UX fix, 3 new calculated fields + Excel export, chatbot UI/UX, parametros-based color customization, and system prompt enhancements.

---

## 1. Fix Search Page Free-Text Column Filter (Bug Fix)

### Root Cause

In `frontend/src/features/search/components/DataGrid.jsx` (line 250), the `tableColumns` useMemo includes `columnFilters` in its dependency array:

```javascript
}, [columns, sortConfig, onSort, isFavorite, onToggleFavorite, onOpenDrawer, onOpenLtpModal, columnFilters, onColumnFilterChange, data])
```

When the user types a character in a text filter:

1. `columnFilters` state updates in SearchPage
2. `tableColumns` useMemo recalculates (every keystroke)
3. The `header` function is recreated → `ColumnFilterButton` unmounts and remounts
4. The Popover with the text input is destroyed → focus lost after 1 character

### Solution

Remove `columnFilters` from the `tableColumns` useMemo dependency array. The `ColumnFilterButton` component already receives `columnFilters` and `onColumnFilterChange` as props; it doesn't need them to be part of the column definition memoization. Instead, pass them via a stable ref or move the filter state access inside the ColumnFilterButton component.

**Approach**: Use `useRef` for `columnFilters` and `onColumnFilterChange` inside DataGrid so the header function captures stable references. The ref values are always current without triggering useMemo recalculation.

### Files to Modify

| File                                                   | Change                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `frontend/src/features/search/components/DataGrid.jsx` | Use refs for columnFilters/onColumnFilterChange, remove from useMemo deps |

---

## 2. New Calculated Field: Estado SM100

### Business Logic

Indicates whether SM100 document is available for an initiative, derived from `estado_de_la_iniciativa`:

| estado_de_la_iniciativa           | estado_sm100     |
| --------------------------------- | ---------------- |
| `Recepción`                       | SM100 Pendiente  |
| `SM100 Redacción`                 | SM100 Pendiente  |
| `SM100 Final`                     | SM100 Disponible |
| `SM200 En Revisión`               | SM100 Disponible |
| `SM200 Final`                     | SM100 Disponible |
| `Análisis BI`                     | SM100 Disponible |
| `Pendiente de Unidad Solicitante` | SM100 Disponible |
| `Revisión Regulación`             | SM100 Disponible |
| `En Revisión P&C`                 | SM100 Disponible |
| `En Aprobación`                   | SM100 Disponible |
| `Encolada por Prioridad`          | SM100 Disponible |
| `Aprobada`                        | SM100 Disponible |
| `Aprobada con CCT`                | SM100 Disponible |
| `En ejecución`                    | SM100 Disponible |
| `Finalizado`                      | SM100 Disponible |
| `Pendiente PES`                   | SM100 Disponible |
| `Facturación cierre año`          | SM100 Disponible |
| `Cierre económico iniciativa`     | SM100 Disponible |
| `Importe Estimado`                | Error            |
| `Importe Planificado`             | Error            |
| `Cancelado`                       | Cancelada        |
| Empty/NULL                        | _(empty string)_ |

**Rule summary**: If estado is `Recepción` or `SM100 Redacción` → "SM100 Pendiente". If `Cancelado` → "Cancelada". Otherwise → "SM100 Disponible".

### Implementation

- **Management module**: New function `estado_sm100()` in `estado_functions.py`
- **Database**: New column `estado_sm100 TEXT` in `datos_relevantes` table
- **Backend**: New calculated field entry in `definitions.py` for lookup from datos_relevantes
- **Frontend**: New column definition + filter in Search, new field in Detail Datos Descriptivos
- **Excel export**: New entry in `DATOS_RELEVANTES_COLUMN_MAPPING`

---

## 3. New Calculated Field: Estado SM200

### Business Logic

Indicates whether SM200 document is available:

| estado_de_la_iniciativa                | estado_sm200     |
| -------------------------------------- | ---------------- |
| `Recepción`                            | SM200 Pendiente  |
| `SM100 Redacción`                      | SM200 Pendiente  |
| `SM100 Final`                          | SM200 Pendiente  |
| `SM200 En Revisión`                    | SM200 Pendiente  |
| `SM200 Final`                          | SM200 Disponible |
| `Análisis BI` through all later states | SM200 Disponible |
| `Importe Estimado`                     | Error            |
| `Importe Planificado`                  | Error            |
| `Cancelado`                            | Cancelada        |
| Empty/NULL                             | _(empty string)_ |

**Rule summary**: If estado is `Recepción`, `SM100 Redacción`, `SM100 Final`, or `SM200 En Revisión` → "SM200 Pendiente". If `Cancelado` → "Cancelada". Otherwise → "SM200 Disponible".

### Implementation

Same pattern as Estado SM100 — parallel function, column, calculated field entry.

---

## 4. New Calculated Field: Iniciativa Aprobada

### Business Logic

Indicates whether the initiative has been approved:

| estado_de_la_iniciativa                      | iniciativa_aprobada |
| -------------------------------------------- | ------------------- |
| `Recepción` through `Encolada por Prioridad` | No aprobada         |
| `Aprobada`                                   | Aprobada            |
| `Aprobada con CCT`                           | Aprobada            |
| `En ejecución`                               | Aprobada            |
| `Finalizado`                                 | Aprobada            |
| `Pendiente PES`                              | Aprobada            |
| `Facturación cierre año`                     | Aprobada            |
| `Cierre económico iniciativa`                | Aprobada            |
| `Importe Estimado`                           | Error               |
| `Importe Planificado`                        | Error               |
| `Cancelado`                                  | Cancelada           |
| Empty/NULL                                   | _(empty string)_    |

**Rule summary**: If estado is `Aprobada`, `Aprobada con CCT`, `En ejecución`, `Finalizado`, `Pendiente PES`, `Facturación cierre año`, or `Cierre económico iniciativa` → "Aprobada". If `Cancelado` → "Cancelada". Otherwise → "No aprobada".

**Note**: `Importe Estimado` and `Importe Planificado` are financial-only states that don't imply approval → "No aprobada".

### Implementation

Same pattern as Estado SM100.

---

## 5. Expose New Fields in Search & Detail

### Search Page

Add 3 new column definitions in `columnDefinitions.js`:

| Column ID             | Label               | Type     | Category | Filter Type       |
| --------------------- | ------------------- | -------- | -------- | ----------------- |
| `estado_sm100`        | Estado SM100        | `estado` | Estado   | select (3 values) |
| `estado_sm200`        | Estado SM200        | `estado` | Estado   | select (3 values) |
| `iniciativa_aprobada` | Iniciativa Aprobada | `estado` | Estado   | select (3 values) |

Each filter will show a select dropdown with its 3 possible values (plus the empty/all option).

### Detail Page

Add 3 new field entries to the `FIELDS` array in `DatosDescriptivosSection.jsx`:

```javascript
{ key: 'estado_sm100', label: 'Estado SM100', type: 'text' },
{ key: 'estado_sm200', label: 'Estado SM200', type: 'text' },
{ key: 'iniciativa_aprobada', label: 'Iniciativa Aprobada', type: 'text' },
```

These fields come from datos_relevantes via the calculated_fields lookup system. The portfolio endpoint (`/api/v1/portfolio/{pid}`) returns datos_relevantes data which already includes all columns.

### Backend Calculated Fields

Register the 3 new fields in `definitions.py`:

- Add to `CALCULATED_FIELDS["datos_descriptivos"]` list
- Add to `FIELD_CALCULATORS` as lookup fields from datos_relevantes

---

## 6. Chatbot UI Redesign

### Design Direction

Clean, minimalistic, futuristic aesthetic. Key changes:

#### Header

- Simplified header with gradient accent or subtle glow effect
- Status indicator (connected/thinking) with animated dot

#### Messages

- **User messages**: Right-aligned, with primary color gradient background, slightly rounded
- **Assistant messages**: Left-aligned, subtle background with frosted glass effect (`backdrop-blur`)
- Wider max-width for assistant messages (90% vs current 85%) for better readability
- Refined avatar icons with subtle glow ring
- Improved tool steps: streamlined accordion with monospace font for tool data, subtle border styling

#### Empty State

- Larger, centered hero area with animated gradient icon
- Example questions as pill-shaped buttons with hover glow effect
- Subtle animated background pattern or gradient

#### Input Area

- Rounded input container with subtle border glow on focus
- Integrated send button inside the input container (not separate)
- Character count or subtle typing indicator
- Smooth expand animation for multi-line input

#### Color & Effects

- Use CSS `backdrop-filter: blur()` for frosted glass panels
- Subtle gradient accents using primary color
- Smooth transitions on all interactive elements (200ms)
- Dark mode: deeper backgrounds with luminous accents

### Files to Modify

| File                                                      | Change                                                 |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `frontend/src/features/chat/ChatPage.jsx`                 | Header redesign, layout adjustments                    |
| `frontend/src/features/chat/components/ChatInput.jsx`     | Rounded container, embedded send button, focus glow    |
| `frontend/src/features/chat/components/MessageList.jsx`   | Empty state redesign                                   |
| `frontend/src/features/chat/components/MessageBubble.jsx` | New bubble styling, avatar glow, tool steps refinement |

---

## 7. Chatbot Input History (UP Arrow)

### Behavior

- Pressing UP arrow in the chat input cycles backward through previously sent messages
- Pressing DOWN arrow cycles forward through history
- History is session-scoped (stored in React state, not localStorage)
- History stores up to 50 most recent messages
- When at the oldest entry, UP does nothing; when at newest, DOWN clears input
- Typing new text resets the history pointer

### Implementation

Add a `useCommandHistory` custom hook:

```javascript
function useCommandHistory(maxSize = 50) {
  const [history, setHistory] = useState([]);
  const [pointer, setPointer] = useState(-1);

  const push = (command) => {
    /* add to history, reset pointer */
  };
  const navigateUp = () => {
    /* move pointer backward, return entry */
  };
  const navigateDown = () => {
    /* move pointer forward, return entry or '' */
  };
  const reset = () => {
    /* reset pointer to -1 */
  };

  return { push, navigateUp, navigateDown, reset };
}
```

Integrate in `ChatInput.jsx`:

- On `keydown` with `ArrowUp` (when input is on first line or empty): call `navigateUp()`, set input value
- On `keydown` with `ArrowDown` (when input is on last line or empty): call `navigateDown()`, set input value
- On submit: call `push(value)` before clearing

### Files to Modify

| File                                                  | Change                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `frontend/src/features/chat/components/ChatInput.jsx` | UP/DOWN key handling, integrate hook                   |
| `frontend/src/features/chat/hooks/useChat.js`         | Export history hook or manage alongside existing state |

---

## 8. Parametros-Based Color Customization

### Current State

**Estado colors** (`estadoColors.js`): 25 hardcoded estado_de_la_iniciativa values → Tailwind color classes. Used by `EstadoTag` component across the app.

**Etiqueta destacada colors** (`badgeColors.js`): 5 hardcoded color keys (blue, green, purple, orange, red) for featured tags. `etiquetas_destacadas` table already has a `color` column.

**Parametros table** (`db/schema.sql`): Generic master table with `nombre_parametro`, `valor`, `orden`. No color column currently.

### Changes

#### 8a. Add `color` column to `parametros` table

Add `color TEXT DEFAULT NULL` to the `parametros` table schema. This allows any parametric value to have an optional color assignment.

**Database schema change** (`db/schema.sql`):
```sql
CREATE TABLE IF NOT EXISTS parametros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_parametro TEXT NOT NULL,
    valor TEXT NOT NULL,
    color TEXT DEFAULT NULL,        -- NEW: color key (e.g., 'blue', 'emerald', 'red')
    orden INTEGER,
    UNIQUE(nombre_parametro, valor)
);
```

**Backend model change** (`backend/app/models.py`): Add `color = Column(Text, nullable=True)` to Parametro model.

**Backend API change** (`backend/app/schemas.py` or router): Include `color` in Parametro response/create/update schemas.

#### 8b. Seed estado_de_la_iniciativa colors in parametros

During migration or as INSERT statements in schema.sql, populate parametros with `nombre_parametro = 'estado_de_la_iniciativa'` entries for all 21 workflow estados with their default color keys:

| valor | color |
|-------|-------|
| Recepción | slate |
| SM100 Redacción | blue |
| SM100 Final | blue |
| SM200 En Revisión | blue |
| SM200 Final | blue |
| Análisis BI | amber |
| Pendiente de Unidad Solicitante | amber |
| Revisión Regulación | amber |
| En Revisión P&C | amber |
| En Aprobación | indigo |
| Encolada por Prioridad | indigo |
| Aprobada | emerald |
| Aprobada con CCT | emerald |
| En ejecución | cyan |
| Finalizado | green |
| Pendiente PES | gray |
| Facturación cierre año | gray |
| Cierre económico iniciativa | gray |
| Importe Estimado | violet |
| Importe Planificado | violet |
| Cancelado | red |

#### 8c. Frontend: Fetch colors from API

Create a new hook `useParametroColors(nombre_parametro)` that:
1. Calls `GET /parametros/{nombre_parametro}` (already exists, needs to return `color`)
2. Returns a map of `valor → color_key`
3. Uses 10-minute staleTime (same pattern as `useParametricFields`)

Update `EstadoTag` component to:
1. Accept an optional `colorOverride` prop
2. Try API-fetched color first, fall back to hardcoded `ESTADO_COLORS` if no API color set
3. The hardcoded map in `estadoColors.js` remains as the **default fallback** — not removed

#### 8d. Parametricas page: Color editing

Update the Parametricas management page to show a color dropdown/picker when editing parametros entries:
- Show a colored circle preview for each value that has a color assigned
- Reuse the same color palette as etiquetas_destacadas (15 colors)
- Color is optional — if NULL, the frontend falls back to hardcoded defaults

#### 8e. Expand etiquetas_destacadas color palette

Expand from 5 → 15 color options:

| Color Key | Light Mode BG | Light Mode Text | Dark Mode BG | Dark Mode Text |
| --------- | ------------- | --------------- | ------------ | -------------- |
| yellow    | yellow-100    | yellow-800      | yellow-900   | yellow-200     |
| pink      | pink-100      | pink-800        | pink-900     | pink-200       |
| indigo    | indigo-100    | indigo-800      | indigo-900   | indigo-200     |
| teal      | teal-100      | teal-800        | teal-900     | teal-200       |
| cyan      | cyan-100      | cyan-800        | cyan-900     | cyan-200       |
| amber     | amber-100     | amber-800       | amber-900    | amber-200      |
| lime      | lime-100      | lime-800        | lime-900     | lime-200       |
| rose      | rose-100      | rose-800        | rose-900     | rose-200       |
| slate     | slate-100     | slate-800       | slate-900    | slate-200      |
| emerald   | emerald-100   | emerald-800     | emerald-900  | emerald-200    |

Total: 15 colors (5 existing + 10 new). Shared across etiquetas_destacadas and parametros color pickers.

#### Color Preview in Form

Both `EtiquetaDestacadaFormDialog` and the Parametricas editor should show colored circle previews next to each color name.

### Files to Modify

| File | Change |
|------|--------|
| `db/schema.sql` | Add `color TEXT` column to `parametros` table + seed estado colors |
| `backend/app/models.py` | Add `color` field to Parametro model |
| `backend/app/routers/parametros.py` | Ensure color is included in CRUD responses |
| `frontend/src/lib/badgeColors.js` | Add 10 new color entries, add shared COLOR_PALETTE constant |
| `frontend/src/lib/estadoColors.js` | Keep as fallback defaults |
| `frontend/src/components/shared/EstadoTag.jsx` | Accept API-fetched color override |
| `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx` | Expand COLOR_OPTIONS + preview |
| `frontend/src/features/parametricas/ParametricasPage.jsx` | Add color dropdown to parametros editing |

---

## 9. System Prompt: Exclude Cancelado

### Current State

The system prompt at `backend/app/agent/system_prompt.py` already contains instructions to exclude Cancelado (lines ~209-213). However, the instruction needs reinforcement to ensure it's consistently applied.

### Changes

Strengthen the existing instruction and add it to the tool usage section as well:

```
REGLA CRÍTICA: Las iniciativas con estado_de_la_iniciativa = "Cancelado" NUNCA deben incluirse
en análisis, conteos, totalizaciones ni listados, a menos que el usuario pregunte
explícitamente por iniciativas canceladas.
```

Add filtering reminders to tool descriptions for `buscar_iniciativas`, `contar_iniciativas`, and `totalizar_importes`.

### Files to Modify

| File                                 | Change                                             |
| ------------------------------------ | -------------------------------------------------- |
| `backend/app/agent/system_prompt.py` | Reinforce Cancelado exclusion in multiple sections |

---

## 10. System Prompt: Default Current Year Importes

### Changes

Add instruction that when the user asks about "importes" or "presupuesto" without specifying a year, the agent should use the current year's importe fields:

```
REGLA DE IMPORTES POR DEFECTO: Cuando el usuario pregunte por importes, presupuesto,
facturación o cualquier dato económico sin especificar un año concreto, utiliza los
campos del año en curso ({current_year}). Los campos relevantes son:
- budget_{current_year} (presupuesto)
- importe_sm200_{yy} (SM200)
- importe_aprobado_{current_year} (aprobado)
- importe_citetic_{yy} (CITETIC)
- importe_facturacion_{current_year} (facturación)
- importe_{current_year} (importe final)

Si el usuario menciona "todos los años" o "histórico", incluye todos los años disponibles.
```

The current year should be dynamically injected from `datetime.now().year`.

### Files to Modify

| File                                 | Change                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| `backend/app/agent/system_prompt.py` | Add current year importe default rule, make year dynamic |

---

## 11. System Prompt: Include Current Date

### Changes

Add current date context at the top of the system prompt:

```python
from datetime import date

SYSTEM_PROMPT = f"""
Fecha actual: {date.today().isoformat()}
Año en curso: {date.today().year}

[... rest of prompt ...]
"""
```

This makes the prompt dynamically include the date every time the agent module loads (module-level evaluation). Since the backend process typically runs continuously, this will be accurate to the day the server started. For daily accuracy, convert `SYSTEM_PROMPT` to a function:

```python
def get_system_prompt():
    today = date.today()
    return f"Fecha actual: {today.isoformat()}\nAño en curso: {today.year}\n\n{_BASE_PROMPT}"
```

### Files to Modify

| File                                 | Change                                               |
| ------------------------------------ | ---------------------------------------------------- |
| `backend/app/agent/system_prompt.py` | Convert to function, inject current date/year        |
| `backend/app/agent/orchestrator.py`  | Call `get_system_prompt()` instead of using constant |

---

## 12. Excel Export of New Calculated Fields

### Current State

The Excel export in `management/src/export/excel_export.py` uses a hardcoded `DATOS_RELEVANTES_COLUMN_MAPPING` dict (63 entries) that maps DB column names to Excel header names. Only columns in this mapping are exported.

### Changes

Add 3 new entries to `DATOS_RELEVANTES_COLUMN_MAPPING`:

```python
'estado_sm100': 'Estado SM100',
'estado_sm200': 'Estado SM200',
'iniciativa_aprobada': 'Iniciativa Aprobada',
```

Place them after the existing `estado_requisito_legal` entry, keeping the estado fields grouped together.

### Files to Modify

| File | Change |
|------|--------|
| `management/src/export/excel_export.py` | Add 3 entries to DATOS_RELEVANTES_COLUMN_MAPPING |

---

## 13. Summary of Parametros Color System Architecture

### Data Flow

```
Admin (Parametricas Page)
  ↓ (edits color for a parametro value)
PUT /parametros/{id} with {color: "emerald"}
  ↓
Parametro record updated in DB
  ↓
Frontend hook useParametroColors('estado_de_la_iniciativa')
  ↓ fetches GET /parametros/estado_de_la_iniciativa
Returns map: {"Recepción": "slate", "Aprobada": "emerald", ...}
  ↓
EstadoTag component renders with API color (or falls back to estadoColors.js)
```

### Fallback Strategy

1. **API color set** → use API color key → resolve via shared COLOR_PALETTE
2. **API color NULL** → fall back to hardcoded `ESTADO_COLORS` in `estadoColors.js`
3. **Unknown value** → fall back to gray/default

This ensures zero breaking changes if the API is unavailable or colors haven't been configured yet.

---

## Cross-Cutting: Files Summary

### Management Module

| File | Changes |
|------|---------|
| `management/src/calculate/estado_functions.py` | Add 3 new functions: `estado_sm100()`, `estado_sm200()`, `iniciativa_aprobada()` |
| `management/src/calculate/engine.py` | Import + call new functions in `calculate_row()` |
| `management/src/export/excel_export.py` | Add 3 entries to DATOS_RELEVANTES_COLUMN_MAPPING |

### Database

| File | Changes |
|------|---------|
| `db/schema.sql` | Add 3 columns to datos_relevantes + `color` column to parametros + seed estado colors |

### Backend

| File | Changes |
|------|---------|
| `backend/app/calculated_fields/definitions.py` | Register 3 new calculated fields |
| `backend/app/models.py` | Add `color` field to Parametro model; Add 3 new columns to DatosRelevante model |
| `backend/app/schemas.py` | Add `color` to ParametroCreate and ParametroUpdate schemas |
| `backend/app/routers/parametros.py` | Include color in CRUD responses; Return `{valor, color}` objects from `/{nombre_parametro}` |
| `backend/app/agent/system_prompt.py` | Dynamic date/year, reinforce Cancelado exclusion, default year importes |
| `backend/app/agent/orchestrator.py` | Use `get_system_prompt()` function |

### Frontend

| File | Changes |
|------|---------|
| `frontend/src/features/search/components/DataGrid.jsx` | Fix filter re-render bug (refs for columnFilters) |
| `frontend/src/features/search/utils/columnDefinitions.js` | Add 3 new column definitions |
| `frontend/src/features/search/components/FilterPanel.jsx` | Add 3 new MultiSelect filter dropdowns |
| `frontend/src/features/search/components/FilterChips.jsx` | Add labels for 3 new filters |
| `frontend/src/features/search/hooks/useFilterOptions.js` | Extract unique values for 3 new fields |
| `frontend/src/features/search/hooks/useSearchInitiatives.js` | Map 3 new filter keys to API field names |
| `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx` | Add 3 new fields |
| `frontend/src/features/detail/hooks/useParametricOptions.js` | Handle new `{valor, color}` object format from API |
| `frontend/src/hooks/useParametroColors.js` | New hook: fetch parametro colors from API |
| `frontend/src/features/chat/ChatPage.jsx` | UI redesign |
| `frontend/src/features/chat/components/ChatInput.jsx` | UI redesign + UP arrow history |
| `frontend/src/features/chat/components/MessageList.jsx` | UI redesign (empty state) |
| `frontend/src/features/chat/components/MessageBubble.jsx` | UI redesign |
| `frontend/src/lib/badgeColors.js` | Add 10 new tag colors + shared COLOR_PALETTE |
| `frontend/src/lib/estadoColors.js` | Keep as fallback (no removal) |
| `frontend/src/components/shared/EstadoTag.jsx` | Accept API color override |
| `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx` | Expand COLOR_OPTIONS + preview |
| `frontend/src/features/parametricas/ParametricasPage.jsx` | Add color dropdown to parametros editing |
