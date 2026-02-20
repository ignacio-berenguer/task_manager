# Implementation Plan — feature_064

## Phase 1: Search Page Filter Bug Fix (Frontend)

**Goal**: Fix the single-character typing limitation in free-text column filters.

### Step 1.1: Fix DataGrid useMemo dependency

**File**: `frontend/src/features/search/components/DataGrid.jsx`

1. Add `useRef` imports
2. Create refs for `columnFilters` and `onColumnFilterChange`:
   ```javascript
   const columnFiltersRef = useRef(columnFilters)
   columnFiltersRef.current = columnFilters
   const onColumnFilterChangeRef = useRef(onColumnFilterChange)
   onColumnFilterChangeRef.current = onColumnFilterChange
   ```
3. Inside the `tableColumns` useMemo, replace direct `columnFilters` and `onColumnFilterChange` usage with `columnFiltersRef.current` and `onColumnFilterChangeRef.current`
4. Remove `columnFilters` and `onColumnFilterChange` from the useMemo dependency array

### Step 1.2: Verify fix

- Build the frontend (`npm run build`)
- Test: type multi-character text in portfolio_id and nombre filters without losing focus

---

## Phase 2: New Calculated Fields (Management + DB + Backend)

**Goal**: Add `estado_sm100`, `estado_sm200`, `iniciativa_aprobada` to datos_relevantes.

### Step 2.1: Add management calculation functions

**File**: `management/src/calculate/estado_functions.py`

Add 3 new functions after the existing estado functions:

```python
def estado_sm100(caches: dict, portfolio_id: str) -> str:
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Recepción", "SM100 Redacción"):
        return "SM100 Pendiente"
    return "SM100 Disponible"

def estado_sm200(caches: dict, portfolio_id: str) -> str:
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Recepción", "SM100 Redacción", "SM100 Final", "SM200 En Revisión"):
        return "SM200 Pendiente"
    return "SM200 Disponible"

def iniciativa_aprobada_fn(caches: dict, portfolio_id: str) -> str:
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Aprobada", "Aprobada con CCT", "En ejecución", "Finalizado",
                  "Pendiente PES", "Facturación cierre año", "Cierre económico iniciativa"):
        return "Aprobada"
    return "No aprobada"
```

### Step 2.2: Integrate in calculation engine

**File**: `management/src/calculate/engine.py`

1. Import the 3 new functions from `estado_functions`
2. Add to the `calculate_row()` return dict:
   ```python
   'estado_sm100': estado_sm100(caches, portfolio_id),
   'estado_sm200': estado_sm200(caches, portfolio_id),
   'iniciativa_aprobada': iniciativa_aprobada_fn(caches, portfolio_id),
   ```

### Step 2.3: Update database schema

**File**: `db/schema.sql`

Add 3 new columns to the `datos_relevantes` CREATE TABLE statement, in the estado section (after `estado_requisito_legal`):

```sql
estado_sm100 TEXT,
estado_sm200 TEXT,
iniciativa_aprobada TEXT,
```

### Step 2.4: Add to Excel export mapping

**File**: `management/src/export/excel_export.py`

Add 3 new entries to `DATOS_RELEVANTES_COLUMN_MAPPING` after `estado_requisito_legal`:

```python
'estado_sm100': 'Estado SM100',
'estado_sm200': 'Estado SM200',
'iniciativa_aprobada': 'Iniciativa Aprobada',
```

### Step 2.5: Register backend calculated fields

**File**: `backend/app/calculated_fields/definitions.py`

1. Add to `CALCULATED_FIELDS["datos_descriptivos"]`:
   ```python
   "estado_sm100",
   "estado_sm200",
   "iniciativa_aprobada",
   ```

2. Add to `FIELD_CALCULATORS`:
   ```python
   "estado_sm100": ("lookup", "datos_relevantes", "estado_sm100"),
   "estado_sm200": ("lookup", "datos_relevantes", "estado_sm200"),
   "iniciativa_aprobada": ("lookup", "datos_relevantes", "iniciativa_aprobada"),
   ```

---

## Phase 3: Expose New Fields in Frontend (Search + Detail)

**Goal**: Make the 3 new fields visible and filterable.

### Step 3.1: Add column definitions for Search page

**File**: `frontend/src/features/search/columnDefinitions.js`

Add 3 new column definitions in the Estado category:

```javascript
{ id: 'estado_sm100', label: 'Estado SM100', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
{ id: 'estado_sm200', label: 'Estado SM200', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
{ id: 'iniciativa_aprobada', label: 'Iniciativa Aprobada', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
```

### Step 3.2: Add fields to Detail page Datos Descriptivos

**File**: `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx`

Add 3 entries to the `FIELDS` array:

```javascript
{ key: 'estado_sm100', label: 'Estado SM100', type: 'text' },
{ key: 'estado_sm200', label: 'Estado SM200', type: 'text' },
{ key: 'iniciativa_aprobada', label: 'Iniciativa Aprobada', type: 'text' },
```

### Step 3.3: Verify data flows end-to-end

- Rebuild database with `uv run python manage.py complete_process` (management)
- Start backend and check `/api/v1/datos-relevantes` returns new fields
- Check `/api/v1/datos_descriptivos/{id}` returns calculated fields via lookup
- Check Search page shows new columns and filters work
- Check Detail page Datos Descriptivos section shows new fields

---

## Phase 4: Chatbot UI Redesign (Frontend)

**Goal**: Modern, clean, futuristic chatbot interface.

### Step 4.1: Redesign ChatPage header

**File**: `frontend/src/features/chat/ChatPage.jsx`

- Add subtle gradient border-bottom or glow accent
- Add connection status indicator dot (green pulse when connected)
- Simplify layout, use `backdrop-blur` effect

### Step 4.2: Redesign ChatInput

**File**: `frontend/src/features/chat/components/ChatInput.jsx`

- Wrap textarea + send button in a single rounded container with border
- Add focus glow effect (`ring-1 ring-primary/30` on focus-within)
- Move send button inside the input container (right side)
- Smooth expand animation for multi-line

### Step 4.3: Redesign MessageList empty state

**File**: `frontend/src/features/chat/components/MessageList.jsx`

- Larger animated icon with gradient background
- Example questions as rounded pill buttons with hover glow
- More refined typography hierarchy

### Step 4.4: Redesign MessageBubble

**File**: `frontend/src/features/chat/components/MessageBubble.jsx`

- User messages: gradient background using primary color
- Assistant messages: frosted glass effect (`bg-background/80 backdrop-blur-sm`)
- Avatar icons with subtle glow ring effect
- Refined tool steps accordion: cleaner borders, monospace for data, subtle background
- Wider max-width for assistant messages (90%)

---

## Phase 5: Chatbot Input History (Frontend)

**Goal**: UP/DOWN arrow navigates command history.

### Step 5.1: Create useCommandHistory hook

**File**: `frontend/src/features/chat/hooks/useCommandHistory.js` (new file)

Implement:
- `history` array (max 50 entries)
- `pointer` index (-1 = no history selected)
- `push(command)` — add to history, reset pointer
- `navigateUp()` — move pointer backward, return entry
- `navigateDown()` — move pointer forward, return entry or empty
- `reset()` — reset pointer

### Step 5.2: Integrate in ChatInput

**File**: `frontend/src/features/chat/components/ChatInput.jsx`

1. Import and use `useCommandHistory`
2. On `keydown` with `ArrowUp`:
   - Only activate when cursor is at position 0 or input is empty
   - Call `navigateUp()`, set textarea value
3. On `keydown` with `ArrowDown`:
   - Only activate when cursor is at end or input has single line
   - Call `navigateDown()`, set textarea value
4. On submit: call `push(value)` before clearing input

---

## Phase 6: Parametros-Based Color Customization

**Goal**: Add color column to parametros, seed estado colors, expand palette, enable admin editing.

### Step 6.1: Database — Add `color` column to parametros + seed estado values

**File**: `db/schema.sql`

1. Add `color TEXT DEFAULT NULL` column to the `parametros` CREATE TABLE statement
2. Add INSERT statements to seed `estado_de_la_iniciativa` values with default color keys:
   ```sql
   INSERT OR IGNORE INTO parametros (nombre_parametro, valor, color, orden) VALUES
     ('estado_de_la_iniciativa', 'Recepción', 'slate', 1),
     ('estado_de_la_iniciativa', 'SM100 Redacción', 'blue', 2),
     -- ... all 21 estados with colors from estadoColors.js mapping
     ('estado_de_la_iniciativa', 'Cancelado', 'red', 21);
   ```

### Step 6.2: Backend — Update Parametro model and API

**File**: `backend/app/models.py`
- Add `color = Column(Text, nullable=True)` to Parametro model

**File**: `backend/app/routers/parametros.py`
- Ensure the `color` field is included in GET responses and accepted in POST/PUT bodies
- The `/parametros/{nombre_parametro}` endpoint should return `color` for each value

### Step 6.3: Frontend — Expand color palette

**File**: `frontend/src/lib/badgeColors.js`

1. Add 10 new color entries to `ETIQUETA_DESTACADA_COLORS`: yellow, pink, indigo, teal, cyan, amber, lime, rose, slate, emerald
2. Export a shared `COLOR_PALETTE` array (all 15 colors with key, label, bgClass) for reuse in both etiquetas_destacadas and parametros forms

### Step 6.4: Frontend — Create useParametroColors hook

**File**: `frontend/src/hooks/useParametroColors.js` (new file)

```javascript
export function useParametroColors(nombreParametro) {
  const { data } = useQuery({
    queryKey: ['parametros-colors', nombreParametro],
    queryFn: () => apiClient.get(`/parametros/${nombreParametro}`).then(r => r.data.valores),
    staleTime: 10 * 60 * 1000,
  })
  // Return map: valor → color_key (e.g., { "Aprobada": "emerald" })
  return useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.filter(v => v.color).map(v => [v.valor, v.color]))
  }, [data])
}
```

### Step 6.5: Frontend — Update EstadoTag to use API colors

**File**: `frontend/src/components/shared/EstadoTag.jsx`

1. Accept optional `colorMap` prop (from useParametroColors)
2. If `colorMap[estado]` exists → resolve color via shared COLOR_PALETTE
3. Otherwise → fall back to hardcoded `ESTADO_COLORS` from `estadoColors.js`

### Step 6.6: Frontend — Update etiquetas_destacadas form

**File**: `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx`

1. Expand `COLOR_OPTIONS` array with 10 new colors (use shared COLOR_PALETTE)
2. Add colored circle preview next to each color label in the dropdown

### Step 6.7: Frontend — Update Parametricas page for color editing

**File**: `frontend/src/features/parametricas/ParametricasPage.jsx`

1. Show color badge preview for each parametro that has a color assigned
2. Add color dropdown (using shared COLOR_PALETTE) in the edit form/row
3. Include "Sin color" / NULL option to clear color assignment

---

## Phase 7: System Prompt Enhancements (Backend)

**Goal**: Dynamic date, Cancelado exclusion reinforcement, default year importes.

### Step 7.1: Convert system prompt to dynamic function

**File**: `backend/app/agent/system_prompt.py`

1. Keep the base prompt as `_BASE_PROMPT` template string
2. Create `get_system_prompt()` function that:
   - Gets `date.today()` for current date
   - Gets `date.today().year` for current year
   - Inserts date/year into the prompt using f-string or `.format()`
3. Add at the top of the prompt:
   ```
   Fecha actual: {today}
   Año en curso: {year}
   ```

### Step 7.2: Add current year importe default rule

In the prompt text, add after the importe field descriptions:

```
REGLA DE IMPORTES POR DEFECTO: Cuando el usuario pregunte por importes, presupuesto,
facturación o cualquier dato económico sin especificar un año concreto, utiliza SIEMPRE
los campos del año {year}.
```

### Step 7.3: Reinforce Cancelado exclusion

Strengthen the existing Cancelado exclusion text to be more explicit and add reminders in tool usage sections. Ensure it's marked as a critical rule.

### Step 7.4: Update orchestrator

**File**: `backend/app/agent/orchestrator.py`

Replace `from .system_prompt import SYSTEM_PROMPT` with `from .system_prompt import get_system_prompt` and call `get_system_prompt()` where the prompt is used.

---

## Phase 8: Post-Implementation Checklist

### Step 8.1: Version bump and changelog

- **File**: `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to 64
- **File**: `frontend/src/lib/changelog.js` — Add entry at TOP of `CHANGELOG` array

### Step 8.2: Update documentation

- **File**: `README.md` — Update with new features
- **File**: `specs/architecture/architecture_backend.md` — Document new calculated fields and system prompt changes
- **File**: `specs/architecture/architecture_frontend.md` — Document chatbot redesign, filter fix, new fields

### Step 8.3: Build verification

```bash
cd frontend && npm run build   # Verify no build errors
```

### Step 8.4: Close feature

Use `/close_feature feature_064` to move to implemented and commit.

---

## Execution Order & Dependencies

```
Phase 1 (Filter Bug)        ─── independent, do first (quick win)
Phase 2 (Calc Fields+Export) ─── independent, foundational for Phase 3
Phase 3 (Search/Detail)      ─── depends on Phase 2
Phase 4 (Chatbot UI)        ─── independent
Phase 5 (Chat History)      ─── can run alongside Phase 4
Phase 6 (Parametros Colors) ─── independent (DB + backend + frontend)
Phase 7 (System Prompt)     ─── independent
Phase 8 (Docs/Version)      ─── after all phases complete
```

Recommended parallel groupings:
- **Group A**: Phase 1 + Phase 2 → Phase 3
- **Group B**: Phase 4 + Phase 5
- **Group C**: Phase 6 + Phase 7
- **Final**: Phase 8
