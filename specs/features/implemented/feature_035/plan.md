# Implementation Plan — feature_035: Frontend UI Improvements

## Phase Overview

| Phase | Description | Estimated Scope |
|-------|-------------|-----------------|
| 1 | Full-width layout | ~10 files, low risk |
| 2 | Sticky detail header refinement | 1 file, low risk |
| 3 | Empty default date filters | 1 file, low risk |
| 4 | Importe hover tooltip | ~7 files, medium risk |
| 5 | Transacciones table redesign | ~6 files, medium risk |
| 6 | Favorites system | ~5 files, medium risk |
| 7 | Initiative quick-view drawer | ~5 files, medium risk |
| 8 | Documentation updates | 2-3 files |

Phases 1-3 are small, independent changes. Phases 4-7 are larger features. The order is designed so that foundational changes (layout, utilities) happen first.

---

## Phase 1: Full-Width Layout

**Goal**: Make the app use all available screen space on wide monitors.

### Step 1.1: Add `page-container` utility class to `index.css`
- Add a CSS class that provides full width with responsive horizontal padding
- `px-6` at base, `px-8` at sm, `px-12` at xl

### Step 1.2: Update Navbar
- **File**: `frontend/src/components/layout/Navbar.jsx`
- Replace `max-w-7xl` with full-width padding classes on the inner container div (line 68)
- Change: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` → `mx-auto w-full px-6 sm:px-8 xl:px-12`

### Step 1.3: Update Footer
- **File**: `frontend/src/components/layout/Footer.jsx`
- Replace `max-w-7xl` with matching padding classes on the inner container div

### Step 1.4: Update all page containers
Replace `container mx-auto` with `w-full mx-auto px-6 sm:px-8 xl:px-12` in:
- `frontend/src/features/detail/components/DetailHeader.jsx` (line 15)
- `frontend/src/features/detail/DetailPage.jsx`
- `frontend/src/features/search/SearchPage.jsx`
- `frontend/src/features/dashboard/DashboardPage.jsx`
- `frontend/src/features/reports/components/GenericReportPage.jsx` (line 200)
- `frontend/src/features/reports/ReportPage.jsx`

**Note**: Do NOT change the LandingPage — it has its own marketing-oriented layout.

### Verification
- Build check: `npm run build`
- Visual check: All pages should stretch wider on large screens while maintaining padding

---

## Phase 2: Fix Sticky Detail Header

**Goal**: Make the detail header actually stick below the Navbar when scrolling.

### Root Cause
The DetailHeader has `sticky top-0 z-10` but the Navbar also has `sticky top-0 z-50`. Both stick at y=0, but the Navbar's higher z-index covers the DetailHeader. The header appears to scroll away because it's hidden behind the Navbar.

### Step 2.1: Update DetailHeader
- **File**: `frontend/src/features/detail/components/DetailHeader.jsx`
- Change `sticky top-0` to `sticky top-16` — offsets by 64px (the Navbar's `h-16` height), positioning the header just below the Navbar
- Keep `z-10` (above content, below Navbar)
- Add `shadow-sm` for visual elevation indicator when stuck
- Increase `max-w-xl` on the title to `max-w-2xl` or `max-w-3xl` to take advantage of wider screens
- The container class was already updated in Phase 1

### Verification
- Scroll the detail page — the header bar (Portfolio ID + name + buttons) should remain visible, stuck just below the Navbar
- The header should not overlap or be hidden by the Navbar
- Title should not truncate prematurely on wide screens

---

## Phase 3: Empty Default Date Filters

**Goal**: Date filter inputs show blank instead of "dd/mm/aa" when empty.

### Step 3.1: Update ReportFilterPanel
- **File**: `frontend/src/features/reports/components/ReportFilterPanel.jsx`
- Add a `focused` state to track which date field is focused
- For date filter type (lines 102-114), use dynamic type switching:
  - When not focused AND value is empty: render as `type="text"` with `placeholder=""`
  - When focused OR has value: render as `type="date"`
- On focus → set `focused` to the field key
- On blur → clear `focused`

### Verification
- Open Acciones, Transacciones, and Transacciones JSON report pages
- Date fields should appear empty (no "dd/mm/aa")
- Clicking/focusing on a date field should show the date picker
- Selecting a date and blurring should display the date
- Clearing the date should return to blank

---

## Phase 4: Importe Hover Tooltip

**Goal**: Show full-precision currency on hover for all `k€` formatted values.

### Step 4.1: Add `formatCurrencyFull()` to utils
- **File**: `frontend/src/lib/utils.js`
- Add function that formats as `#.###,## €` using `es-ES` locale with 2 decimal places

### Step 4.2: Create `CurrencyCell` component
- **File**: `frontend/src/components/shared/CurrencyCell.jsx` (new)
- Accepts `value` (raw number) and `formattedValue` (the "k€" string)
- Wraps with `Tooltip` from `@/components/ui/tooltip`
- If value is null/NaN, renders plain formattedValue without tooltip

### Step 4.3: Integrate in Search DataGrid
- **File**: `frontend/src/features/search/components/DataGrid.jsx`
- In the cell renderer for data columns, when `colDef.type === 'currency'`:
  - Import and use `CurrencyCell` with `value={getValue()}` and `formattedValue={formatCellValue(value, colDef.type)}`
- Wrap the table (or the tbody) with `<TooltipProvider>`

### Step 4.4: Integrate in GenericReportPage
- **File**: `frontend/src/features/reports/components/GenericReportPage.jsx`
- In the cell renderer (line 165-183), when `colDef.type === 'currency'`:
  - Use `CurrencyCell` instead of plain `<span>`
- Wrap table with `<TooltipProvider>`

### Step 4.5: Integrate in SimpleTable
- **File**: `frontend/src/features/detail/components/SimpleTable.jsx`
- In the cell rendering logic (lines 89-115), when `col.type === 'currency'`:
  - Use `CurrencyCell` with the raw value and formatted value
- Wrap table with `<TooltipProvider>`

### Step 4.6: Integrate in ImportesSection
- **File**: `frontend/src/features/detail/components/sections/ImportesSection.jsx`
- Wrap each currency `<td>` content with `CurrencyCell`
- Wrap the table with `<TooltipProvider>`

### Step 4.7: Integrate in KeyValueDisplay
- **File**: `frontend/src/features/detail/components/KeyValueDisplay.jsx`
- When `type === 'currency'`, render with `CurrencyCell`

### Verification
- Search page: hover over any `k€` column → see full `€` value
- Detail page Importes table: hover → see full value
- Detail page SimpleTable sections with currency fields: hover → see full value
- Report pages with currency fields: hover → see full value

---

## Phase 5: Transacciones Table Redesign

**Goal**: Show transacciones tables with collapsible rows and color-coded badges.

### Step 5.1: Create shared badge colors
- **File**: `frontend/src/lib/badgeColors.js` (new)
- Define color maps for: TIPO_CAMBIO_COLORS, ESTADO_CAMBIO_COLORS, TIPO_OPERACION_COLORS, ESTADO_DB_COLORS
- These are reused across Detail sections and Report pages

### Step 5.2: Rewrite TransaccionesSection (Detail page)
- **File**: `frontend/src/features/detail/components/sections/TransaccionesSection.jsx`
- Replace `SimpleTable` usage with custom collapsible table (modeled after TransaccionesJsonSection)
- Main row columns: Fecha, Tabla, Campo, Tipo Cambio (badge), Estado (badge)
- Expanded detail: Valor Nuevo and Valor Anterior as formatted text blocks
- Use `expandedId` state for single-row expansion
- Import badge colors from shared file

### Step 5.3: Refactor TransaccionesJsonSection
- **File**: `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx`
- Replace inline `TIPO_OP_COLORS`, `ESTADO_COLORS` with imports from `badgeColors.js`
- No functional changes — just DRY cleanup

### Step 5.4: Add collapsible rendering to GenericReportPage
- **File**: `frontend/src/features/reports/components/GenericReportPage.jsx`
- Add support for `config.collapsibleConfig` option
- When present, render rows with expand/collapse instead of flat rows
- Config shape:
  ```javascript
  collapsibleConfig: {
    mainColumnIds: ['id', 'clave1', 'tabla', ...],    // Shown in collapsed row
    badgeColumns: {                                      // Rendered as badges
      tipo_cambio: TIPO_CAMBIO_COLORS,
      estado_cambio: ESTADO_CAMBIO_COLORS,
    },
    detailColumnIds: ['valor_nuevo', 'valor_antes_del_cambio', ...], // Shown in expanded
  }
  ```
- Maintain compatibility: if `collapsibleConfig` is not set, render as before

### Step 5.5: Configure Transacciones Report for collapsible mode
- **File**: `frontend/src/features/reports/TransaccionesReportPage.jsx`
- Add `collapsibleConfig` to the config object
- Main columns: id, clave1, tabla, campo_tabla, tipo_cambio (badge), estado_cambio (badge), fecha_registro_cambio
- Detail columns: valor_nuevo, valor_antes_del_cambio, comentarios, fecha_ejecucion_cambio

### Step 5.6: Configure Transacciones JSON Report for collapsible mode
- **File**: `frontend/src/features/reports/TransaccionesJsonReportPage.jsx`
- Add `collapsibleConfig` to the config object
- Main columns: id, entidad, tipo_operacion (badge), estado_db (badge), estado_excel (badge), fecha_creacion, usuario
- Detail columns: clave_primaria, cambios, mensaje_commit, error_detalle

### Verification
- Detail page → Transacciones section: collapsible rows with badges
- Detail page → Transacciones JSON section: unchanged behavior, DRY colors
- Transacciones report: collapsible rows with badges
- Transacciones JSON report: collapsible rows with badges
- All reports maintain sorting, pagination, filtering functionality

---

## Phase 6: Favorites System

**Goal**: Allow users to mark initiatives as favorites with clipboard and management features.

### Step 6.1: Create `useFavorites` hook
- **File**: `frontend/src/features/search/hooks/useFavorites.js` (new)
- Uses `createStorage('search-favorites')` for persistence
- State: array of `{ portfolioId, nombre }` objects
- Methods: `isFavorite()`, `toggleFavorite()`, `removeFavorite()`, `clearAll()`, `copyToClipboard()`
- `copyToClipboard()` uses `navigator.clipboard.writeText()` and returns success boolean

### Step 6.2: Create FavoritesDialog component
- **File**: `frontend/src/features/search/components/FavoritesDialog.jsx` (new)
- Uses `Dialog` from `@/components/ui/dialog`
- Lists all favorites with portfolio_id, nombre, and remove button (X)
- Empty state message when no favorites
- "Clear All" button in footer with confirmation (uses `ConfirmDialog`)

### Step 6.3: Create FavoritesToolbar component
- **File**: `frontend/src/features/search/components/FavoritesToolbar.jsx` (new)
- Star icon button with badge showing count (e.g., `Star` icon + `Badge` with number)
- `DropdownMenu` with:
  - "Copy Portfolio IDs" (Clipboard icon) — calls `copyToClipboard()`, shows toast
  - "Edit Favorites" (Pencil icon) — opens FavoritesDialog
  - "Clear All" (Trash icon) — opens confirmation, then clears

### Step 6.4: Integrate star icon in DataGrid
- **File**: `frontend/src/features/search/components/DataGrid.jsx`
- Add a new column after the select checkbox column: favorites star
- Cell renderer: `Star` icon from lucide
  - If favorite: `fill-yellow-400 text-yellow-400` (filled star)
  - If not: `text-muted-foreground` (outline star)
  - On click: call `onToggleFavorite(portfolioId, nombre)`
- Column width: ~40px, not sortable

### Step 6.5: Integrate in SearchPage
- **File**: `frontend/src/features/search/SearchPage.jsx`
- Call `useFavorites()` hook
- Pass to DataGrid: `favorites`, `onToggleFavorite`
- Add `FavoritesToolbar` to the toolbar section (next to ColumnConfigurator and ExportDropdown)

### Verification
- Click star → star fills, persists across page refresh
- Click again → star unfills
- Toolbar shows correct count
- "Copy Portfolio IDs" → copies to clipboard
- "Edit Favorites" → opens dialog, can remove individual favorites
- "Clear All" → confirms, then clears all

---

## Phase 7: Initiative Quick-View Side Drawer

**Goal**: Show initiative summary and hechos in a slide-in panel.

### Step 7.1: Create Sheet UI component
- **File**: `frontend/src/components/ui/sheet.jsx` (new)
- Portal-based side panel with overlay
- Props: `open`, `onOpenChange`, `side` (default: 'right'), `className`
- Sub-components: `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetClose`
- Features:
  - Overlay (click to close)
  - ESC to close
  - Body scroll lock
  - Slide-in animation (transform translateX)
  - Default width: `w-[480px] max-w-[90vw]`
  - Scroll overflow on content

### Step 7.2: Create InitiativeDrawer component
- **File**: `frontend/src/features/search/components/InitiativeDrawer.jsx` (new)
- Props: `isOpen`, `onClose`, `rowData` (datos_relevantes row)
- Fetches hechos: `apiClient.post('/hechos/search', {...})` when opened
- Layout:
  - Header: Portfolio ID (mono font), Nombre (bold)
  - Key-value grid: Origen, Digital Framework, Estado, Priorizacion, Cluster, Fecha Estado
  - Current year importe (formatted as full currency)
  - Hechos table: estado, fecha (DD/MM/YYYY), importe (k€ with tooltip)
  - Footer: "Go to Initiative" button → navigates to `/detail/:portfolio_id`
- Loading state while fetching hechos
- Empty state if no hechos

### Step 7.3: Add info button to RowActions
- **File**: `frontend/src/features/search/components/RowActions.jsx`
- Add an `Info` (or `PanelRightOpen`) icon button before the Eye button
- On click: calls `onOpenDrawer(portfolioId)` callback prop

### Step 7.4: Wire up DataGrid for drawer
- **File**: `frontend/src/features/search/components/DataGrid.jsx`
- Pass `onOpenDrawer` callback to `RowActions`
- RowActions receives and calls `onOpenDrawer` with portfolioId

### Step 7.5: Integrate in SearchPage
- **File**: `frontend/src/features/search/SearchPage.jsx`
- State: `drawerData = { isOpen: false, rowData: null }`
- `handleOpenDrawer(portfolioId)`: finds row in results.data, sets drawerData
- Render `<InitiativeDrawer>` at the page level
- Pass close handler

### Verification
- Click info button on any row → drawer slides in from right
- Drawer shows correct initiative data
- Hechos are loaded and displayed
- "Go to Initiative" navigates to detail page
- Close button (X) and overlay click close the drawer
- ESC closes the drawer

---

## Phase 8: Documentation Updates

### Step 8.1: Update README.md
- Add description of new UI features
- Update Search page section with Favorites and Drawer info

### Step 8.2: Update architecture_frontend.md
- Document the new components (Sheet, CurrencyCell, FavoritesToolbar, InitiativeDrawer)
- Document the collapsible mode for GenericReportPage
- Document the favorites storage pattern
- Document the full-width layout approach
- Document the badge colors shared constants

---

## Implementation Order & Dependencies

```
Phase 1 (Layout)  ──┐
Phase 2 (Header)  ──┤── Can start simultaneously
Phase 3 (Dates)   ──┘

Phase 4 (Tooltips) ── Depends on Phase 1 (layout changes affect file structure)

Phase 5 (Transacciones) ── Independent, can parallel with Phase 4

Phase 6 (Favorites) ── Independent of Phases 4-5

Phase 7 (Drawer) ── Independent, but best done after Phase 6 (both modify SearchPage)

Phase 8 (Docs) ── After all other phases
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Full-width layout breaks responsive design | Medium | Test all breakpoints; keep padding proportional |
| Tooltip performance with many currency cells | Low | TooltipProvider manages delay; tooltips are lazy |
| Collapsible mode in GenericReportPage affects other reports | Medium | Opt-in via config; no changes if `collapsibleConfig` absent |
| Date input type-switching edge cases | Low | Well-tested pattern; fallback to native behavior |
| localStorage quota for favorites | Very Low | Only stores portfolio_id + nombre; minimal size |
