# Implementation Plan — feature_053: Quick Wins — Polish & Fixes

## Phase 1: R1 — Enable `searchable` on all MultiSelect instances

**Effort:** ~10 minutes

### Step 1.1: FilterPanel.jsx (Search page)

Add `searchable` to the 6 MultiSelect instances that lack it:
- Digital Framework (line ~178)
- Unidad (line ~189)
- Estado (line ~200)
- Cluster (line ~211)
- Tipo (line ~222)
- Cerrada Económicamente (line ~245)

Etiquetas already has `searchable` — leave as is.

### Step 1.2: FilterBar.jsx (Dashboard)

Add `searchable` to the Framework MultiSelect (line ~58). The other 3 (Unidad, Cluster, Estado) already have it.

### Step 1.3: ReportFilterPanel.jsx (Reports)

Add `searchable` prop to the `<MultiSelect>` in the `def.type === 'multiselect'` branch (line ~135). This covers all report pages dynamically.

---

## Phase 2: R2 — Persist FilterPanel collapsed state

**Effort:** ~10 minutes

### Step 2.1: Import storage in FilterPanel.jsx

Import `searchStorage` (or create a new `createStorage` instance) to persist the panel state.

### Step 2.2: Replace `useState(true)` with persisted state

```js
// Import the existing storage
import { createStorage } from '@/lib/storage'
const panelStorage = createStorage('portfolio-search')

// Inside the component:
const [isOpen, setIsOpen] = useState(() => panelStorage.loadJSON('filterPanelOpen', true))

// Wrap setIsOpen to also persist:
const handleOpenChange = (open) => {
  setIsOpen(open)
  panelStorage.saveJSON('filterPanelOpen', open)
}
```

Replace `onOpenChange={setIsOpen}` with `onOpenChange={handleOpenChange}` in the `<Collapsible>`.

---

## Phase 3: R3 — Detail Page Collapse/Expand All + Empty Sections

**Effort:** ~2 hours

This is the largest phase. Implementation order matters due to dependencies.

### Step 3.1: Add controlled mode to `accordion.jsx`

Enhance the `Accordion` component to accept optional `value` (array of open items) and `onValueChange` callback. When `value` is provided, the component operates in controlled mode:

```jsx
const Accordion = forwardRef(
  ({ children, type = 'single', collapsible = false, defaultValue, value: controlledValue, onValueChange, className, ...props }, ref) => {
    const [internalOpenItems, setInternalOpenItems] = useState(...)
    const isControlled = controlledValue !== undefined
    const openItems = isControlled ? controlledValue : internalOpenItems

    const toggleItem = (itemValue) => {
      let next
      if (type === 'single') {
        const isOpen = openItems.includes(itemValue)
        next = (isOpen && collapsible) ? [] : isOpen ? openItems : [itemValue]
      } else {
        const isOpen = openItems.includes(itemValue)
        next = isOpen ? openItems.filter((v) => v !== itemValue) : [...openItems, itemValue]
      }
      if (isControlled) {
        onValueChange?.(next)
      } else {
        setInternalOpenItems(next)
      }
    }
    // ... rest unchanged
  }
)
```

### Step 3.2: Update `SectionAccordion` for controlled mode

Accept new optional props:
- `isOpen` (boolean) — whether the section is currently open
- `onToggle` (function(id)) — called when user clicks the trigger

When `isOpen` and `onToggle` are provided, pass `value={isOpen ? [id] : []}` and `onValueChange` to the underlying `Accordion`. When absent, keep current `defaultValue` behavior.

```jsx
export function SectionAccordion({
  id, title, count, defaultOpen = false,
  children, className, headerAction,
  isOpen: controlledOpen, onToggle,
}) {
  const isEmpty = count === 0
  const isControlled = controlledOpen !== undefined

  const accordionProps = isControlled
    ? { value: controlledOpen ? [id] : [], onValueChange: () => onToggle?.(id) }
    : { defaultValue: defaultOpen ? id : undefined }

  return (
    <Accordion type="single" collapsible {...accordionProps} className={...} id={id}>
      {/* ... unchanged */}
    </Accordion>
  )
}
```

### Step 3.3: Define section metadata in `DetailPage`

Create a `SECTION_DEFS` array that centralizes all section metadata. This array drives:
- Which sections render as accordions (those with data)
- Which appear in the empty sections panel
- Which support CRUD (create action)
- Sidebar nav items

```js
const SECTION_DEFS = [
  {
    id: 'datos-descriptivos',
    title: 'Datos Descriptivos',
    dataKey: 'datos_descriptivos',
    type: 'single',       // 1:1 entity
    navLabel: 'Datos Desc.',
    crudAction: 'edit',    // supports create/edit
  },
  {
    id: 'hechos',
    title: 'Hechos',
    dataKey: 'hechos',
    type: 'multi',         // 1:N entity
    navLabel: 'Hechos',
    crudAction: 'create',  // supports create
  },
  // ... all 21 sections
  {
    id: 'transacciones-json',
    title: 'Transacciones JSON',
    dataKey: 'transacciones_json',
    type: 'multi',
    navLabel: 'Trans. JSON',
    crudAction: null,      // read-only
  },
]
```

### Step 3.4: Compute section data presence + lift accordion state

In `DetailPage`, after extracting data from the API response:

```js
// Compute which sections have data
const sectionHasData = useMemo(() => {
  const map = {}
  for (const def of SECTION_DEFS) {
    if (def.dataKey === 'transacciones_json') {
      map[def.id] = (transaccionesJson?.length || 0) > 0
    } else if (def.dataKey === 'grupos_iniciativas') {
      const g = data.grupos_iniciativas
      map[def.id] = ((g?.as_grupo?.length || 0) + (g?.as_componente?.length || 0)) > 0
    } else if (def.type === 'single') {
      map[def.id] = !!getFirstOrSelf(data[def.dataKey])
    } else {
      map[def.id] = getArrayLength(data[def.dataKey]) > 0
    }
  }
  return map
}, [data, transaccionesJson])

// Accordion state: set of open section IDs
const [openSections, setOpenSections] = useState(() => {
  // Initialize: open sections that have data (respecting current defaultOpen logic)
  const initial = new Set()
  for (const def of SECTION_DEFS) {
    if (sectionHasData[def.id] && shouldDefaultOpen(def)) {
      initial.add(def.id)
    }
  }
  return initial
})

const toggleSection = useCallback((id) => {
  setOpenSections((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}, [])

const expandAll = useCallback(() => {
  setOpenSections(new Set(SECTION_DEFS.filter((d) => sectionHasData[d.id]).map((d) => d.id)))
}, [sectionHasData])

const collapseAll = useCallback(() => {
  setOpenSections(new Set())
}, [])
```

### Step 3.5: Render only sections with data + add Expand/Collapse buttons

In the JSX, conditionally render each `SectionAccordion` only when its data exists. Add Expand/Collapse buttons in the header area (right side of the `DetailHeader` or in a toolbar row below it):

```jsx
{/* Toolbar with Expand/Collapse buttons */}
<div className="flex justify-end gap-2 mb-4">
  <Button variant="outline" size="sm" onClick={expandAll}>
    <ChevronsDown className="h-4 w-4 mr-1" /> Expandir Todo
  </Button>
  <Button variant="outline" size="sm" onClick={collapseAll}>
    <ChevronsUp className="h-4 w-4 mr-1" /> Contraer Todo
  </Button>
</div>

{/* Only render sections with data */}
{sectionHasData['datos-descriptivos'] && (
  <SectionAccordion
    id="datos-descriptivos"
    title="Datos Descriptivos"
    isOpen={openSections.has('datos-descriptivos')}
    onToggle={toggleSection}
    headerAction={...}
  >
    <DatosDescriptivosSection data={datos_descriptivos} />
  </SectionAccordion>
)}
{/* ... repeat for all sections */}
```

### Step 3.6: Create `EmptySectionsPanel` component

New file `frontend/src/features/detail/components/EmptySectionsPanel.jsx`:

```jsx
/**
 * Summary panel for sections without data.
 * Shows section names with optional "Añadir" create buttons for CRUD-enabled entities.
 */
export function EmptySectionsPanel({ emptySections, onCreateAction }) {
  if (emptySections.length === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-dashed p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Secciones sin datos
      </h3>
      <div className="flex flex-wrap gap-2">
        {emptySections.map((section) => (
          <div key={section.id} className="inline-flex items-center gap-1 ...">
            <span className="text-sm text-muted-foreground">{section.title}</span>
            {section.crudAction && (
              <Button variant="ghost" size="icon" className="h-5 w-5"
                onClick={() => onCreateAction(section.id)}
                title={`Añadir ${section.title}`}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

Render this at the bottom of the sections area. The `onCreateAction` callback maps section IDs to opening the corresponding create modal.

### Step 3.7: Update `DetailNav` to filter empty sections

Pass the `sectionHasData` map to `DetailNav`. Filter the SECTIONS array to only include sections with data.

```jsx
<DetailNav data={data} transaccionesJsonCount={transaccionesJson?.length} sectionHasData={sectionHasData} />
```

In `DetailNav.jsx`, filter items:
```js
const filteredItems = items.filter((item) => !sectionHasData || sectionHasData[item.anchor] !== false)
```

---

## Phase 4: R4 — CTA Button on Landing Page Hero

**Effort:** ~10 minutes

### Step 4.1: Update HeroSection.jsx

Import Clerk components and Button:

```jsx
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
```

Add CTA between subtext and stats:

```jsx
{/* CTA */}
<div className="mt-8 flex justify-center gap-4">
  <SignedIn>
    <Button asChild size="lg">
      <Link to="/dashboard">Ir al Dashboard</Link>
    </Button>
  </SignedIn>
  <SignedOut>
    <Button asChild size="lg">
      <Link to="/sign-in">Iniciar Sesión</Link>
    </Button>
  </SignedOut>
</div>
```

---

## Phase 5: Post-Feature Checklist

### Step 5.1: Version bump
Increment `APP_VERSION.minor` to `53` in `frontend/src/lib/version.js`.

### Step 5.2: Changelog entry
Add entry at top of `CHANGELOG` array in `frontend/src/lib/changelog.js`.

### Step 5.3: Build verification
```bash
cd frontend && npm run build
```

### Step 5.4: Update README.md and architecture docs

### Step 5.5: Close feature
Use `/close_feature feature_053`.
