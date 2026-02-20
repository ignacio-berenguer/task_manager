# Implementation Plan: Feature 015 - Initiative Search and Detail Pages

## Overview

This document outlines the step-by-step implementation plan for the initiative search and detail pages feature.

---

## Phase 1: Dependencies and UI Components

### Step 1.1: Install New Dependencies

```bash
cd frontend
npm install @tanstack/react-table xlsx file-saver
```

### Step 1.2: Create Accordion Component

**File:** `src/components/ui/accordion.jsx`

**Implementation:**
- Based on Shadcn/ui Accordion pattern
- Uses Radix UI primitives or custom implementation
- Supports single/multiple expansion modes
- Smooth expand/collapse animation

### Step 1.3: Create Badge Component

**File:** `src/components/ui/badge.jsx`

**Implementation:**
- Variants: default, secondary, destructive, outline
- Sizes: sm, md
- Used for counts like "Hechos (15)"

### Step 1.4: Create Input Component

**File:** `src/components/ui/input.jsx`

**Implementation:**
- Standard text input with variants
- Support for icons (left/right)
- Error state styling

### Step 1.5: Create Combobox Component

**File:** `src/components/ui/combobox.jsx`

**Implementation:**
- Searchable dropdown
- Support for async options loading
- Clear button
- Used for Portfolio ID selection

### Step 1.6: Create Tooltip Component

**File:** `src/components/ui/tooltip.jsx`

**Implementation:**
- Hover tooltip with delay
- Used for action button descriptions

### Step 1.7: Create DropdownMenu Component

**File:** `src/components/ui/dropdown-menu.jsx`

**Implementation:**
- Trigger + menu content pattern
- Used for export format selection

### Step 1.8: Create Skeleton Component

**File:** `src/components/ui/skeleton.jsx`

**Implementation:**
- Animated loading placeholder
- Various shapes: text, card, table row

### Step 1.9: Create Label Component

**File:** `src/components/ui/label.jsx`

**Implementation:**
- Form label with required indicator option
- Consistent styling with form inputs

---

## Phase 2: Search Infrastructure

### Step 2.1: Create Search Storage Utilities

**File:** `src/features/search/utils/searchStorage.js`

**Functions:**
```javascript
const KEYS = {
  FILTERS: 'portfolio-search-filters',
  COLUMNS: 'portfolio-search-columns',
  COLUMN_ORDER: 'portfolio-search-column-order',
  PAGE_SIZE: 'portfolio-search-page-size'
}

export function saveFilters(filters) { ... }
export function loadFilters() { ... }
export function saveColumns(columns) { ... }
export function loadColumns() { ... }
export function saveColumnOrder(order) { ... }
export function loadColumnOrder() { ... }
export function savePageSize(size) { ... }
export function loadPageSize() { ... }
export function resetToDefaults() { ... }
```

### Step 2.2: Create Column Definitions

**File:** `src/features/search/utils/columnDefinitions.js`

**Implementation:**
```javascript
export const DEFAULT_COLUMNS = [
  'portfolio_id',
  'nombre',
  'unidad',
  'digital_framework_level_1',
  'estado_de_la_iniciativa',
  'fecha_de_ultimo_estado',
  'cluster_2025',
  'tipo',
  'importe_2026'
]

export const ALL_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text' },
  { id: 'nombre', label: 'Nombre', type: 'text' },
  { id: 'unidad', label: 'Unidad', type: 'text' },
  // ... all 60+ columns with type info
]

export function getColumnDef(columnId) { ... }
export function formatCellValue(value, type) { ... }
```

### Step 2.3: Create Export Helpers

**File:** `src/features/search/utils/exportHelpers.js`

**Functions:**
```javascript
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export function exportToTSV(data, columns, filename) { ... }
export function exportToCSV(data, columns, filename) { ... }
export function exportToJSON(data, filename) { ... }
export function exportToExcel(data, columns, filename) { ... }
export function generateFilename(extension) {
  const timestamp = new Date().toISOString().replace(/[:-]/g, '').slice(0, 15)
  return `iniciativas_export_${timestamp}.${extension}`
}
```

### Step 2.4: Create Search API Hook

**File:** `src/features/search/hooks/useSearchInitiatives.js`

**Implementation:**
```javascript
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useSearchInitiatives() {
  return useMutation({
    mutationFn: async (searchRequest) => {
      const response = await apiClient.post('/datos-relevantes/search', searchRequest)
      return response.data
    }
  })
}

// For fetching all results (export)
export function useExportInitiatives() {
  return useMutation({
    mutationFn: async (filters) => {
      const response = await apiClient.post('/datos-relevantes/search', {
        filters,
        limit: 10000,
        offset: 0
      })
      return response.data
    }
  })
}
```

### Step 2.5: Create Filter Options Hook

**File:** `src/features/search/hooks/useFilterOptions.js`

**Implementation:**
```javascript
export function useFilterOptions() {
  // Fetch all datos_relevantes to extract unique filter values
  // OR use dedicated endpoint if available

  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await apiClient.post('/datos-relevantes/search', {
        filters: [],
        limit: 1000
      })
      const data = response.data.data

      return {
        unidades: [...new Set(data.map(d => d.unidad).filter(Boolean))].sort(),
        estados: [...new Set(data.map(d => d.estado_de_la_iniciativa).filter(Boolean))].sort(),
        clusters: [...new Set(data.map(d => d.cluster_2025).filter(Boolean))].sort(),
        tipos: [...new Set(data.map(d => d.tipo).filter(Boolean))].sort(),
        portfolioOptions: data.map(d => ({
          value: d.portfolio_id,
          label: `${d.portfolio_id} - ${d.nombre?.substring(0, 50) || 'Sin nombre'}`
        }))
      }
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}
```

### Step 2.6: Create Preferences Hook

**File:** `src/features/search/hooks/useSearchPreferences.js`

**Implementation:**
```javascript
export function useSearchPreferences() {
  const [columns, setColumns] = useState(() => loadColumns())
  const [columnOrder, setColumnOrder] = useState(() => loadColumnOrder())
  const [pageSize, setPageSize] = useState(() => loadPageSize())

  // Persist on change
  useEffect(() => { saveColumns(columns) }, [columns])
  useEffect(() => { saveColumnOrder(columnOrder) }, [columnOrder])
  useEffect(() => { savePageSize(pageSize) }, [pageSize])

  const resetToDefaults = () => { ... }

  return {
    columns, setColumns,
    columnOrder, setColumnOrder,
    pageSize, setPageSize,
    resetToDefaults
  }
}
```

---

## Phase 3: Search Components

### Step 3.1: Create Filter Panel Component

**File:** `src/features/search/components/FilterPanel.jsx`

**Props:**
- `filters`: current filter values
- `onFiltersChange`: callback when filters change
- `onApply`: callback when "Apply" clicked
- `onClear`: callback when "Clear" clicked
- `filterOptions`: dropdown options from hook

**Structure:**
```jsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger>
    <div>Filters {hasActiveFilters && <Badge>{count}</Badge>}</div>
    <ChevronDown />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Portfolio ID - Combobox */}
      {/* Nombre - Text Input */}
      {/* Digital Framework - MultiSelect */}
      {/* Unidad - MultiSelect */}
      {/* Estado - MultiSelect */}
      {/* Cluster - MultiSelect */}
      {/* Tipo - MultiSelect */}
    </div>
    <div className="flex gap-2 mt-4">
      <Button onClick={onApply}>Apply Filters</Button>
      <Button variant="outline" onClick={onClear}>Clear</Button>
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Step 3.2: Create Column Selector Component

**File:** `src/features/search/components/ColumnSelector.jsx`

**Props:**
- `selectedColumns`: array of selected column IDs
- `columnOrder`: array defining order
- `onColumnsChange`: callback
- `onOrderChange`: callback
- `onReset`: callback to reset to defaults

**Implementation:**
- Modal/dialog with checkboxes for each column
- Drag-and-drop reordering (or up/down buttons)
- "Select All" / "Select None" buttons
- "Reset to Default" button
- Group columns by category (Estado, Financial, etc.)

### Step 3.3: Create Export Dropdown Component

**File:** `src/features/search/components/ExportDropdown.jsx`

**Props:**
- `onExport`: callback with format parameter
- `isExporting`: boolean for loading state
- `disabled`: boolean

**Implementation:**
```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" disabled={disabled}>
      {isExporting ? <Spinner /> : <Download />}
      Export
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => onExport('tsv')}>
      Tab-delimited (.tsv)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onExport('csv')}>
      CSV (.csv)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onExport('json')}>
      JSON (.json)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onExport('xlsx')}>
      Excel (.xlsx)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Step 3.4: Create Row Actions Component

**File:** `src/features/search/components/RowActions.jsx`

**Props:**
- `portfolioId`: string
- `onView`: callback (or use navigate internally)

**Implementation:**
```jsx
<div className="flex gap-1">
  <Tooltip content="View Details">
    <Button variant="ghost" size="icon" onClick={() => navigate(`/detail/${portfolioId}`)}>
      <Eye className="h-4 w-4" />
    </Button>
  </Tooltip>

  {/* Future actions - disabled */}
  <Tooltip content="Edit (Coming soon)">
    <Button variant="ghost" size="icon" disabled>
      <Pencil className="h-4 w-4 text-muted-foreground" />
    </Button>
  </Tooltip>
  {/* ... more disabled actions */}
</div>
```

### Step 3.5: Create Pagination Component

**File:** `src/features/search/components/Pagination.jsx`

**Props:**
- `currentPage`: number
- `totalPages`: number
- `totalItems`: number
- `pageSize`: number
- `onPageChange`: callback
- `onPageSizeChange`: callback

**Implementation:**
```jsx
<div className="flex items-center justify-between">
  <div>Showing {start}-{end} of {totalItems} results</div>
  <div className="flex items-center gap-2">
    <Select value={pageSize} onValueChange={onPageSizeChange}>
      <option value={25}>25</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
      <option value={200}>200</option>
    </Select>

    <Button onClick={() => onPageChange(1)} disabled={currentPage === 1}>
      <ChevronsLeft />
    </Button>
    <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
      <ChevronLeft />
    </Button>
    <span>Page {currentPage} of {totalPages}</span>
    <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
      <ChevronRight />
    </Button>
    <Button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
      <ChevronsRight />
    </Button>
  </div>
</div>
```

### Step 3.6: Create Data Grid Component

**File:** `src/features/search/components/DataGrid.jsx`

**Props:**
- `data`: array of rows
- `columns`: array of visible column IDs
- `columnOrder`: array defining order
- `isLoading`: boolean
- `sortConfig`: { field, direction }
- `onSort`: callback

**Implementation:**
- Use @tanstack/react-table
- Define column accessor for each field
- Custom cell renderers for different types (date, currency)
- Header click for sorting
- Sort indicators (arrow up/down)
- Loading skeleton rows

```jsx
const table = useReactTable({
  data,
  columns: buildColumns(visibleColumns, columnOrder),
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true, // Server-side sorting
  onSortingChange: handleSortChange,
})

return (
  <div className="border rounded-lg">
    <table className="w-full">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id} className="bg-muted">
            {headerGroup.headers.map(header => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {header.column.columnDef.header}
                <SortIndicator direction={header.column.getIsSorted()} />
              </th>
            ))}
            <th>Actions</th>
          </tr>
        ))}
      </thead>
      <tbody>
        {isLoading ? (
          <SkeletonRows count={5} columns={visibleColumns.length + 1} />
        ) : (
          table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
              <td>
                <RowActions portfolioId={row.original.portfolio_id} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)
```

### Step 3.7: Create Search Page

**File:** `src/features/search/SearchPage.jsx`

**Implementation:**
```jsx
export default function SearchPage() {
  // Hooks
  const { filters, setFilters } = useState({})
  const { columns, columnOrder, pageSize, setPageSize, resetToDefaults } = useSearchPreferences()
  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions()
  const searchMutation = useSearchInitiatives()
  const exportMutation = useExportInitiatives()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ field: null, direction: null })
  const [results, setResults] = useState({ data: [], total: 0 })

  // Search function
  const executeSearch = async () => {
    const searchRequest = buildSearchRequest(filters, sortConfig, pageSize, currentPage)
    const response = await searchMutation.mutateAsync(searchRequest)
    setResults(response)
  }

  // Export function
  const handleExport = async (format) => {
    const response = await exportMutation.mutateAsync(filters)
    switch (format) {
      case 'tsv': exportToTSV(response.data, columns); break;
      case 'csv': exportToCSV(response.data, columns); break;
      case 'json': exportToJSON(response.data); break;
      case 'xlsx': exportToExcel(response.data, columns); break;
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1>Search Initiatives</h1>

        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApply={executeSearch}
          onClear={() => { setFilters({}); executeSearch() }}
          filterOptions={filterOptions}
        />

        <div className="flex justify-between my-4">
          <div className="flex gap-2">
            <ColumnSelector
              selectedColumns={columns}
              columnOrder={columnOrder}
              onColumnsChange={setColumns}
              onOrderChange={setColumnOrder}
              onReset={resetToDefaults}
            />
            <ExportDropdown
              onExport={handleExport}
              isExporting={exportMutation.isPending}
              disabled={results.data.length === 0}
            />
          </div>
          <div>Total: {results.total} initiatives</div>
        </div>

        <DataGrid
          data={results.data}
          columns={columns}
          columnOrder={columnOrder}
          isLoading={searchMutation.isPending}
          sortConfig={sortConfig}
          onSort={setSortConfig}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(results.total / pageSize)}
          totalItems={results.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </Layout>
  )
}
```

---

## Phase 4: Detail Page Infrastructure

### Step 4.1: Create Portfolio Detail Hook

**File:** `src/features/detail/hooks/usePortfolioDetail.js`

**Implementation:**
```javascript
export function usePortfolioDetail(portfolioId) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      const response = await apiClient.get(`/portfolio/${portfolioId}`)
      return response.data
    },
    enabled: !!portfolioId
  })
}
```

### Step 4.2: Create Key-Value Display Component

**File:** `src/features/detail/components/KeyValueDisplay.jsx`

**Props:**
- `data`: object with key-value pairs
- `fields`: array of { key, label, type } to display
- `columns`: number of columns (default: 3)

**Implementation:**
```jsx
export function KeyValueDisplay({ data, fields, columns = 3 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-x-4 gap-y-2`}>
      {fields.map(({ key, label, type }) => (
        <div key={key} className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-medium">{formatValue(data[key], type)}</span>
        </div>
      ))}
    </div>
  )
}
```

### Step 4.3: Create Section Accordion Component

**File:** `src/features/detail/components/SectionAccordion.jsx`

**Props:**
- `title`: section title
- `count`: item count (optional)
- `defaultOpen`: boolean
- `children`: content

**Implementation:**
```jsx
export function SectionAccordion({ title, count, defaultOpen = false, children }) {
  const isEmpty = count === 0

  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? 'content' : undefined}>
      <AccordionItem value="content" className="border rounded-lg mb-4">
        <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {count !== undefined && (
              <Badge variant={isEmpty ? 'outline' : 'secondary'}>
                {isEmpty ? 'empty' : count}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

---

## Phase 5: Detail Section Components

### Step 5.1: Create Datos Descriptivos Section

**File:** `src/features/detail/components/sections/DatosDescriptivosSection.jsx`

**Implementation:**
- KeyValueDisplay with all datos_descriptivos fields
- 3-column layout on desktop

### Step 5.2: Create Hechos Section

**File:** `src/features/detail/components/sections/HechosSection.jsx`

**Implementation:**
- Sortable table
- Columns: fecha, partida_presupuestaria, importe, estado, notas
- Default sort: fecha descending

### Step 5.3: Create Informacion Economica Section

**File:** `src/features/detail/components/sections/InformacionEconomicaSection.jsx`

**Implementation:**
- KeyValueDisplay with informacion_economica fields
- Group by category (investment, WBE, flags)

### Step 5.4: Create Importes Section

**File:** `src/features/detail/components/sections/ImportesSection.jsx`

**Implementation:**
- Display financial data from datos_relevantes
- Organized by year (2024, 2025, 2026, 2027, 2028)
- For each year: budget, SM200, aprobado, facturacion, importe

```jsx
const YEAR_FIELDS = {
  2024: ['budget_2024', 'importe_sm200_24', 'importe_aprobado_2024', 'importe_citetic_24', 'importe_facturacion_2024', 'importe_2024'],
  2025: ['budget_2025', 'importe_sm200_2025', 'importe_aprobado_2025', 'importe_facturacion_2025', 'importe_2025'],
  2026: ['budget_2026', 'importe_sm200_2026', 'importe_aprobado_2026', 'importe_facturacion_2026', 'importe_2026'],
  2027: ['budget_2027', 'importe_sm200_2027', 'importe_aprobado_2027', 'importe_facturacion_2027', 'importe_2027'],
  2028: ['importe_2028']
}
```

### Step 5.5: Create Acciones Section

**File:** `src/features/detail/components/sections/AccionesSection.jsx`

**Implementation:**
- Table: nombre, estado, siguiente_accion, comentarios
- Compact rows

### Step 5.6: Create Notas Section

**File:** `src/features/detail/components/sections/NotasSection.jsx`

**Implementation:**
- List of notes with fecha, registrado_por, nota
- Card-style items

### Step 5.7: Create Justificaciones Section

**File:** `src/features/detail/components/sections/JustificacionesSection.jsx`

**Implementation:**
- Table: tipo_justificacion, valor, fecha_modificacion

### Step 5.8: Create Descripciones Section

**File:** `src/features/detail/components/sections/DescripcionesSection.jsx`

**Implementation:**
- List: tipo_descripcion as heading, descripcion as content

### Step 5.9: Create Beneficios Section

**File:** `src/features/detail/components/sections/BeneficiosSection.jsx`

**Implementation:**
- Grouped by grupo/concepto
- Table: periodo, importe, valor, texto

### Step 5.10: Create LTP Section

**File:** `src/features/detail/components/sections/LtpSection.jsx`

**Implementation:**
- Table: tarea, responsable, estado, siguiente_accion

### Step 5.11: Create Facturacion Section

**File:** `src/features/detail/components/sections/FacturacionSection.jsx`

**Implementation:**
- Table: ano, mes, importe, concepto_factura

### Step 5.12: Create Datos Ejecucion Section

**File:** `src/features/detail/components/sections/DatosEjecucionSection.jsx`

**Implementation:**
- KeyValueDisplay: fechas, porcentajes, importe fields

### Step 5.13: Create Grupos Iniciativas Section

**File:** `src/features/detail/components/sections/GruposIniciativasSection.jsx`

**Implementation:**
- Table: portfolio_id_grupo, nombre_grupo, tipo_agrupacion

### Step 5.14: Create Estado Especial Section

**File:** `src/features/detail/components/sections/EstadoEspecialSection.jsx`

**Implementation:**
- KeyValueDisplay: estado_especial, fecha, comentarios

### Step 5.15: Create Transacciones Section

**File:** `src/features/detail/components/sections/TransaccionesSection.jsx`

**Implementation:**
- Table: fecha_registro, tabla, campo, tipo_cambio, valor_nuevo, valor_antes
- Default collapsed (can be large)

---

## Phase 6: Detail Page Assembly

### Step 6.1: Create Detail Header Component

**File:** `src/features/detail/components/DetailHeader.jsx`

**Implementation:**
```jsx
export function DetailHeader({ portfolioId, nombre, onBack }) {
  return (
    <div className="sticky top-0 bg-background border-b py-4 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="text-sm text-muted-foreground">Portfolio ID: {portfolioId}</div>
            <h1 className="text-xl font-bold">{nombre}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Future actions - disabled */}
          <Tooltip content="Edit (Coming soon)">
            <Button variant="outline" disabled>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Tooltip>
          {/* ... more disabled buttons */}
        </div>
      </div>
    </div>
  )
}
```

### Step 6.2: Create Detail Page

**File:** `src/features/detail/DetailPage.jsx`

**Implementation:**
```jsx
export default function DetailPage() {
  const { portfolio_id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePortfolioDetail(portfolio_id)

  if (isLoading) return <DetailPageSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFoundMessage portfolioId={portfolio_id} />

  const {
    datos_descriptivos,
    datos_relevantes,
    hechos,
    informacion_economica,
    acciones,
    notas,
    justificaciones,
    descripciones,
    beneficios,
    ltp,
    facturacion,
    datos_ejecucion,
    grupos_iniciativas,
    estado_especial,
    transacciones
  } = data

  return (
    <Layout>
      <DetailHeader
        portfolioId={portfolio_id}
        nombre={datos_descriptivos?.nombre}
        onBack={() => navigate(-1)}
      />

      <div className="container mx-auto py-6">
        {/* Always expanded sections */}
        <SectionAccordion title="Datos Descriptivos" defaultOpen>
          <DatosDescriptivosSection data={datos_descriptivos} />
        </SectionAccordion>

        <SectionAccordion title="Hechos" count={hechos?.length} defaultOpen>
          <HechosSection data={hechos} />
        </SectionAccordion>

        <SectionAccordion title="Informacion Economica" defaultOpen>
          <InformacionEconomicaSection data={informacion_economica} />
        </SectionAccordion>

        <SectionAccordion title="Importes" defaultOpen>
          <ImportesSection data={datos_relevantes} />
        </SectionAccordion>

        {/* Collapsible sections */}
        <SectionAccordion title="Acciones" count={acciones?.length}>
          <AccionesSection data={acciones} />
        </SectionAccordion>

        <SectionAccordion title="Notas" count={notas?.length}>
          <NotasSection data={notas} />
        </SectionAccordion>

        {/* ... remaining sections */}

        <SectionAccordion title="Transacciones" count={transacciones?.length}>
          <TransaccionesSection data={transacciones} />
        </SectionAccordion>
      </div>
    </Layout>
  )
}
```

---

## Phase 7: Routing and Navigation

### Step 7.1: Update App.jsx Routes

**File:** `src/App.jsx`

**Changes:**
```jsx
import SearchPage from '@/features/search/SearchPage'
import DetailPage from '@/features/detail/DetailPage'

// Inside Routes
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/search" element={<SearchPage />} />
  <Route path="/detail/:portfolio_id" element={<DetailPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/jobs" element={<JobsPage />} />
</Route>
```

### Step 7.2: Update Navbar (if needed)

Verify the "Search" link in Navbar points to `/search` (should already be correct).

---

## Phase 8: Testing and Refinement

### Step 8.1: Test Search Functionality

1. Test all filter combinations
2. Verify filter persistence in localStorage
3. Test sorting on all sortable columns
4. Verify pagination behavior
5. Test empty state (no results)
6. Test error handling (API failure)

### Step 8.2: Test Export Functionality

1. Test TSV export
2. Test CSV export
3. Test JSON export
4. Test Excel export
5. Verify all columns included
6. Verify formatting (dates, currency)
7. Test large export (500+ rows)

### Step 8.3: Test Detail Page

1. Test navigation from search results
2. Verify all sections load correctly
3. Test empty sections handling
4. Test accordion expand/collapse
5. Test back button navigation
6. Test direct URL access
7. Test non-existent portfolio_id (404)

### Step 8.4: Test Responsive Design

1. Desktop (1920px, 1440px, 1024px)
2. Tablet (768px)
3. Mobile (375px, 320px)
4. Test filter panel collapse on mobile
5. Test table horizontal scroll on mobile

---

## Phase 9: Documentation

### Step 9.1: Update README.md

Add section for Search and Detail pages:
- Available routes
- Features
- Usage instructions

### Step 9.2: Update architecture_frontend.md

Add:
- Search feature components
- Detail feature components
- New hooks
- localStorage keys

### Step 9.3: Update Navbar if needed

Verify "Search" menu item works correctly.

---

## Implementation Order Summary

| Phase | Steps | Estimated Files |
|-------|-------|-----------------|
| 1. Dependencies & UI | 1.1 - 1.9 | 9 |
| 2. Search Infrastructure | 2.1 - 2.6 | 6 |
| 3. Search Components | 3.1 - 3.7 | 7 |
| 4. Detail Infrastructure | 4.1 - 4.3 | 3 |
| 5. Detail Sections | 5.1 - 5.15 | 15 |
| 6. Detail Assembly | 6.1 - 6.2 | 2 |
| 7. Routing | 7.1 - 7.2 | 1 (update) |
| 8. Testing | 8.1 - 8.4 | 0 |
| 9. Documentation | 9.1 - 9.3 | 2 (updates) |

**Total new files:** ~43 files

---

## Dependencies Between Phases

```
Phase 1 (UI Components)
    │
    ├──► Phase 2 (Search Infrastructure)
    │        │
    │        └──► Phase 3 (Search Components)
    │                 │
    │                 └──► Phase 7 (Routing)
    │
    └──► Phase 4 (Detail Infrastructure)
             │
             └──► Phase 5 (Detail Sections)
                      │
                      └──► Phase 6 (Detail Assembly)
                               │
                               └──► Phase 7 (Routing)
                                        │
                                        └──► Phase 8 (Testing)
                                                 │
                                                 └──► Phase 9 (Documentation)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TanStack Table complexity | Start with basic table, add features incrementally |
| Large data export performance | Show progress indicator, consider chunking |
| Portfolio endpoint returning too much data | Lazy load sections, paginate large lists |
| localStorage quota exceeded | Limit stored column preferences size |
| Mobile responsiveness | Test early, use responsive utilities |

---

## Definition of Done

- [ ] All 9 phases completed
- [ ] Search filters working (all 7 filter types)
- [ ] Column selection/ordering persisted
- [ ] Pagination with configurable page size
- [ ] Sorting on all columns
- [ ] Export to all 4 formats (TSV, CSV, JSON, Excel)
- [ ] Detail page shows all 15 sections
- [ ] Accordion expand/collapse working
- [ ] Empty sections handled gracefully
- [ ] Future action buttons visible but disabled
- [ ] Back navigation working
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] README.md updated
- [ ] architecture_frontend.md updated
