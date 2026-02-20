# Technical Specifications for feature_068

## Overview

This feature implements four improvements across the frontend, backend, and MCP server modules:

1. **Chat Context Window Reset Fix** - Fix race condition in "Nueva Conversación" button
2. **Search Page - Cancelled Initiatives Filter** - Add toggle to exclude cancelled initiatives
3. **Detail Page - Sticky Header Status Fields** - Display key status fields in the sticky header
4. **Chart Tool Preserve Data Order** - Remove automatic sorting in chart generation

---

## 1. Chat Context Window Reset Fix

### Problem Analysis

The "Nueva Conversación" button has a race condition:

1. User clicks "Nueva Conversación" during an active request
2. `clearChat()` aborts the request and sets `messages` to `[]`
3. The `catch` block for `AbortError` runs and adds a message via `setMessages(prev => [...prev, ...])`
4. This adds a message back to the supposedly cleared messages array

**Affected File:** `frontend/src/features/chat/ChatContext.jsx`

### Solution Design

Add a `clearedRef` to track when the chat has been explicitly cleared. The abort handler should check this flag and skip adding the abort message if the chat was cleared.

**Changes:**

```javascript
// Add ref to track clearing
const clearedRef = useRef(false)

// In sendMessage, reset the flag at the start
clearedRef.current = false

// In clearChat, set the flag
clearedRef.current = true

// In the AbortError catch block, check the flag
if (error.name === 'AbortError') {
  if (!clearedRef.current && (accumulated || streamingContent)) {
    setMessages(prev => [...prev, { role: 'assistant', content: '...' }])
  }
}
```

### Edge Cases

- User clicks "Nueva Conversación" multiple times rapidly → Safe, ref prevents message pollution
- User clicks "Nueva Conversación" then immediately sends a new message → Safe, new sendMessage resets the flag
- Network error during request (not AbortError) → Unchanged behavior, message is added

---

## 2. Search Page - Cancelled Initiatives Filter

### Current State

- **Filter Panel:** `frontend/src/features/search/components/FilterPanel.jsx` has 12 filter controls
- **Storage:** `frontend/src/features/search/utils/searchStorage.js` defines `DEFAULT_FILTERS = { cerradaEconomicamente: ['No'] }`
- **Hook:** `frontend/src/features/search/hooks/useSearchPreferences.js` handles filter state and persistence
- **Request Builder:** `frontend/src/features/search/hooks/useSearchInitiatives.js` builds backend search filters

### Design Decision: Checkbox vs Toggle

A simple checkbox labeled "Incluir Iniciativas Canceladas" is cleaner than a toggle switch. The checkbox will be unchecked by default (excluding cancelled), and checking it includes them.

**Filter Logic:**
- When checkbox is **unchecked** (default): Add filter `estado_de_la_iniciativa not_in ['Cancelada', 'Cancelado']` (both values exist in the database)
- When checkbox is **checked**: No filter on estado (include all)

### Changes

**1. searchStorage.js**
```javascript
export const DEFAULT_FILTERS = {
  cerradaEconomicamente: ['No'],
  includeCancelled: false,  // NEW: default = exclude cancelled
}
```

**2. FilterPanel.jsx**
- Add a checkbox control below the existing filters
- Label: "Incluir Iniciativas Canceladas"
- Style: Consistent with existing filter panel

**3. useSearchInitiatives.js (buildSearchRequest)**
```javascript
// Add cancelled filter if NOT including cancelled
// Note: Both "Cancelada" and "Cancelado" values exist in the database
if (!filters.includeCancelled) {
  searchFilters.push({
    field: 'estado_de_la_iniciativa',
    operator: 'not_in',
    value: ['Cancelada', 'Cancelado']
  })
}
```

**4. FilterChips.jsx**
- Add label mapping: `includeCancelled: 'Excl. Canceladas'`
- Show chip when `includeCancelled === false` (exclusion is ACTIVE)
- Chip displays "Excl. Canceladas: Sí" to indicate cancelled initiatives are being excluded
- Clicking chip removes it (sets `includeCancelled: true` to include all)

**5. Clear Filters Behavior**
- `clearFilters()` in `useSearchPreferences.js` already resets to `DEFAULT_FILTERS`
- This will automatically reset `includeCancelled` to `false`

### Filter Count

The `activeFilterCount` calculation should count `includeCancelled: false` as an active filter because it means exclusion is active. When `includeCancelled: true`, no filter is active (all initiatives included).

---

## 3. Detail Page - Sticky Header Status Fields (and InitiativeDrawer)

### Current State

- **DetailHeader:** `frontend/src/features/detail/components/DetailHeader.jsx` displays:
- **InitiativeDrawer:** `frontend/src/components/shared/InitiativeDrawer.jsx` shows quick preview of initiative
  - Portfolio ID (text)
  - Initiative name (text)
  - Highlighted etiquetas (colored badges)

- **Status fields** are currently in `DatosDescriptivosSection.jsx`:
  - `estado_de_la_iniciativa` → rendered with `EstadoTag` (type: 'estado')
  - `estado_sm100` → plain text
  - `estado_sm200` → plain text
  - `iniciativa_aprobada` → plain text

- **Color System:**
  - `EstadoTag` component supports optional `colorMap` prop from parametros table
  - `useParametroColors(nombreParametro)` hook fetches colors from `/api/v1/parametros/{nombre}`
  - `ETIQUETA_DESTACADA_COLORS` in `badgeColors.js` has 16-color palette

### Design

Add a row of status badges below the initiative name in the sticky header:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back   Portfolio ID: SPA_25_123                           [Etiquetas] │
│          Initiative Name Here                                            │
│          [En ejecución] [Tiene SM100] [SM200 Pendiente] [No Aprobada]   │
│          (parametros)   (green)       (amber)           (red)           │
└─────────────────────────────────────────────────────────────────────────┘
```

Example badge combinations:
- SM100="SM100 Aprobado" → "Tiene SM100" (green)
- SM100="SM100 Pendiente" → "SM100 Pendiente" (amber)
- SM100="SM100 Cancelada" → "Cancelada" (red)
- SM100=null → "Sin SM100" (red)

**Badge Styles:**

| Field | Condition | Text | Color |
|-------|-----------|------|-------|
| estado_de_la_iniciativa | Always shown | Value from data | From `parametros` table |
| estado_sm100 | Empty/null | "Sin SM100" | Red |
| estado_sm100 | Contains "Cancelada" or "Cancelado" | "Cancelada" | Red |
| estado_sm100 | Contains "Pendiente" | "SM100 Pendiente" | Amber |
| estado_sm100 | Any other value | "Tiene SM100" | Green |
| estado_sm200 | Empty/null | "Sin SM200" | Red |
| estado_sm200 | Contains "Cancelada" or "Cancelado" | "Cancelada" | Red |
| estado_sm200 | Contains "Pendiente" | "SM200 Pendiente" | Amber |
| estado_sm200 | Any other value | "Tiene SM200" | Green |

**Note:** Database values may include the SM prefix (e.g., "SM100 Pendiente", "SM200 Cancelada"), so matching is done using case-insensitive `includes()` checks.
| iniciativa_aprobada | "Sí" | "Aprobada" | Green |
| iniciativa_aprobada | Otherwise | "No Aprobada" | Red |

**Color Implementation:**

- Use `useParametroColors('estado_de_la_iniciativa')` to get color map
- Pass `colorMap` to `EstadoTag` for the estado field
- For SM100/SM200/Aprobada, use a `SmBadge` component with three color variants:
  - Green: `bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400`
  - Red: `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
  - Amber: `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400`
- Helper function `getSmBadgeProps(value, label)` determines text and color based on value

### Changes

**1. DetailHeader.jsx**
- Accept additional props: `estadoIniciativa`, `estadoSm100`, `estadoSm200`, `iniciativaAprobada`
- Import `EstadoTag` and `useParametroColors`
- Add `getSmBadgeProps(value, label)` helper function for SM100/SM200 badge logic
- Add `SmBadge` component with green/red/amber color variants
- Render status badges row below the name using:
  - `EstadoTag` for estado_de_la_iniciativa (with parametros colorMap)
  - `SmBadge` for SM100, SM200, and Iniciativa Aprobada

**2. DetailPage.jsx**
- Pass the status fields to `DetailHeader`:
```jsx
<DetailHeader
  portfolioId={portfolioId}
  nombre={datosDescriptivos?.nombre}
  highlightedEtiquetas={highlightedEtiquetas}
  estadoIniciativa={datosDescriptivos?.estado_de_la_iniciativa}
  estadoSm100={datosDescriptivos?.estado_sm100}
  estadoSm200={datosDescriptivos?.estado_sm200}
  iniciativaAprobada={datosDescriptivos?.iniciativa_aprobada}
/>
```

### Responsive Behavior

On smaller screens (< md), the status badges should wrap to a new line but remain visible in the sticky header.

### InitiativeDrawer (Quick View Sidebar)

The same 4 status badges are displayed in the InitiativeDrawer header, below the highlighted etiquetas:

**Changes to InitiativeDrawer.jsx:**
- Import `useParametroColors` hook
- Add `getSmBadgeProps` helper function and `SmBadge` component (same as DetailHeader)
- Get status values from `portfolioData` (datos_descriptivos and iniciativas)
- Render status badges row after highlighted etiquetas in SheetHeader

---

## 4. Chart Tool Preserve Data Order

**IMPORTANT:** The built-in chat client in the frontend uses the **backend** chart renderer (`backend/app/charts/renderer.py`), not the MCP server. Both renderers were updated for consistency.

### Current State

The `generar_grafico` tool sorts data by value descending in two places:

**1. Data Aggregation** (MCP: `mcp_server/src/mcp_portfolio/tools/visualizacion.py`):
- Sum mode uses `sorted(..., reverse=True)`
- Count mode uses `Counter.most_common()` which sorts descending

**2. Chart Rendering** (Backend: `backend/app/charts/renderer.py`, MCP: `mcp_server/src/mcp_portfolio/charts/renderer.py`):
- `_sort_and_group()` sorts by value descending before rendering

### Design

**Requirement:** When the AI agent provides pre-computed `datos` parameter, preserve the exact order. When using `campo_agrupacion` to query, the tool may still sort (since there's no explicit order from the agent).

**Solution Options:**

1. **Option A - Add `preserve_order` parameter:** Let the agent explicitly request order preservation
2. **Option B - Remove sorting entirely:** Never sort, always use provided order
3. **Option C - Only sort when querying:** Sort when using `campo_agrupacion`, preserve when using `datos`

**Selected: Option B - Remove sorting entirely**

Rationale:
- The AI agent has full control over the data it sends
- If the agent wants sorted data, it can sort before calling the tool
- This gives maximum flexibility (alphabetical, chronological, custom grouping order, etc.)
- Simpler implementation (remove code rather than add parameters)

### Changes

**1. renderer.py**
- Remove the `sorted()` call in `_sort_and_group()` method
- Keep the `group_small_categories()` call (still useful for limiting categories)

```python
def _sort_and_group(self, data: list[dict], options: dict) -> list[dict]:
    """Group small categories if needed. Preserves input order."""
    max_cats = options.get("max_categorias", self.max_categories)
    return group_small_categories(data, max_cats)
```

**2. visualizacion.py - Sum Mode (lines 176-180)**
```python
# Before: sorted by value descending
return [
    {"etiqueta": k if k is not None else "(vacío)", "valor": round(v, 2)}
    for k, v in sorted(group_totals.items(), key=lambda x: x[1], reverse=True)
]

# After: preserve insertion order (Python 3.7+ dicts maintain order)
return [
    {"etiqueta": k if k is not None else "(vacío)", "valor": round(v, 2)}
    for k, v in group_totals.items()
]
```

**3. visualizacion.py - Count Mode (lines 194-197)**
```python
# Before: counter.most_common() sorts descending
return [
    {"etiqueta": k if k is not None else "(vacío)", "valor": v}
    for k, v in counter.most_common()
]

# After: iterate counter items without sorting
return [
    {"etiqueta": k if k is not None else "(vacío)", "valor": v}
    for k, v in counter.items()
]
```

### Impact on Horizontal Bar Charts

In matplotlib, horizontal bar charts render from bottom to top (y=0 at bottom). To display the first data item at the TOP of the chart (natural reading order), the data is reversed before rendering:

```python
# Reverse data so first item appears at top (matplotlib renders bottom-to-top)
data = list(reversed(data))
```

This ensures that if the agent sends data ordered as [A, B, C, D], the chart displays A at the top and D at the bottom.

### grouping_small_categories Behavior

The `group_small_categories()` function expects data sorted by value descending to correctly group the smallest items. With unsorted data, it will group the **last N items** instead of the smallest.

**Decision:** This is acceptable. If the agent wants "Otros" grouping, it should either:
1. Sort the data before sending
2. Set `max_categorias` high enough to avoid grouping

Alternatively, modify `group_small_categories()` to sort internally only for the purpose of grouping, then re-order:
- Sort by value to identify smallest items
- Mark items to keep vs. group into "Otros"
- Preserve original order for kept items, append "Otros" at end

**Selected approach:** Keep `group_small_categories()` unchanged for simplicity. Document that grouping works best with descending-sorted data.

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/features/chat/ChatContext.jsx` | Add `clearedRef` to fix race condition |
| `frontend/src/features/search/utils/searchStorage.js` | Add `includeCancelled` to DEFAULT_FILTERS |
| `frontend/src/features/search/components/FilterPanel.jsx` | Add checkbox for "Incluir Iniciativas Canceladas" |
| `frontend/src/components/ui/checkbox.jsx` | NEW: Checkbox component following shadcn/ui pattern |
| `frontend/src/features/search/hooks/useSearchInitiatives.js` | Add not_in filter for Cancelada/Cancelado estado |
| `frontend/src/features/search/components/FilterChips.jsx` | Add label mapping for includeCancelled, show chip when exclusion active |
| `frontend/src/features/search/hooks/useSearchPreferences.js` | Update activeFilterCount logic |
| `frontend/src/features/search/SearchPage.jsx` | Handle boolean includeCancelled in handleRemoveFilter |
| `frontend/src/features/detail/components/DetailHeader.jsx` | Add status badges row with SmBadge and getSmBadgeProps |
| `frontend/src/features/detail/DetailPage.jsx` | Pass status fields to DetailHeader |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Add same status badges to drawer header |
| `backend/app/charts/renderer.py` | Remove sorting in _sort_and_group (built-in chat uses backend) |
| `mcp_server/src/mcp_portfolio/tools/visualizacion.py` | Remove sorting in aggregation |
| `mcp_server/src/mcp_portfolio/charts/renderer.py` | Remove sorting in _sort_and_group |

---

## Testing

### 1. Chat Reset
- Start a long conversation until context window error appears
- Click "Nueva Conversación"
- Verify messages are cleared and no error persists
- Send a new message successfully

### 2. Cancelled Filter
- Open Search page with default filters
- Verify cancelled initiatives are NOT shown (both "Cancelada" and "Cancelado" estados)
- Verify "Excl. Canceladas: Sí" chip is displayed
- Check "Incluir Iniciativas Canceladas" checkbox
- Verify cancelled initiatives now appear and chip is removed
- Click "Limpiar Filtros"
- Verify checkbox is unchecked, chip reappears, and cancelled are hidden again

### 3. Sticky Header Status (and InitiativeDrawer)
- Open Detail page for an initiative
- Scroll down through accordion sections
- Verify status badges remain visible in header
- Test SM100/SM200 badge colors (values may have SM prefix like "SM100 Pendiente"):
  - Empty/null → "Sin SM100/SM200" (red)
  - Contains "Cancelada" or "Cancelado" → "Cancelada" (red)
  - Contains "Pendiente" → "SM100/SM200 Pendiente" (amber)
  - Any other value → "Tiene SM100/SM200" (green)
- Test Iniciativa Aprobada: "Sí" → "Aprobada" (green), otherwise → "No Aprobada" (red)
- Open InitiativeDrawer (quick view) from Search page
- Verify same 4 status badges appear in drawer header with correct colors

### 4. Chart Order
- Use chat to generate a chart with specific ordering
- Verify bars appear in the order specified, not sorted by value
