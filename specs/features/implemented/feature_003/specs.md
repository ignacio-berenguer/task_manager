# Technical Specifications — feature_003

## Comprehensive UI Improvements: Search & Detail Pages

### 1. Overview

This feature is a frontend-only set of 20 UI improvements across the Search and Detail pages. No backend changes are required — all data is available via existing API endpoints.

**Scope:** `SearchPage.jsx`, `DetailPage.jsx`, new shared components, utility updates.

---

### 2. Existing Components Available for Reuse

| Component | Path | Usage in this feature |
|-----------|------|----------------------|
| `Accordion` | `ui/accordion.jsx` | Filter panel, Datos Tarea, inline search detail |
| `Sheet` | `ui/sheet.jsx` | Side drawer quick-view per tarea |
| `Badge` | `ui/badge.jsx` | Has `default`, `secondary`, `destructive`, `success`, `warning`, `outline` variants |
| `Tooltip` | `ui/tooltip.jsx` | Keyboard shortcut hints on buttons |
| `Collapsible` | `ui/collapsible.jsx` | Alternative collapsible sections |
| `ColumnConfigurator` | `shared/ColumnConfigurator.jsx` | Column reorder dialog with @dnd-kit |
| `SortableColumnItem` | `shared/SortableColumnItem.jsx` | Draggable column items |
| `createStorage` | `lib/storage.js` | localStorage persistence for column order, filters |
| `estadoOrder` | `lib/estadoOrder.js` | Canonical estado ordering |

---

### 3. New Shared Component: EstadoBadge

Create `frontend/src/components/shared/EstadoBadge.jsx` — a reusable component that renders an estado value as a colored badge.

**Color mapping:**

| Estado value | Color | Badge approach |
|-------------|-------|---------------|
| `En Curso` | Red | `variant="destructive"` |
| `Completado` | Green | `variant="success"` |
| `Continuar en otra tarea` | Green | `variant="success"` |
| `Cancelado` | Gray | `variant="secondary"` |
| Other / empty | Default outline | `variant="outline"` |

**Implementation:**
```jsx
function EstadoBadge({ estado, size }) {
  const variant = getEstadoVariant(estado)
  return <Badge variant={variant} size={size}>{estado || 'Sin estado'}</Badge>
}
```

The `getEstadoVariant(estado)` helper maps estado strings to badge variants. This component replaces all raw `<Badge>` renders for estado across SearchPage and DetailPage.

---

### 4. Search Page — Filter Enhancements

#### 4.1 Filter Labels (Req 1)

Add `<label>` elements above each filter input:
- "ID Tarea" above the tarea_id input
- "Tarea" above the tarea text input
- "Responsable" above the responsable select
- "Tema" above the tema select
- "Estado" above the estado select

Use `text-sm font-medium text-muted-foreground mb-1` styling.

#### 4.2 Default Estado Filter (Req 2)

- Change initial `filters` state: `estado: 'En Curso'` instead of `''`
- Update `clearFilters()` to reset estado to `'En Curso'` instead of `''`
- Auto-trigger search on first load with the default filter

#### 4.3 Keyboard Shortcuts (Req 3, 4)

**Ctrl+Shift+F** — Focus tarea filter input:
- Add a `useRef` on the tarea `<Input>` element
- Register a global `keydown` listener via `useEffect`
- Intercept `Ctrl+Shift+F`, call `e.preventDefault()`, focus the ref
- Show "Ctrl+Shift+F" hint text next to or inside the tarea input placeholder

**Enter to search** (Req 4):
- Wrap filter inputs in a `<form>` (or add `onKeyDown` to the filter container)
- On `Enter` key, call `doSearch(0)` and prevent default form submission

**Ctrl+Shift+N** — New tarea (Req 12):
- Register alongside Ctrl+Shift+F in the same keydown listener
- Opens a "Nueva Tarea" dialog
- Show shortcut hint in tooltip on the button

#### 4.4 Sticky Filter Panel as Accordion (Req 10)

- Wrap the filter panel in an `<Accordion>` with `type="single"` and `collapsible`
- Default to open (`defaultValue="filters"`)
- Trigger shows "Filtros" with chevron
- On wide screens (xl+), the sidebar is always visible (no accordion needed — see Req 19)
- Add `sticky top-16` (below navbar) positioning with `z-10`

---

### 5. Search Page — Results Table

#### 5.1 Default Sort (Req 5)

Initialize state:
```jsx
const [sortField, setSortField] = useState('fecha_siguiente_accion')
const [sortDir, setSortDir] = useState('asc')
```

The existing `doSearch` already sends `order_by` and `order_dir` when `sortField` is set.

#### 5.2 Sortable Columns (Req 6)

Already partially implemented — `handleSort()` exists and column headers have `onClick`. Ensure the sort indicator arrows are clearly visible and all columns support sorting.

#### 5.3 Date Format DD/MM/YYYY (Req 8)

Extract the `formatDate()` function from DetailPage into a shared utility `lib/formatDate.js`:
```js
export function formatDate(value) {
  if (!value) return '-'
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}
```

Use in both SearchPage (for `fecha_siguiente_accion` column) and DetailPage.

#### 5.4 Sticky Column Headers (Req 9)

Add to `<thead>`:
```jsx
<thead className="sticky top-0 z-10 bg-card">
```

The table container needs `overflow-y-auto` with a max-height or the page itself manages scrolling with `position: sticky`.

#### 5.5 Colored Estado Tags (Req 11)

Replace the raw `<Badge variant="outline">{row.estado}</Badge>` in the results table with `<EstadoBadge estado={row.estado} />`.

#### 5.6 Inline Tarea Detail Accordion (Req 7)

Each row in search results gets an expand/collapse toggle. When expanded, show an additional row spanning all columns with tarea details (descripcion, notas_anteriores, list of acciones).

**Implementation approach:**
- Track `expandedRows` as a `Set` of tarea_id values in state
- Each row has a chevron button in the first column
- Expanded row renders below the data row as a `<tr>` with `colSpan={columns.length}`
- Fetch acciones on demand when expanding (via `GET /acciones/tarea/{tarea_id}`)
- Cache fetched acciones in a `Map` to avoid re-fetching

#### 5.7 New Tarea Button (Req 12)

- Add a "Nueva Tarea" button in the page header area (next to the title)
- Use `<Tooltip>` to show "Ctrl+Shift+N" on hover
- Opens a Dialog for creating a new tarea (fields: tarea_id, tarea, responsable, tema, estado)
- On success, refresh search results
- Fetch responsables, temas, and estados from existing endpoints for the form dropdowns

#### 5.8 Reorderable Columns with localStorage (Req 14)

- Use the existing `ColumnConfigurator` component
- Add a "Columnas" button in the results header area
- Column order saved to localStorage via `createStorage('search')`:
  ```js
  const searchStorage = createStorage('search')
  // Save: searchStorage.saveJSON('columns', ['tarea_id', 'tarea', ...])
  // Load: searchStorage.loadJSON('columns', DEFAULT_COLUMNS)
  ```
- On page load, read column order from localStorage. If not found, use `DEFAULT_COLUMNS`

#### 5.9 Side Drawer Quick View (Req 20)

- Add a small icon button (e.g., `Eye` or `PanelRightOpen` from lucide) next to each tarea_id in the results table
- Clicking opens the `<Sheet>` from the right side
- Sheet content shows: Tarea ID, Nombre, Responsable, Tema, Estado (as EstadoBadge), Fecha Siguiente Accion (formatted)
- Below: list of acciones fetched from `GET /acciones/tarea/{tarea_id}`, ordered by fecha_accion descending
- Sheet has a "Ver Detalle" button that navigates to `/detail/:tarea_id`
- Click on the icon button should NOT trigger the row click (navigate to detail) — use `e.stopPropagation()`

---

### 6. Search Page — Layout

#### 6.1 Full-Width Layout (Req 13)

Remove or relax the `max-w-7xl` constraint on the main container. Use `w-full px-4 xl:px-8` instead.

#### 6.2 Lateral Filter Sidebar on Wide Screens (Req 19)

On `xl` breakpoint and above:
- Use a flex/grid layout: left sidebar (filters, ~280px fixed width) + right content (results, flex-1)
- Sidebar is sticky (`sticky top-16`) with its own scroll if needed (`max-h-[calc(100vh-5rem)] overflow-y-auto`)
- Filters display vertically in the sidebar (stacked, not in a grid)

On smaller screens:
- Filters display above results in the accordion (current behavior, enhanced with accordion)
- Grid layout: `grid-cols-1 sm:grid-cols-2` for filter inputs

**Responsive pattern:**
```jsx
<div className="flex gap-6">
  {/* Sidebar - visible on xl+ */}
  <aside className="hidden xl:block w-72 shrink-0 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
    <FilterPanel />
  </aside>

  {/* Mobile filters - visible below xl */}
  <div className="xl:hidden">
    <Accordion>
      <FilterPanel />
    </Accordion>
  </div>

  {/* Results */}
  <main className="flex-1 min-w-0">
    <ResultsTable />
  </main>
</div>
```

---

### 7. Detail Page Changes

#### 7.1 Section Reordering (Req 16, 17)

New order of sections:
1. **Header** — tarea_id, estado badge, responsable badge, tarea title, edit button
2. **Acciones Realizadas** — table with CRUD (first, most important)
3. **Notas Anteriores** — read-only (moved after acciones)
4. **Datos de la Tarea** — accordion, collapsed by default (moved to end)

#### 7.2 Responsable Tag in Header (Req 17)

Add `<EstadoBadge>` for estado and a separate `<Badge variant="outline">` for responsable in the header, next to the tarea_id:

```jsx
<div className="flex items-center gap-3">
  <h1 className="text-2xl font-bold">{tarea.tarea_id}</h1>
  <EstadoBadge estado={tarea.estado} />
  {tarea.responsable && <Badge variant="outline">{tarea.responsable}</Badge>}
</div>
```

#### 7.3 Datos Tarea as Accordion (Req 17)

Wrap "Datos de la Tarea" in an `<Accordion>` with `collapsible`, default collapsed:

```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="datos">
    <AccordionTrigger>Datos de la Tarea</AccordionTrigger>
    <AccordionContent>
      <dl>...</dl>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

#### 7.4 Acciones Ordered by Fecha Descending (Req 15)

Sort acciones client-side after fetching:
```js
const sorted = [...accionesRes.data].sort((a, b) => {
  if (!a.fecha_accion) return 1
  if (!b.fecha_accion) return -1
  return b.fecha_accion.localeCompare(a.fecha_accion)
})
setAcciones(sorted)
```

#### 7.5 Sticky Acciones Table Headers (Req 15)

Same approach as Search: `<thead className="sticky top-0 z-10 bg-card">`.

#### 7.6 Back Navigation with State Preservation (Req 18)

Use `useNavigate(-1)` for the back button (browser history back) instead of `<Link to="/search">`. This preserves the Search page state since React Router keeps the component mounted when using browser back.

Additionally, persist search state to `sessionStorage` (not localStorage — session-scoped):
- Before navigating to detail, save filters + results + page + scroll position
- On SearchPage mount, check for saved state and restore it
- Use `location.state` or `sessionStorage` via `createStorage('searchSession')`

---

### 8. New Utility: formatDate

Create `frontend/src/lib/formatDate.js`:
```js
export function formatDate(value) {
  if (!value) return '-'
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}
```

Remove the duplicate `formatDate` from DetailPage and import from lib.

---

### 9. New Tarea Creation Dialog

A `Dialog` in SearchPage for creating a new tarea:
- Fields: tarea_id (auto-suggested or manual), tarea, responsable (dropdown from /responsables), tema, estado (dropdown from /estados-tareas)
- POST to `/tareas` on submit
- On success: close dialog, refresh search results, show toast
- Accessible via button (with tooltip "Ctrl+Shift+N") and keyboard shortcut

---

### 10. Version & Changelog

- Set `APP_VERSION` to `{ major: 1, minor: 3 }` in `version.js`
- Add changelog entry at TOP of CHANGELOG:
```js
{
  version: "1.003",
  feature: 3,
  title: "Mejoras UI: Busqueda y Detalle",
  summary: "Filtros con etiquetas, atajos de teclado, columnas ordenables y reordenables, tags de estado con color, panel lateral de filtros, visor rapido, acordeones, y mejoras de navegacion."
}
```

---

### 11. Files Created / Modified

**New files:**
- `frontend/src/components/shared/EstadoBadge.jsx`
- `frontend/src/lib/formatDate.js`

**Modified files:**
- `frontend/src/features/search/SearchPage.jsx` (major rewrite)
- `frontend/src/features/detail/DetailPage.jsx` (section reorder, accordion, sticky, sorting)
- `frontend/src/lib/version.js`
- `frontend/src/lib/changelog.js`
