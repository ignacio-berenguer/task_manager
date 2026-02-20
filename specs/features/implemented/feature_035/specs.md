# Technical Specification — feature_035: Frontend UI Improvements

## Overview

This feature encompasses 7 UI improvements to the frontend application:

1. Sticky detail header on large screens
2. Importe hover tooltip with full precision
3. Transacciones table redesign (matching transacciones_json format)
4. Full-width layout on wide screens
5. Empty default date filters
6. Favorites system in Search page
7. Initiative quick-view side drawer in Search page

All changes are **frontend-only** — no backend modifications required.

---

## 1. Sticky Detail Header

### Current State
- `DetailHeader.jsx` has `sticky top-0 z-10` on the outer `<div>`.
- The Navbar has `sticky top-0 z-50` with height `h-16` (64px).
- **The header appears NOT sticky** because both elements use `top-0`. When scrolling, the DetailHeader sticks at the very top of the viewport but is hidden behind the Navbar (which has higher z-index z-50 vs z-10). Visually, the header scrolls away.

### Root Cause
`sticky top-0` on the DetailHeader means it sticks at viewport top (y=0), but the Navbar is also sticky at y=0 with z-50, completely covering the DetailHeader (z-10). The fix is to offset the DetailHeader by the Navbar height.

### Design
- Change `sticky top-0` to `sticky top-16` on the outer div — this positions the header 64px from the top, exactly below the Navbar.
- Keep `z-10` (below Navbar's z-50, above page content).
- Add `shadow-sm` for visual elevation cue when stuck.
- Update the inner container class from `container mx-auto` to match the new full-width layout approach (see Requirement 4).
- Increase `max-w-xl` on the title to `max-w-2xl` or `max-w-3xl` to take advantage of wider screens.
- On small screens (`md` and below), keep sticky behavior — the header is compact enough to justify the space.

### Files Modified
- `frontend/src/features/detail/components/DetailHeader.jsx`

---

## 2. Importe Hover Tooltip

### Current State
Currency formatting is implemented in three places with identical logic:
1. `frontend/src/features/search/utils/columnDefinitions.js` → `formatCellValue()` for Search + GenericReportPage tables
2. `frontend/src/features/detail/components/SimpleTable.jsx` → `formatValue()` for Detail page tables
3. `frontend/src/features/detail/components/sections/ImportesSection.jsx` → `formatCurrency()` for the Importes grid
4. `frontend/src/features/detail/components/KeyValueDisplay.jsx` → `formatValue()` for key-value pairs

All format as `#.### k€` (thousands in Spanish locale, no decimals).

### Design

#### New Utility: `formatCurrencyFull(value)`
Add to `frontend/src/lib/utils.js`:
```javascript
export function formatCurrencyFull(value) {
  if (value === null || value === undefined || value === '') return null
  const numValue = Number(value)
  if (isNaN(numValue)) return null
  return `${numValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
```
Example: `1500000` → `"1.500.000,00 €"`

#### Implementation Strategy: Wrapper Component
Create a `CurrencyCell` component that wraps the displayed `k€` value with the existing `Tooltip` component showing the full precision on hover:

```jsx
// frontend/src/components/shared/CurrencyCell.jsx
function CurrencyCell({ value, formattedValue }) {
  const fullValue = formatCurrencyFull(value)
  if (!fullValue) return <span>{formattedValue}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{formattedValue}</span>
      </TooltipTrigger>
      <TooltipContent>{fullValue}</TooltipContent>
    </Tooltip>
  )
}
```

#### Integration Points
1. **Search DataGrid** (`DataGrid.jsx`): When `colDef.type === 'currency'`, render `<CurrencyCell>` instead of plain `<span>`. Requires wrapping the table body in a `<TooltipProvider>`.
2. **GenericReportPage** (`GenericReportPage.jsx`): Same approach — when cell type is `currency`, render `<CurrencyCell>`.
3. **SimpleTable** (`SimpleTable.jsx`): When `col.type === 'currency'`, render `<CurrencyCell>`.
4. **ImportesSection** (`ImportesSection.jsx`): Wrap each currency `<td>` with tooltip showing full value.
5. **KeyValueDisplay** (`KeyValueDisplay.jsx`): When `type === 'currency'`, wrap value with tooltip.

### Files Modified
- `frontend/src/lib/utils.js` (add `formatCurrencyFull`)
- `frontend/src/components/shared/CurrencyCell.jsx` (new)
- `frontend/src/features/search/components/DataGrid.jsx`
- `frontend/src/features/reports/components/GenericReportPage.jsx`
- `frontend/src/features/detail/components/SimpleTable.jsx`
- `frontend/src/features/detail/components/sections/ImportesSection.jsx`
- `frontend/src/features/detail/components/KeyValueDisplay.jsx`

---

## 3. Transacciones Table Redesign

### Current State

**TransaccionesSection** (Detail page): Uses `SimpleTable` with flat rows. Columns: fecha_registro_cambio, tabla, campo_tabla, tipo_cambio, valor_nuevo, valor_antes_del_cambio, estado_cambio. All rendered as plain text.

**TransaccionesJsonSection** (Detail page): Custom table with:
- Clickable rows with chevron expand/collapse
- `expandedId` state for single-row expansion
- Color-coded `Badge` for `tipo_operacion` (INSERT/UPDATE/DELETE) and `estado_db`/`estado_excel` (PENDIENTE/EJECUTADO/ERROR/NO_APLICA)
- `ExpandedDetail` showing clave_primaria, cambios, valores_previos_excel as pretty-printed JSON
- Excel sync button

**Transacciones Report** (GenericReportPage): Standard tabular flat rows.

**Transacciones JSON Report** (GenericReportPage): Standard tabular flat rows.

### Design

#### 3a. TransaccionesSection (Detail page)
Rewrite to match TransaccionesJsonSection pattern:
- **Main row columns**: Fecha Registro, Tabla, Campo, Tipo Cambio (as badge), Estado (as badge)
- **Expanded detail**: Valor Nuevo, Valor Anterior (as formatted text blocks)
- Color mapping for `tipo_cambio`:
  - ALTA → green badge
  - MODIFICACION → blue badge
  - BAJA → red badge
- Color mapping for `estado_cambio`:
  - PENDIENTE → yellow badge
  - EJECUTADO → green badge
  - ERROR → red badge
  - Other → gray badge

#### 3b. Transacciones Report (GenericReportPage)
The GenericReportPage uses flat tabular rendering. To support the new collapsible format, add a `renderMode` config option:
- `renderMode: 'table'` (default) — existing flat table
- `renderMode: 'collapsible'` — new mode with expandable rows

For the collapsible mode, the GenericReportPage will delegate row rendering to a custom row renderer provided via config:
- `config.collapsibleConfig.mainColumns` — columns shown in the collapsed row
- `config.collapsibleConfig.badgeColumns` — columns rendered as colored badges
- `config.collapsibleConfig.badgeColorMap` — color mappings
- `config.collapsibleConfig.detailColumns` — columns shown in the expanded detail

#### 3c. Transacciones JSON Report (GenericReportPage)
Same approach as 3b, with badge columns for `tipo_operacion`, `estado_db`, `estado_excel`.

### Badge Color Maps

Shared constant file: `frontend/src/lib/badgeColors.js`

```javascript
export const TIPO_CAMBIO_COLORS = {
  ALTA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MODIFICACION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  BAJA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const ESTADO_CAMBIO_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EJECUTADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const TIPO_OPERACION_COLORS = {
  INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const ESTADO_DB_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EJECUTADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  NO_APLICA: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}
```

### Files Modified
- `frontend/src/lib/badgeColors.js` (new)
- `frontend/src/features/detail/components/sections/TransaccionesSection.jsx` (rewrite)
- `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx` (extract shared Badge to shared, refactor colors to use shared constants)
- `frontend/src/features/reports/components/GenericReportPage.jsx` (add collapsible mode)
- `frontend/src/features/reports/TransaccionesReportPage.jsx` (add collapsible config)
- `frontend/src/features/reports/TransaccionesJsonReportPage.jsx` (add collapsible config)

---

## 4. Full-Width Layout

### Current State
Width constraints come from:
1. **Navbar**: `max-w-7xl` (1280px) on inner container
2. **Footer**: `max-w-7xl` (1280px) on inner container
3. **All pages**: `container mx-auto` (Tailwind 4 default: responsive max-width up to 1536px at 2xl)
4. **DetailHeader**: `container mx-auto`

### Design
Replace all `container mx-auto` usages with a wider layout that uses full width with horizontal padding:

**New CSS utility class** in `index.css`:
```css
.page-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;   /* 24px */
  padding-right: 1.5rem;  /* 24px */
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 2rem;    /* 32px */
    padding-right: 2rem;   /* 32px */
  }
}

@media (min-width: 1280px) {
  .page-container {
    padding-left: 3rem;    /* 48px */
    padding-right: 3rem;   /* 48px */
  }
}
```

Alternatively (simpler Tailwind approach): Replace `container mx-auto` with `w-full mx-auto px-6 sm:px-8 xl:px-12` across all pages.

**Update locations:**
1. **Navbar**: Replace `max-w-7xl` with `w-full` and keep padding
2. **Footer**: Replace `max-w-7xl` with `w-full` and keep padding
3. **DetailHeader**: Replace `container mx-auto` with the new class
4. **DetailPage**: Replace `container mx-auto` with the new class
5. **SearchPage**: Replace `container mx-auto` with the new class
6. **DashboardPage**: Replace `container mx-auto` with the new class
7. **GenericReportPage**: Replace `container mx-auto` with the new class
8. **ReportPage (Hechos)**: Replace `container mx-auto` with the new class
9. **LandingPage**: Keep existing layout (marketing page, not data-heavy)

### Files Modified
- `frontend/src/index.css` (optional, if using CSS utility class)
- `frontend/src/components/layout/Navbar.jsx`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/features/detail/components/DetailHeader.jsx`
- `frontend/src/features/detail/DetailPage.jsx`
- `frontend/src/features/search/SearchPage.jsx`
- `frontend/src/features/dashboard/DashboardPage.jsx`
- `frontend/src/features/reports/components/GenericReportPage.jsx`
- `frontend/src/features/reports/ReportPage.jsx`

---

## 5. Empty Default Date Filters

### Current State
The `<Input type="date" value="">` renders with browser-native placeholder "dd/mm/aa" in Spanish locales. The date filter inputs in Acciones, Transacciones, and Transacciones JSON reports default to empty strings, and the browser shows "dd/mm/aa".

### Root Cause
This is native browser behavior for empty `<input type="date">`. The placeholder cannot be suppressed via HTML attributes.

### Design

Use a simple CSS approach to make the empty date inputs appear truly empty:

```css
/* Hide the native placeholder text for empty date inputs */
input[type="date"]:not(:focus):invalid {
  color: transparent;
}
input[type="date"]:not(:focus)[value=""]{
  color: transparent;
}
```

However, this approach is fragile across browsers. A more reliable approach:

**Approach: Use `type="text"` with `onFocus`/`onBlur` toggling**
- Render as `type="text"` with `placeholder=""` when empty and not focused.
- On focus, switch to `type="date"` to get the native date picker.
- On blur, if empty, switch back to `type="text"`.

This is a well-known pattern. Implement in the `ReportFilterPanel.jsx` for date type filters:

```jsx
// For date filter type
<Input
  id={def.key}
  type={focused === def.key || filters[def.key] ? 'date' : 'text'}
  value={filters[def.key] || ''}
  onFocus={() => setFocused(def.key)}
  onBlur={() => setFocused(null)}
  onChange={(e) => updateFilter(def.key, e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder=""
/>
```

This ensures the field shows blank when empty, and shows the date picker when focused or has a value.

### Files Modified
- `frontend/src/features/reports/components/ReportFilterPanel.jsx`

---

## 6. Favorites System

### Design

#### Storage
Use `createStorage('search-favorites')`:
- Key: `'list'` → stores array of `{ portfolioId: string, nombre: string }` objects
- Storing `nombre` alongside `portfolioId` so the edit modal can display meaningful info

#### Custom Hook: `useFavorites()`
Location: `frontend/src/features/search/hooks/useFavorites.js`

```javascript
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => storage.loadJSON('list', []))

  const isFavorite = (portfolioId) => favorites.some(f => f.portfolioId === portfolioId)
  const toggleFavorite = (portfolioId, nombre) => { ... }
  const removeFavorite = (portfolioId) => { ... }
  const clearAll = () => { ... }
  const copyToClipboard = () => { ... }

  return { favorites, isFavorite, toggleFavorite, removeFavorite, clearAll, copyToClipboard, count: favorites.length }
}
```

#### UI Components

**Star icon per row** — Add to `DataGrid.jsx` as the first data column (after select checkbox):
- Star icon (lucide `Star`): outline when not favorite, filled when favorite
- Clicking toggles the favorite state
- No tooltip needed; the icon is self-explanatory

**Favorites toolbar** — Add to `SearchPage.jsx` toolbar (next to ColumnConfigurator, ExportDropdown):
- `Star` icon button with badge count of favorites
- Dropdown menu with actions:
  - "Copy Portfolio IDs" → copies comma-separated list to clipboard
  - "Edit Favorites" → opens modal dialog
  - "Clear All" → shows confirmation dialog, then clears

**FavoritesDialog** — `frontend/src/features/search/components/FavoritesDialog.jsx`:
- Modal dialog listing all favorites
- Each row: portfolio_id, nombre, X button to remove
- "Clear All" button in footer
- "Close" button

#### Integration with Search Page
The `useFavorites()` hook is called in `SearchPage.jsx` and passed down:
- To `DataGrid` (for star rendering and toggling)
- To `FavoritesToolbar` (for toolbar actions)

### Files Modified/Created
- `frontend/src/features/search/hooks/useFavorites.js` (new)
- `frontend/src/features/search/components/FavoritesToolbar.jsx` (new)
- `frontend/src/features/search/components/FavoritesDialog.jsx` (new)
- `frontend/src/features/search/components/DataGrid.jsx` (add star column)
- `frontend/src/features/search/SearchPage.jsx` (integrate favorites hook and toolbar)

---

## 7. Initiative Quick-View Side Drawer

### Design

#### Sheet/Drawer Component
No Sheet/Drawer UI component exists in the codebase. Create one:
`frontend/src/components/ui/sheet.jsx`

Implementation: A portal-based side panel that slides in from the right with overlay:
- Overlay (click to close)
- Slide-in animation from right
- ESC to close
- Body scroll lock
- Width: ~480px (configurable)

#### InitiativeDrawer Component
Location: `frontend/src/features/search/components/InitiativeDrawer.jsx`

**Props**: `portfolioId`, `isOpen`, `onClose`, `rowData` (the datos_relevantes row already loaded)

**Data Flow**:
- Basic fields (portfolio_id, nombre, origen, digital_framework_level_1, estado, priorizacion, cluster, fecha, importe) come from `rowData` — already available in the search results.
- Hechos data: fetched via `apiClient.post('/hechos/search', { filters: [{ field: 'portfolio_id', operator: 'eq', value: portfolioId }], order_by: 'id_hecho', order_dir: 'asc', limit: 100 })`.

**Layout**:
```
┌─────────────────────────────────┐
│ [X]                              │
│                                  │
│ Portfolio ID: PF-12345           │
│ Nombre de la Iniciativa          │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Origen: ...                  │ │
│ │ Framework: ...               │ │
│ │ Estado: ...                  │ │
│ │ Priorización: ...            │ │
│ │ Cluster: ...                 │ │
│ │ Fecha Estado: ...            │ │
│ │ Importe 2026: ...            │ │
│ └──────────────────────────────┘ │
│                                  │
│ Hechos (N)                       │
│ ┌──────────────────────────────┐ │
│ │ Estado | Fecha | Importe     │ │
│ │ ...    | ...   | ...         │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Go to Initiative →]             │
└─────────────────────────────────┘
```

**Current year importe**: Determined dynamically from `new Date().getFullYear()` → maps to `importe_YYYY` field in rowData.

#### Integration
- Add an "info" icon button (`Info` from lucide) to `RowActions.jsx`.
- `SearchPage.jsx` manages `drawerState = { isOpen, portfolioId, rowData }`.
- Clicking the info button sets the drawer state and opens it.

### Files Modified/Created
- `frontend/src/components/ui/sheet.jsx` (new)
- `frontend/src/features/search/components/InitiativeDrawer.jsx` (new)
- `frontend/src/features/search/components/RowActions.jsx` (add info button)
- `frontend/src/features/search/components/DataGrid.jsx` (pass onOpenDrawer callback)
- `frontend/src/features/search/SearchPage.jsx` (drawer state management)

---

## Summary of All Files

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/components/shared/CurrencyCell.jsx` | Reusable currency cell with hover tooltip |
| `frontend/src/components/ui/sheet.jsx` | Side sheet/drawer UI component |
| `frontend/src/lib/badgeColors.js` | Shared badge color constants |
| `frontend/src/features/search/hooks/useFavorites.js` | Favorites localStorage hook |
| `frontend/src/features/search/components/FavoritesToolbar.jsx` | Favorites toolbar with actions |
| `frontend/src/features/search/components/FavoritesDialog.jsx` | Favorites edit modal |
| `frontend/src/features/search/components/InitiativeDrawer.jsx` | Initiative quick-view drawer |

### Modified Files
| File | Changes |
|------|---------|
| `frontend/src/lib/utils.js` | Add `formatCurrencyFull()` |
| `frontend/src/index.css` | Add page-container utility class |
| `frontend/src/components/layout/Navbar.jsx` | Remove max-w-7xl |
| `frontend/src/components/layout/Footer.jsx` | Remove max-w-7xl |
| `frontend/src/features/detail/components/DetailHeader.jsx` | Full-width container |
| `frontend/src/features/detail/DetailPage.jsx` | Full-width container |
| `frontend/src/features/detail/components/SimpleTable.jsx` | CurrencyCell integration |
| `frontend/src/features/detail/components/sections/ImportesSection.jsx` | CurrencyCell integration |
| `frontend/src/features/detail/components/sections/TransaccionesSection.jsx` | Collapsible redesign |
| `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx` | Extract badge colors |
| `frontend/src/features/detail/components/KeyValueDisplay.jsx` | CurrencyCell integration |
| `frontend/src/features/search/SearchPage.jsx` | Full-width, favorites, drawer |
| `frontend/src/features/search/components/DataGrid.jsx` | CurrencyCell, star column, drawer button |
| `frontend/src/features/search/components/RowActions.jsx` | Add info button |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Full-width, CurrencyCell, collapsible mode |
| `frontend/src/features/reports/components/ReportFilterPanel.jsx` | Empty date filter defaults |
| `frontend/src/features/reports/TransaccionesReportPage.jsx` | Collapsible config |
| `frontend/src/features/reports/TransaccionesJsonReportPage.jsx` | Collapsible config |
| `frontend/src/features/reports/ReportPage.jsx` | Full-width container |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Full-width container |

### Post-Implementation
- Update `README.md`
- Update `specs/architecture/architecture_frontend.md`
