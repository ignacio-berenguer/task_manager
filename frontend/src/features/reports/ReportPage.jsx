import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FileBarChart, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, ChevronDown, PanelRightOpen } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logger'
import { Pagination } from '@/features/search/components/Pagination'
import { Button } from '@/components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { InitiativeDrawer } from '@/components/shared/InitiativeDrawer'
import { useReportSearch } from './hooks/useReportSearch'
import { useReportFilterOptions } from './hooks/useReportFilterOptions'
import { useReportPreferences } from './hooks/useReportPreferences'
import { ReportFilterPanel } from './components/ReportFilterPanel'
import { ColumnConfigurator } from '@/components/shared/ColumnConfigurator'
import {
  REPORT_COLUMNS,
  ADDITIONAL_COLUMNS,
  getReportColumnDef,
  formatReportCellValue,
} from './utils/reportColumnDefinitions'

const logger = createLogger('ReportPage')

const DEFAULT_COLUMNS = [
  'portfolio_id', 'fecha', 'estado', 'nombre', 'notas', 'importe',
  'id_hecho', 'referente_bi', 'digital_framework_level_1', 'unidad',
  'cluster', 'tipo',
]

/** All hecho-specific fields for the expanded detail panel. */
const HECHO_DETAIL_FIELDS = [
  { key: 'partida_presupuestaria', label: 'Partida Presupuestaria', type: 'text' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'importe_ri', label: 'Importe RI', type: 'currency' },
  { key: 'importe_re', label: 'Importe RE', type: 'currency' },
  { key: 'estado', label: 'Estado', type: 'estado' },
  { key: 'calidad_estimacion', label: 'Calidad Estimación', type: 'text' },
  { key: 'notas', label: 'Notas', type: 'longtext' },
  { key: 'racional', label: 'Racional', type: 'longtext' },
]

function formatCurrencyK(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return value
  const k = num / 1000
  return `${k.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k\u20AC`
}

function getFirstDayOfMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ReportPage() {
  usePageTitle('Informe Hechos')
  const location = useLocation()
  const navigate = useNavigate()
  const locationFiltersRef = useRef(location.state?.filters || null)

  const {
    columns,
    setColumns,
    pageSize,
    setPageSize,
    resetColumns,
    templates,
    saveTemplate,
    deleteTemplate,
  } = useReportPreferences('hechos', DEFAULT_COLUMNS)

  const { data: filterOptions, isLoading: optionsLoading } = useReportFilterOptions(
    '/hechos/report-hechos-filter-options',
    'report-hechos-filter-options'
  )
  const searchMutation = useReportSearch('/hechos/search-report-hechos')

  const [filters, setFilters] = useState(() => {
    if (locationFiltersRef.current) {
      return {
        fechaInicio: getFirstDayOfMonth(),
        fechaFin: getToday(),
        digitalFramework: [],
        unidad: [],
        cluster: [],
        tipo: [],
        estado: [],
        ...locationFiltersRef.current,
      }
    }
    return {
      fechaInicio: getFirstDayOfMonth(),
      fechaFin: getToday(),
      digitalFramework: [],
      unidad: [],
      cluster: [],
      tipo: [],
      estado: [],
    }
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ field: 'fecha', direction: 'desc' })
  const [results, setResults] = useState({ data: [], total: 0 })
  const [hasSearched, setHasSearched] = useState(false)

  // Side drawer state
  const [drawerData, setDrawerData] = useState({ isOpen: false, rowData: null })

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState(null)

  const handleOpenDrawer = useCallback((portfolioId) => {
    const row = (results.data || []).find((r) => r.portfolio_id === portfolioId)
    if (row) setDrawerData({ isOpen: true, rowData: row })
  }, [results.data])

  const handleCloseDrawer = useCallback(() => {
    setDrawerData({ isOpen: false, rowData: null })
  }, [])

  const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

  const buildRequestBody = useCallback((page) => {
    return {
      fecha_inicio: filters.fechaInicio,
      fecha_fin: filters.fechaFin,
      digital_framework_level_1: cleanFilter(filters.digitalFramework),
      unidad: cleanFilter(filters.unidad),
      cluster: cleanFilter(filters.cluster),
      tipo: cleanFilter(filters.tipo),
      estado: cleanFilter(filters.estado),
      order_by: sortConfig.field || 'fecha',
      order_dir: sortConfig.direction || 'desc',
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
  }, [filters, sortConfig, pageSize])

  const executeSearch = useCallback(async (resetPage = false) => {
    const page = resetPage ? 1 : currentPage
    if (resetPage) setCurrentPage(1)

    const requestBody = buildRequestBody(page)
    logger.info('Executing hechos report search', { page, pageSize })

    try {
      const response = await searchMutation.mutateAsync(requestBody)
      setResults(response)
      setHasSearched(true)
    } catch (error) {
      logger.error('Report search failed', error)
    }
  }, [filters, sortConfig, pageSize, currentPage, searchMutation, buildRequestBody])

  useEffect(() => {
    if (locationFiltersRef.current) {
      locationFiltersRef.current = null
      logger.info('Applying filters from navigation state')
      navigate('/informes/hechos', { replace: true })
    }
    executeSearch(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(false) }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(true) }, [sortConfig]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(true) }, [pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => executeSearch(true)

  const handleClearFilters = () => {
    setFilters({
      fechaInicio: getFirstDayOfMonth(),
      fechaFin: getToday(),
      digitalFramework: [],
      unidad: [],
      cluster: [],
      tipo: [],
      estado: [],
    })
    setTimeout(() => executeSearch(true), 0)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleSaveTemplate = (name) => {
    saveTemplate(name, filters, sortConfig)
    logger.info(`Template saved: ${name}`)
  }

  const handleLoadTemplate = (index) => {
    const tmpl = templates[index]
    if (!tmpl) return
    if (tmpl.filters) setFilters(tmpl.filters)
    if (tmpl.columns) setColumns(tmpl.columns)
    if (tmpl.sortConfig) setSortConfig(tmpl.sortConfig)
    if (tmpl.pageSize) setPageSize(tmpl.pageSize)
    logger.info(`Template loaded: ${tmpl.name}`)
    setTimeout(() => executeSearch(true), 0)
  }

  const handleDeleteTemplate = (index) => {
    deleteTemplate(index)
  }

  // Filter definitions for ReportFilterPanel
  const filterDefs = useMemo(() => [
    { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date', dateRangeGroup: 'fecha' },
    { key: 'fechaFin', label: 'Fecha Fin', type: 'date', dateRangeGroup: 'fecha' },
    { key: 'estado', label: 'Estado del Hecho', type: 'multiselect', optionsKey: 'estado', placeholder: 'Todos los estados', sortByEstado: true },
    { key: 'digitalFramework', label: 'Digital Framework', type: 'multiselect', optionsKey: 'digital_framework_level_1', placeholder: 'Todos los frameworks' },
    { key: 'unidad', label: 'Unidad', type: 'multiselect', optionsKey: 'unidad', placeholder: 'Todas las unidades' },
    { key: 'cluster', label: 'Cluster', type: 'multiselect', optionsKey: 'cluster', placeholder: 'Todos los clusters' },
    { key: 'tipo', label: 'Tipo', type: 'multiselect', optionsKey: 'tipo', placeholder: 'Todos los tipos' },
  ], [])

  // Set of currently visible column IDs (for hiding them from expanded detail)
  const visibleColumnSet = useMemo(() => new Set(columns), [columns])

  // Build table columns
  const tableColumns = useMemo(() => {
    // Chevron column for row expansion
    const chevronCol = {
      id: '__expand',
      header: () => null,
      cell: ({ row }) => {
        const rowId = row.original.id_hecho || row.index
        const isExpanded = expandedRowId === rowId
        return (
          <button
            type="button"
            className="p-0.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedRowId(isExpanded ? null : rowId)
            }}
          >
            {isExpanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )
      },
      size: 32,
    }

    // Quick-view drawer column
    const drawerCol = {
      id: '__drawer',
      header: () => <PanelRightOpen className="h-4 w-4 text-muted-foreground" />,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenDrawer(row.original.portfolio_id)
              }}
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Vista rapida</TooltipContent>
        </Tooltip>
      ),
      size: 40,
    }

    const dataCols = columns.map((columnId) => {
      const colDef = getReportColumnDef(columnId)
      return {
        accessorKey: columnId,
        header: () => {
          const isSorted = sortConfig?.field === columnId
          const direction = isSorted ? sortConfig.direction : null
          return (
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
              onClick={() => {
                if (!isSorted) setSortConfig({ field: columnId, direction: 'asc' })
                else if (direction === 'asc') setSortConfig({ field: columnId, direction: 'desc' })
                else setSortConfig({ field: null, direction: null })
              }}
            >
              <span className="truncate">{colDef.label}</span>
              {isSorted ? (
                direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-30" />
              )}
            </button>
          )
        },
        cell: ({ getValue, row }) => {
          const value = getValue()
          if (columnId === 'portfolio_id' && value) {
            return (
              <Link to={`/detail/${value}`} state={{ from: { route: '/informes/hechos', label: 'Informe Hechos' } }} className="text-primary hover:underline font-medium">
                {value}
              </Link>
            )
          }
          if (colDef.type === 'estado') {
            return <EstadoTag value={value} />
          }
          if (colDef.type === 'longtext') {
            return <span className="block whitespace-pre-wrap min-w-[150px] max-w-[400px]">{value || '-'}</span>
          }
          return (
            <span className="truncate block max-w-[300px]" title={String(value || '')}>
              {formatReportCellValue(value, colDef.type)}
            </span>
          )
        },
      }
    })

    return [chevronCol, drawerCol, ...dataCols]
  }, [columns, sortConfig, expandedRowId, handleOpenDrawer])

  const table = useReactTable({
    data: results.data || [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const totalPages = Math.ceil(results.total / pageSize)
  const isLoading = searchMutation.isPending

  const renderLoadingGrid = () => (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 w-8" />
            <th className="p-3 w-10" />
            {columns.map((col) => (
              <th key={col} className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">{getReportColumnDef(col).label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns.length + 2} />
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderEmptyGrid = () => (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 w-8" />
            <th className="p-3 w-10" />
            {columns.map((col) => (
              <th key={col} className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">{getReportColumnDef(col).label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length + 2} className="p-8 text-center text-muted-foreground">
              No se encontraron hechos en el periodo seleccionado. Intente ajustar las fechas o los filtros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  /** Render the expanded detail panel for a row */
  const renderExpandedRow = (row) => {
    const detailFields = HECHO_DETAIL_FIELDS.filter((f) => !visibleColumnSet.has(f.key))
    if (detailFields.length === 0) return null

    return (
      <tr>
        <td colSpan={columns.length + 2}>
          <div className="grid gap-3 p-4 text-sm bg-muted/30">
            {detailFields.map((field) => {
              const value = row[field.key]
              if (value === null || value === undefined || value === '') return null

              if (field.type === 'estado') {
                return (
                  <div key={field.key}>
                    <span className="font-medium text-muted-foreground">{field.label}:</span>
                    <div className="mt-1"><EstadoTag value={value} /></div>
                  </div>
                )
              }

              if (field.type === 'currency') {
                return (
                  <div key={field.key}>
                    <span className="font-medium text-muted-foreground">{field.label}:</span>
                    <span className="ml-2">{formatCurrencyK(value)}</span>
                  </div>
                )
              }

              if (field.type === 'longtext') {
                return (
                  <div key={field.key}>
                    <span className="font-medium text-muted-foreground">{field.label}:</span>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {String(value)}
                    </pre>
                  </div>
                )
              }

              return (
                <div key={field.key}>
                  <span className="font-medium text-muted-foreground">{field.label}:</span>
                  <span className="ml-2">{String(value)}</span>
                </div>
              )
            })}
          </div>
        </td>
      </tr>
    )
  }

  const renderDataGrid = () => (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border overflow-auto max-h-[calc(100vh-20rem)]">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 bg-muted',
                      header.id === '__expand' && 'w-8',
                      header.id === '__drawer' && 'w-10'
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const rowId = row.original.id_hecho || row.index
              const isExpanded = expandedRowId === rowId

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-accent/50 cursor-pointer',
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    )}
                    onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow(row.original)}
                </React.Fragment>
              )
            })}
          </tbody>
          <HechosAggregationFooter data={results.data} columns={columns} />
        </table>
      </div>
    </TooltipProvider>
  )

  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        <div className="mb-6 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            Hechos
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Consulte los hechos registrados en un rango de fechas con datos del portfolio
          </p>
        </div>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          filterOptions={filterOptions}
          isLoading={isLoading}
          filterDefs={filterDefs}
          templateProps={{
            templates,
            onSave: handleSaveTemplate,
            onLoad: handleLoadTemplate,
            onDelete: handleDeleteTemplate,
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <ColumnConfigurator
              selectedColumns={columns}
              onColumnsChange={setColumns}
              onReset={resetColumns}
              allColumns={[...REPORT_COLUMNS, ...ADDITIONAL_COLUMNS]}
              defaultColumns={DEFAULT_COLUMNS}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {results.total.toLocaleString('es-ES')} resultados encontrados
          </div>
        </div>

        {isLoading ? renderLoadingGrid()
          : !results.data || results.data.length === 0 ? renderEmptyGrid()
          : renderDataGrid()}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={results.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <InitiativeDrawer
        isOpen={drawerData.isOpen}
        onClose={handleCloseDrawer}
        rowData={drawerData.rowData}
      />
    </Layout>
  )
}

/** Set of column IDs that support sum aggregation in the footer */
const CURRENCY_COLUMN_IDS = new Set(
  [...REPORT_COLUMNS, ...ADDITIONAL_COLUMNS]
    .filter((c) => c.type === 'currency')
    .map((c) => c.id)
)

function HechosAggregationFooter({ data, columns }) {
  if (!data || data.length === 0) return null

  // Only render if at least one visible column is a currency column
  const hasCurrencyCol = columns.some((c) => CURRENCY_COLUMN_IDS.has(c))
  if (!hasCurrencyCol) return null

  return (
    <tfoot>
      <tr className="sticky bottom-0 z-10 bg-muted border-t border-border text-xs">
        <td className="px-3 py-1"></td>
        <td className="px-3 py-1"></td>
        {columns.map((colId) => {
          if (CURRENCY_COLUMN_IDS.has(colId)) {
            const nums = data
              .map((row) => row[colId])
              .filter((v) => v !== null && v !== undefined && v !== '')
              .map(Number)
              .filter((n) => !isNaN(n))
            if (nums.length === 0) return <td key={colId} className="px-3 py-1"></td>
            const sum = nums.reduce((s, v) => s + v, 0)
            return (
              <td key={colId} className="px-3 py-1 font-medium">
                {formatCurrencyK(sum)}
              </td>
            )
          }
          return <td key={colId} className="px-3 py-1"></td>
        })}
      </tr>
    </tfoot>
  )
}
