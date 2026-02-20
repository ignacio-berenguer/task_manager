# Implementation Plan — feature_003

## Comprehensive UI Improvements: Search & Detail Pages

---

### Phase 1: Shared Utilities & Components

**New files:**
- `frontend/src/lib/formatDate.js`
- `frontend/src/components/shared/EstadoBadge.jsx`

**Steps:**

#### 1.1 Create `formatDate` utility
- Create `frontend/src/lib/formatDate.js`
- Extract the `formatDate()` function from DetailPage.jsx (YYYY-MM-DD → DD/MM/YYYY)
- Export as named export

#### 1.2 Create `EstadoBadge` component
- Create `frontend/src/components/shared/EstadoBadge.jsx`
- Map estado values to Badge variants:
  - "En Curso" → `destructive` (red)
  - "Completado", "Continuar en otra tarea" → `success` (green)
  - "Cancelado" → `secondary` (gray)
  - Other/empty → `outline`
- Accept `estado` and optional `size` props
- Render `<Badge variant={variant} size={size}>{estado || 'Sin estado'}</Badge>`

**Verification:** Import both in a test render to confirm they work.

---

### Phase 2: Search Page — Filter Enhancements

**File modified:** `frontend/src/features/search/SearchPage.jsx`

**Steps:**

#### 2.1 Add filter labels (Req 1)
- Wrap each filter input/select in a `<div>` with a `<label>` above it
- Labels: "ID Tarea", "Tarea", "Responsable", "Tema", "Estado"
- Style: `text-sm font-medium text-muted-foreground mb-1`

#### 2.2 Default estado filter (Req 2)
- Change initial state: `estado: 'En Curso'`
- Update `clearFilters()` to reset to `{ ..., estado: 'En Curso' }`
- Call `doSearch(0)` on initial load via useEffect (once filter options are loaded)

#### 2.3 Default sort field (Req 5)
- Initialize: `sortField = 'fecha_siguiente_accion'`, `sortDir = 'asc'`

#### 2.4 Keyboard shortcuts (Req 3, 4, 12)
- Add `useRef` for the tarea input element
- Add `useEffect` with global `keydown` listener:
  - `Ctrl+Shift+F` → focus tarea input, `preventDefault()`
  - `Ctrl+Shift+N` → open new tarea dialog, `preventDefault()`
- Wrap filter container with `onKeyDown`: Enter → `doSearch(0)`
- Show "Ctrl+Shift+F" hint in or near the tarea input placeholder

#### 2.5 Sticky filter panel as accordion on mobile (Req 10)
- On screens below `xl`:
  - Wrap filters in `<Accordion type="single" collapsible defaultValue="filters">`
  - Trigger text: "Filtros"
  - Add `sticky top-16 z-10 bg-background` to the accordion container

**Verification:** Filters display with labels, Enter triggers search, Ctrl+Shift+F focuses input, default estado is "En Curso", sort defaults to fecha_siguiente_accion asc.

---

### Phase 3: Search Page — Results Table Enhancements

**File modified:** `frontend/src/features/search/SearchPage.jsx`

**Steps:**

#### 3.1 Date formatting (Req 8)
- Import `formatDate` from `@/lib/formatDate`
- In the table cell renderer, apply `formatDate()` to `fecha_siguiente_accion` values

#### 3.2 Colored estado tags (Req 11)
- Import `EstadoBadge` from `@/components/shared/EstadoBadge`
- Replace `<Badge variant="outline">{row.estado}</Badge>` with `<EstadoBadge estado={row.estado} />`

#### 3.3 Sticky column headers (Req 9)
- Add `sticky top-0 z-10 bg-card` to `<thead>`
- Ensure the table's scrollable container supports sticky behavior

#### 3.4 Reorderable columns with localStorage (Req 14)
- Import `ColumnConfigurator` and `createStorage`
- Create `searchStorage = createStorage('search')`
- On mount, load column order: `searchStorage.loadJSON('columns', DEFAULT_COLUMNS)`
- Store in state: `const [columns, setColumns] = useState(...)`
- Add "Columnas" button that opens `ColumnConfigurator`
- On column change, save to localStorage
- Use `columns` state (instead of `DEFAULT_COLUMNS`) for rendering table headers and cells

#### 3.5 Inline tarea detail accordion (Req 7)
- Add `expandedRows` state as a `Set`
- Add a chevron/expand button per row (first column or separate column)
- When expanded, render an additional `<tr>` below with `colSpan`
- Expanded content shows: descripcion, notas_anteriores, and acciones list
- Fetch acciones lazily on expand via `GET /acciones/tarea/{tarea_id}`
- Cache fetched acciones in a `useRef(new Map())`

#### 3.6 Side drawer quick view (Req 20)
- Add `selectedDrawerTarea` state (null or tarea object)
- Add `drawerAcciones` state
- Add a small icon button (`PanelRightOpen` from lucide) in each row near tarea_id
- `onClick` (with `e.stopPropagation()`): set selected tarea, fetch acciones, open Sheet
- `<Sheet>` from the right with:
  - Tarea ID, Nombre, Responsable, Tema, EstadoBadge, Fecha Sig. Accion (formatted)
  - Acciones list ordered by fecha_accion descending
  - "Ver Detalle Completo" button → navigate to `/detail/:tarea_id`

**Verification:** Dates formatted as DD/MM/YYYY, estado shows colored tags, headers sticky, columns reorderable and persisted, accordion expand works, side drawer opens correctly.

---

### Phase 4: Search Page — Layout & New Tarea

**File modified:** `frontend/src/features/search/SearchPage.jsx`

**Steps:**

#### 4.1 Full-width layout (Req 13)
- Replace `max-w-7xl` with full-width: `w-full px-4 xl:px-8`

#### 4.2 Lateral filter sidebar on xl+ (Req 19)
- Restructure the page layout:
  ```jsx
  <div className="flex gap-6">
    {/* Sidebar - xl and above */}
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <FilterPanel /> {/* Filters stacked vertically */}
      </div>
    </aside>

    <div className="flex-1 min-w-0">
      {/* Mobile/tablet filters - below xl */}
      <div className="xl:hidden mb-6">
        <Accordion><FilterPanel /></Accordion>
      </div>

      {/* Results */}
      <ResultsTable />
    </div>
  </div>
  ```
- Extract filter UI into a `FilterPanel` internal component (or just a section) for reuse in both sidebar and mobile accordion

#### 4.3 New tarea button and dialog (Req 12)
- Add "Nueva Tarea" button in the page header, next to the title
- Wrap in `<Tooltip>` showing "Ctrl+Shift+N"
- Create a `<Dialog>` for new tarea creation:
  - Fields: tarea (required), responsable (dropdown), tema, estado (dropdown)
  - tarea_id: auto-generate suggestion or let user input
  - Fetch responsables from `GET /responsables`, estados from `GET /estados-tareas`
  - On submit: POST to `/tareas`, close dialog, refresh results
- Connect Ctrl+Shift+N shortcut to open this dialog

**Verification:** Wide screens show sidebar layout with results taking full remaining width. New tarea dialog works. Ctrl+Shift+N opens dialog.

---

### Phase 5: Detail Page Changes

**File modified:** `frontend/src/features/detail/DetailPage.jsx`

**Steps:**

#### 5.1 Import shared utilities
- Import `formatDate` from `@/lib/formatDate`
- Import `EstadoBadge` from `@/components/shared/EstadoBadge`
- Import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`
- Remove local `formatDate` function

#### 5.2 Responsable tag in header (Req 17)
- Add `<Badge variant="outline">{tarea.responsable}</Badge>` next to the estado badge in the header
- Replace the plain `<Badge>` for estado with `<EstadoBadge>`

#### 5.3 Reorder sections (Req 16, 17)
New order:
1. Header (tarea_id, estado, responsable, tarea title, edit button)
2. **Acciones Realizadas** Card (moved up — primary content)
3. **Notas Anteriores** Card (moved after acciones)
4. **Datos de la Tarea** — wrapped in Accordion, collapsed by default

#### 5.4 Datos Tarea as accordion (Req 17)
- Wrap the Datos Card in `<Accordion type="single" collapsible>`
- `<AccordionItem value="datos">`
- `<AccordionTrigger>` with "Datos de la Tarea" heading
- `<AccordionContent>` contains the `<dl>` grid

#### 5.5 Acciones sorted by fecha descending (Req 15)
- After fetching acciones, sort client-side:
  ```js
  const sorted = [...accionesRes.data].sort((a, b) => {
    if (!a.fecha_accion) return 1
    if (!b.fecha_accion) return -1
    return b.fecha_accion.localeCompare(a.fecha_accion)
  })
  ```

#### 5.6 Sticky acciones table headers (Req 15)
- Add `sticky top-0 z-10 bg-card` to the acciones `<thead>`

#### 5.7 Estado badges throughout
- Replace all `<Badge variant="outline">{acc.estado}</Badge>` with `<EstadoBadge estado={acc.estado} />`

#### 5.8 Back navigation with state preservation (Req 18)
- Change the back arrow `<Link to="/search">` to use `useNavigate(-1)` (browser back)
- This preserves React Router history and Search page state
- Additionally, in SearchPage: save search state (filters, page, sortField, sortDir) to `sessionStorage` before navigating to detail
- On SearchPage mount: check sessionStorage for saved state and restore

**Verification:** Detail page shows acciones first (sorted desc), then notas, then datos accordion (collapsed). Back button returns to Search with state preserved. Estado uses colored tags.

---

### Phase 6: Version, Changelog & Documentation

**Files modified:**
- `frontend/src/lib/version.js`
- `frontend/src/lib/changelog.js`
- `README.md`
- `specs/architecture/architecture_frontend.md`

**Steps:**

#### 6.1 Version bump
- Set `APP_VERSION` to `{ major: 1, minor: 3 }`

#### 6.2 Changelog entry
- Add at TOP of CHANGELOG array:
```js
{
  version: "1.003",
  feature: 3,
  title: "Mejoras UI: Busqueda y Detalle",
  summary: "Filtros con etiquetas, atajos de teclado, columnas ordenables y reordenables, tags de estado con color, panel lateral de filtros, visor rapido, acordeones, y mejoras de navegacion."
}
```

#### 6.3 Update README.md
- Update Search Page description with new features (filters sidebar, accordion, side drawer, shortcuts, colored tags)
- Update Detail Page description with reordered sections and accordion

#### 6.4 Update architecture_frontend.md
- Document EstadoBadge shared component
- Document formatDate utility
- Update Search Page section with lateral sidebar, column reordering, keyboard shortcuts, side drawer
- Update Detail Page section with new section order and accordion

**Verification:** `npm run build` succeeds. Landing page shows v1.003 with new changelog entry.

---

### Implementation Order & Dependencies

```
Phase 1 (Shared utilities & components)
  ↓
Phase 2 (Search filters) ──────────┐
  ↓                                 │
Phase 3 (Search results table) ─────┤── Can be done incrementally
  ↓                                 │
Phase 4 (Search layout & new tarea)─┘
  ↓
Phase 5 (Detail page)
  ↓
Phase 6 (Version & docs)
```

Phases 2-4 all modify SearchPage.jsx and should be done sequentially. Phase 5 is independent of 2-4 and could theoretically be parallelized, but since we're modifying one file at a time it's cleaner sequentially.

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SearchPage.jsx becomes too large | Extract FilterPanel, ResultsTable, TareaDrawer into sub-components in `features/search/components/` if needed |
| Keyboard shortcuts conflict with browser | Using Ctrl+Shift+F (not Ctrl+F) avoids browser find. Ctrl+Shift+N avoids browser new window |
| Column reorder breaks with new columns | Default columns fallback handles missing/extra column IDs gracefully |
| Side drawer data fetching is slow | Show loading spinner in drawer while acciones load |
| Back navigation doesn't preserve scroll | Use `sessionStorage` for scroll position, restore in `useEffect` with `window.scrollTo()` |
