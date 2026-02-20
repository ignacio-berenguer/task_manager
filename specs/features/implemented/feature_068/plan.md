# Implementation Plan for feature_068

## Overview

Four independent improvements implemented across frontend, backend, and MCP server:

1. Chat Context Window Reset Fix (Frontend)
2. Search Page - Cancelled Initiatives Filter (Frontend)
3. Detail Page - Sticky Header Status Fields (Frontend + InitiativeDrawer)
4. Chart Tool Preserve Data Order (Backend + MCP Server)

---

## Phase 1: Chat Context Window Reset Fix

**Complexity:** Low

### Changes Made
**File:** `frontend/src/features/chat/ChatContext.jsx`

1. Added `clearedRef = useRef(false)` to track when chat is explicitly cleared
2. Reset `clearedRef.current = false` at start of `sendMessage`
3. Set `clearedRef.current = true` in `clearChat` before aborting
4. Modified AbortError handler to check `clearedRef.current` before adding message

This prevents the race condition where aborting a request during "Nueva Conversación" would add a message back to the cleared chat.

---

## Phase 2: Search Page - Cancelled Initiatives Filter

**Complexity:** Medium

### Changes Made

**File:** `frontend/src/features/search/utils/searchStorage.js`
- Added `includeCancelled: false` to `DEFAULT_FILTERS`

**File:** `frontend/src/features/search/components/FilterPanel.jsx`
- Added Checkbox component for "Incluir Iniciativas Canceladas"

**File:** `frontend/src/components/ui/checkbox.jsx` (NEW)
- Created Checkbox component following shadcn/ui pattern

**File:** `frontend/src/features/search/hooks/useSearchInitiatives.js`
- Added `not_in` filter for both "Cancelada" and "Cancelado" values when checkbox is unchecked:
```javascript
if (!filters.includeCancelled) {
  searchFilters.push({
    field: 'estado_de_la_iniciativa',
    operator: 'not_in',
    value: ['Cancelada', 'Cancelado'],
  })
}
```

**File:** `frontend/src/features/search/components/FilterChips.jsx`
- Added chip display "Excl. Canceladas: Sí" when exclusion is ACTIVE (checkbox unchecked)
- Clicking chip removes it (sets includeCancelled to true)

**File:** `frontend/src/features/search/hooks/useSearchPreferences.js`
- Updated `activeFilterCount` to count `includeCancelled: false` as active filter

**File:** `frontend/src/features/search/SearchPage.jsx`
- Updated `handleRemoveFilter` to handle boolean `includeCancelled` specially

---

## Phase 3: Detail Page - Sticky Header Status Fields

**Complexity:** Medium

### Changes Made

**File:** `frontend/src/features/detail/components/DetailHeader.jsx`
- Added `getSmBadgeProps(value, label)` helper function for SM100/SM200 badge logic:
  - Empty/null → "Sin SM100/SM200" (red)
  - Contains "Cancelada" or "Cancelado" → "Cancelada" (red)
  - Contains "Pendiente" → "SM100/SM200 Pendiente" (amber)
  - Any other value → "Tiene SM100/SM200" (green)
- Added `SmBadge` component with three color variants (green, red, amber)
- Added status badges row below initiative name using `EstadoTag` and `SmBadge`
- Used `useParametroColors` hook for estado_de_la_iniciativa colors

**File:** `frontend/src/features/detail/DetailPage.jsx`
- Passed status fields to DetailHeader component

**File:** `frontend/src/components/shared/InitiativeDrawer.jsx`
- Added same status badges to drawer header
- Duplicated `getSmBadgeProps` and `SmBadge` components
- Used `useParametroColors` hook for estado colors

---

## Phase 4: Chart Tool Preserve Data Order

**Complexity:** Low

### Changes Made

**IMPORTANT:** The built-in chat client uses the **backend** chart renderer, not the MCP server.

**File:** `backend/app/charts/renderer.py`
- Modified `_sort_and_group()` to preserve input order (removed `sorted()` call)
- Updated `_render_horizontal_bar()` comment to clarify reversal is for matplotlib display order

**File:** `mcp_server/src/mcp_portfolio/charts/renderer.py`
- Same changes as backend renderer for consistency
- Kept `list(reversed(data))` in horizontal bar to show first item at top (matplotlib renders bottom-to-top)

**File:** `mcp_server/src/mcp_portfolio/tools/visualizacion.py`
- Removed sorting in sum mode aggregation
- Removed sorting in count mode aggregation (changed `counter.most_common()` to `counter.items()`)

---

## Phase 5: Documentation Updates

### Changes Made

- `frontend/src/lib/version.js` - Incremented `APP_VERSION.minor` to 68
- `frontend/src/lib/changelog.js` - Added entry for feature_068
- `specs/architecture/architecture_frontend.md` - Updated with new components
- `specs/architecture/architecture_backend.md` - Updated with chart order preservation
- `specs/architecture/architecture_mcp_server.md` - Updated with chart order preservation
- `specs/features/feature_068/requirements.md` - Updated with implementation details
- `specs/features/feature_068/specs.md` - Updated with technical specifications

---

## Testing Checklist

- [x] Chat: "Nueva Conversación" clears context window error
- [x] Chat: Normal abort still shows interrupted message
- [x] Search: Cancelled initiatives excluded by default (both "Cancelada" and "Cancelado")
- [x] Search: Checkbox persists to localStorage
- [x] Search: "Limpiar" resets checkbox to unchecked
- [x] Search: "Excl. Canceladas: Sí" chip appears when exclusion active
- [x] Detail: Status badges appear in sticky header
- [x] Detail: Estado uses parametros colors
- [x] Detail: SM100/SM200 show correct states (Sin/Pendiente/Cancelada/Tiene)
- [x] Detail: Badges remain visible on scroll
- [x] Detail: Same badges appear in InitiativeDrawer
- [x] Chart: Bars appear in agent-specified order
- [x] Chart: Horizontal bar shows first item at top
