import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronRight, PanelRightOpen, SearchX, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { TransactionBadge } from '@/lib/badgeColors'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { InitiativeDrawer } from '@/components/shared/InitiativeDrawer'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logger'
import { Pagination } from '@/features/search/components/Pagination'
import { formatCellValue } from '@/features/search/utils/columnDefinitions'
import { useReportSearch } from '../hooks/useReportSearch'
import { useReportFilterOptions } from '../hooks/useReportFilterOptions'
import { useReportPreferences } from '../hooks/useReportPreferences'
import { ReportFilterPanel } from './ReportFilterPanel'
import { ColumnConfigurator } from '@/components/shared/ColumnConfigurator'

const logger = createLogger('GenericReportPage')

/**
 * Generic report page component that can be configured for any report type.
 *
 * @param {object} config
 * @param {string} config.title - Page title
 * @param {string} config.subtitle - Page subtitle
 * @param {React.Component} config.icon - Lucide icon component
 * @param {string} config.searchEndpoint - POST search endpoint
 * @param {string} config.filterOptionsEndpoint - GET filter options endpoint
 * @param {string} config.filterOptionsQueryKey - React Query cache key
 * @param {string} config.storagePrefix - localStorage key prefix
 * @param {string[]} config.defaultColumnIds - Default column IDs
 * @param {Array} config.reportColumns - Primary columns [{id, label, type, category}]
 * @param {Array} config.additionalColumns - Additional columns [{id, label, type, category}]
 * @param {Array} config.filterDefs - Filter definitions for the filter panel
 * @param {object} config.defaultFilters - Initial filter state
 * @param {function} config.buildRequestBody - (filters, sortConfig, pageSize, page) => requestBody
 * @param {object} config.defaultSort - { field, direction }
 * @param {string} config.emptyMessage - Message when no results found
 * @param {string} config.linkField - Field to render as link (default: 'portfolio_id')
 * @param {string} config.linkPrefix - Link URL prefix (default: '/detail/')
 * @param {string[]} config.dateFilterKeys - Keys to exclude from active filter count
 */
export function GenericReportPage({ config }) {
  const {
    title,
    subtitle,
    icon: Icon,
    searchEndpoint,
    filterOptionsEndpoint,
    filterOptionsQueryKey,
    storagePrefix,
    defaultColumnIds,
    reportColumns,
    additionalColumns = [],
    filterDefs,
    defaultFilters,
    buildRequestBody: buildRequestBodyFn,
    defaultSort = { field: null, direction: 'asc' },
    emptyMessage = 'No se encontraron resultados. Intente ajustar los filtros.',
    linkField = 'portfolio_id',
    linkPrefix = '/detail/',
    dateFilterKeys,
    collapsibleConfig,
    showDrawer = false,
    aggregations,
    crossReportLinks,
  } = config

  usePageTitle(`Informe ${title}`)
  const navigate = useNavigate()
  const location = useLocation()

  // Apply incoming portfolio_id filter from cross-report navigation
  const incomingStateRef = useRef(location.state)
  const [expandedRowId, setExpandedRowId] = useState(null)

  // Build a column map for quick lookup
  const allColumns = useMemo(() => [...reportColumns, ...additionalColumns], [reportColumns, additionalColumns])
  const columnMap = useMemo(() => {
    const map = {}
    allColumns.forEach((col) => { map[col.id] = col })
    return map
  }, [allColumns])

  const getColDef = (id) => columnMap[id] || { id, label: id, type: 'text' }

  const {
    columns,
    setColumns,
    pageSize,
    setPageSize,
    resetColumns,
    templates,
    saveTemplate,
    deleteTemplate,
  } = useReportPreferences(storagePrefix, defaultColumnIds)

  const { data: filterOptions } = useReportFilterOptions(
    filterOptionsEndpoint,
    filterOptionsQueryKey
  )
  const searchMutation = useReportSearch(searchEndpoint)

  // Check for incoming cross-report portfolio_id filter
  const initialFilters = useMemo(() => {
    const state = incomingStateRef.current
    if (state?.crossReportPortfolioId) {
      // Find the portfolio_id filter key in filterDefs
      const pidFilterDef = filterDefs.find((def) => def.key === 'portfolioId' || def.key === 'portfolio_id')
      if (pidFilterDef) {
        return { ...defaultFilters, [pidFilterDef.key]: state.crossReportPortfolioId }
      }
    }
    return defaultFilters
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState(initialFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState(defaultSort)
  const [results, setResults] = useState({ data: [], total: 0 })
  const [hasSearched, setHasSearched] = useState(false)

  // Side drawer state
  const [drawerData, setDrawerData] = useState({ isOpen: false, rowData: null })

  const handleOpenDrawer = useCallback((portfolioId) => {
    const row = (results.data || []).find((r) => r.portfolio_id === portfolioId)
    if (row) setDrawerData({ isOpen: true, rowData: row })
  }, [results.data])

  const handleCloseDrawer = useCallback(() => {
    setDrawerData({ isOpen: false, rowData: null })
  }, [])

  const buildRequestBody = useCallback((page) => {
    return buildRequestBodyFn(filters, sortConfig, pageSize, page)
  }, [filters, sortConfig, pageSize, buildRequestBodyFn])

  const executeSearch = useCallback(async (resetPage = false) => {
    const page = resetPage ? 1 : currentPage
    if (resetPage) setCurrentPage(1)

    const requestBody = buildRequestBody(page)
    logger.info(`Executing ${storagePrefix} report search`, { page, pageSize })

    try {
      const response = await searchMutation.mutateAsync(requestBody)
      setResults(response)
      setHasSearched(true)
    } catch (error) {
      logger.error('Report search failed', error)
    }
  }, [filters, sortConfig, pageSize, currentPage, searchMutation, buildRequestBody, storagePrefix])

  // Clear incoming cross-report state on mount to prevent re-applying on refresh
  useEffect(() => {
    if (incomingStateRef.current?.crossReportPortfolioId) {
      navigate(location.pathname, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { executeSearch(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(false) }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(true) }, [sortConfig]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasSearched) executeSearch(true) }, [pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => executeSearch(true)

  const handleClearFilters = () => {
    setFilters(defaultFilters)
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

  const tableColumns = useMemo(() => {
    const prefix = []

    // Drawer column (optional)
    if (showDrawer) {
      prefix.push({
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
      })
    }

    const dataCols = columns.map((columnId) => {
      const colDef = getColDef(columnId)
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
        cell: (info) => {
          const value = info.getValue()
          // Custom cell renderer (if provided in column definition)
          if (colDef.renderCell) {
            return colDef.renderCell(value, info.row.original)
          }
          // Render link field
          if (columnId === linkField && value) {
            return (
              <Link
                to={`${linkPrefix}${value}`}
                state={linkPrefix === '/detail/' ? { from: { route: window.location.pathname, label: `Informe ${title}` } } : undefined}
                className="text-primary hover:underline font-medium"
              >
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
          if (colDef.type === 'currency') {
            return (
              <CurrencyCell
                value={value}
                formattedValue={formatCellValue(value, colDef.type)}
                className="truncate block max-w-[300px]"
              />
            )
          }
          return (
            <span className="truncate block max-w-[300px]" title={String(value || '')}>
              {formatCellValue(value, colDef.type)}
            </span>
          )
        },
      }
    })

    // Cross-report navigation column
    const suffix = []
    if (crossReportLinks && crossReportLinks.length > 0) {
      suffix.push({
        id: '__cross_report',
        header: () => <span className="sr-only">Ver en...</span>,
        cell: ({ row }) => {
          const portfolioId = row.original.portfolio_id
          if (!portfolioId) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ver en otro informe">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {crossReportLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.route}
                    onSelect={() => {
                      navigate(link.route, { state: { crossReportPortfolioId: portfolioId } })
                    }}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        size: 40,
      })
    }

    return [...prefix, ...dataCols, ...suffix]
  }, [columns, sortConfig, linkField, linkPrefix, columnMap, showDrawer, handleOpenDrawer, title, crossReportLinks, navigate])

  const table = useReactTable({
    data: results.data || [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const totalPages = Math.ceil(results.total / pageSize)
  const isLoading = searchMutation.isPending

  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        <div className="mb-6 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6" />}
            {title}
          </h1>
          {subtitle && <p className="text-muted-foreground font-body mt-1">{subtitle}</p>}
        </div>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          filterOptions={filterOptions}
          isLoading={isLoading}
          filterDefs={filterDefs}
          dateFilterKeys={dateFilterKeys}
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
              allColumns={allColumns}
              defaultColumns={defaultColumnIds}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {results.total.toLocaleString('es-ES')} resultados encontrados
          </div>
        </div>

        {/* Data Grid */}
        {isLoading ? (
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {showDrawer && <th className="p-3 w-10"></th>}
                  {columns.map((col) => (
                    <th key={col} className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">{getColDef(col).label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={columns.length + (showDrawer ? 1 : 0)} />
                ))}
              </tbody>
            </table>
          </div>
        ) : !results.data || results.data.length === 0 ? (
          <div className="rounded-lg border">
            <ReportEmptyState
              emptyMessage={emptyMessage}
              filters={filters}
              filterDefs={filterDefs}
              dateFilterKeys={dateFilterKeys}
            />
          </div>
        ) : collapsibleConfig ? (
          /* Collapsible table mode for Transacciones-style reports */
          <CollapsibleReportTable
            data={results.data}
            collapsibleConfig={collapsibleConfig}
            columnMap={columnMap}
            linkField={linkField}
            linkPrefix={linkPrefix}
            expandedRowId={expandedRowId}
            onToggleRow={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
            showDrawer={showDrawer}
            onOpenDrawer={handleOpenDrawer}
          />
        ) : (
          <TooltipProvider delayDuration={200}>
          <div className="rounded-lg border overflow-auto max-h-[calc(100vh-20rem)]">
            <table className="w-full min-w-[640px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className={cn(
                        'p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 bg-muted',
                        header.id === '__drawer' && 'w-10'
                      )}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-accent/50',
                      'bg-background'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {aggregations && Object.keys(aggregations).length > 0 && (
                <AggregationFooter
                  data={results.data}
                  columns={columns}
                  aggregations={aggregations}
                  getColDef={getColDef}
                  showDrawer={showDrawer}
                />
              )}
            </table>
          </div>
          </TooltipProvider>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={results.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {showDrawer && (
        <InitiativeDrawer
          isOpen={drawerData.isOpen}
          onClose={handleCloseDrawer}
          rowData={drawerData.rowData}
        />
      )}
    </Layout>
  )
}

/**
 * Context-aware empty state for reports showing active filter details
 */
function ReportEmptyState({ emptyMessage, filters, filterDefs = [], dateFilterKeys }) {
  // Build list of active filters with labels
  const excludeKeys = dateFilterKeys || filterDefs
    .filter((d) => d.type === 'date')
    .map((d) => d.key)

  const activeFilters = []
  if (filterDefs && filters) {
    filterDefs.forEach((def) => {
      const value = filters[def.key]
      if (!value) return
      if (Array.isArray(value) && value.length === 0) return
      if (Array.isArray(value) && value.includes('ALL')) return

      let display
      if (Array.isArray(value)) {
        display = value.length > 3 ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3})` : value.join(', ')
      } else if (def.type === 'date' && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = value.split('-')
        display = `${d}/${m}/${y}`
      } else {
        display = String(value)
      }

      activeFilters.push({ label: def.label, value: display })
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Sin resultados</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{emptyMessage}</p>
      {activeFilters.length > 0 && (
        <div className="space-y-3 max-w-lg">
          <p className="text-sm text-muted-foreground font-medium">Filtros activos:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {activeFilters.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                <span className="font-medium">{f.label}:</span>
                <span className="text-muted-foreground">{f.value}</span>
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Intente eliminar o modificar alguno de los filtros activos.
          </p>
        </div>
      )}
      {activeFilters.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay datos disponibles para este informe.
        </p>
      )}
    </div>
  )
}

/**
 * Compute aggregation value for a column
 */
function computeAgg(data, columnId, aggType) {
  const values = data.map((row) => row[columnId]).filter((v) => v !== null && v !== undefined && v !== '')
  if (values.length === 0) return null
  const nums = values.map(Number).filter((n) => !isNaN(n))
  if (aggType === 'count') return values.length
  if (aggType === 'sum') return nums.reduce((s, v) => s + v, 0)
  if (aggType === 'avg') return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null
  return null
}

/**
 * Sticky aggregation footer row for report tables
 */
function AggregationFooter({ data, columns, aggregations, getColDef, showDrawer }) {
  if (!data || data.length === 0) return null

  return (
    <tfoot>
      <tr className="sticky bottom-0 z-10 bg-muted border-t border-border text-xs">
        {showDrawer && <td className="px-3 py-1"></td>}
        {columns.map((colId) => {
          const aggType = aggregations[colId]
          if (aggType) {
            const colDef = getColDef(colId)
            const rawValue = computeAgg(data, colId, aggType)
            if (rawValue === null) return <td key={colId} className="px-3 py-1"></td>
            const formatted = formatCellValue(
              aggType === 'avg' ? Math.round(rawValue * 10) / 10 : rawValue,
              colDef.type
            )
            return (
              <td key={colId} className="px-3 py-1 font-medium">
                {formatted}
              </td>
            )
          }
          return <td key={colId} className="px-3 py-1"></td>
        })}
      </tr>
    </tfoot>
  )
}

/**
 * Collapsible table for transacciones-style reports.
 * Shows main columns in collapsed rows with badges, and detail columns in expanded rows.
 */
function CollapsibleReportTable({ data, collapsibleConfig, columnMap, linkField, linkPrefix, expandedRowId, onToggleRow, showDrawer, onOpenDrawer }) {
  const { mainColumnIds, badgeColumns = {}, detailColumnIds = [] } = collapsibleConfig

  function formatValue(value, type) {
    if (value === null || value === undefined || value === '') return '—'
    if (type === 'date') {
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const datePart = value.slice(0, 10)
        const [year, month, day] = datePart.split('-')
        const timePart = value.length > 10 ? value.slice(11, 16) : null
        return timePart ? `${day}/${month}/${year} ${timePart}` : `${day}/${month}/${year}`
      }
      return value
    }
    if (type === 'longtext') return value
    return String(value)
  }

  function formatJsonValue(val) {
    if (!val) return null
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(parsed, null, 2)
    } catch { return String(val) }
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="rounded-lg border overflow-auto max-h-[calc(100vh-20rem)]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-3 w-8 sticky top-0 z-10 bg-muted"></th>
            {showDrawer && <th className="p-3 w-10 sticky top-0 z-10 bg-muted"><PanelRightOpen className="h-4 w-4 text-muted-foreground" /></th>}
            {mainColumnIds.map((colId) => {
              const col = columnMap[colId] || { label: colId }
              return (
                <th key={colId} className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 bg-muted">
                  {col.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowId = row.id || row.clave1 || JSON.stringify(row)
            const isExpanded = expandedRowId === rowId
            const hasDetails = detailColumnIds.some((colId) => row[colId])

            return (
              <CollapsibleRow
                key={rowId}
                row={row}
                rowId={rowId}
                isExpanded={isExpanded}
                hasDetails={hasDetails}
                onToggle={() => onToggleRow(rowId)}
                mainColumnIds={mainColumnIds}
                badgeColumns={badgeColumns}
                detailColumnIds={detailColumnIds}
                columnMap={columnMap}
                linkField={linkField}
                linkPrefix={linkPrefix}
                showDrawer={showDrawer}
                onOpenDrawer={onOpenDrawer}
                formatValue={formatValue}
                formatJsonValue={formatJsonValue}
              />
            )
          })}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}

function CollapsibleRow({ row, rowId, isExpanded, hasDetails, onToggle, mainColumnIds, badgeColumns, detailColumnIds, columnMap, linkField, linkPrefix, formatValue, formatJsonValue, showDrawer, onOpenDrawer }) {
  return (
    <>
      <tr
        className={`border-b border-border/50 hover:bg-accent/50 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="p-3 w-8">
          {hasDetails && (
            isExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </td>
        {showDrawer && (
          <td className="p-3 w-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDrawer?.(row.portfolio_id)
                  }}
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista rapida</TooltipContent>
            </Tooltip>
          </td>
        )}
        {mainColumnIds.map((colId) => {
          const col = columnMap[colId] || { type: 'text' }
          const value = row[colId]

          // Custom cell renderer (if provided in column definition)
          if (col.renderCell) {
            return (
              <td key={colId} className="p-3" onClick={(e) => e.stopPropagation()}>
                {col.renderCell(value, row)}
              </td>
            )
          }

          // Estado tag column
          if (col.type === 'estado') {
            return (
              <td key={colId} className="p-3">
                <EstadoTag value={value} />
              </td>
            )
          }

          // Badge column
          if (badgeColumns[colId]) {
            return (
              <td key={colId} className="p-3">
                <TransactionBadge className={badgeColumns[colId][value] || 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'}>
                  {value || '—'}
                </TransactionBadge>
              </td>
            )
          }

          // Link field
          if (colId === linkField && value) {
            return (
              <td key={colId} className="p-3">
                <Link to={`${linkPrefix}${value}`} className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                  {value}
                </Link>
              </td>
            )
          }

          // Longtext field — show full content with word wrap
          if (col.type === 'longtext') {
            return (
              <td key={colId} className="p-3 text-sm">
                <span className="block whitespace-pre-wrap min-w-[150px] max-w-[400px]">
                  {value || '—'}
                </span>
              </td>
            )
          }

          return (
            <td key={colId} className="p-3 text-sm">
              <span className="truncate block max-w-[300px]">
                {formatValue(value, col.type)}
              </span>
            </td>
          )
        })}
      </tr>
      {isExpanded && hasDetails && (
        <tr>
          <td colSpan={mainColumnIds.length + 1 + (showDrawer ? 1 : 0)}>
            <div className="grid gap-3 p-4 text-sm bg-muted/30">
              {detailColumnIds.map((colId) => {
                const value = row[colId]
                if (!value) return null
                const col = columnMap[colId] || { label: colId }

                if (col.type === 'estado') {
                  return (
                    <div key={colId} className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">{col.label}:</span>
                      <EstadoTag value={value} />
                    </div>
                  )
                }

                if (col.type === 'date') {
                  return (
                    <div key={colId} className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">{col.label}:</span>
                      <span className="text-sm">{formatValue(value, 'date')}</span>
                    </div>
                  )
                }

                const isJson = col.type === 'longtext' && (typeof value === 'object' || (typeof value === 'string' && value.startsWith('{')))
                return (
                  <div key={colId}>
                    <span className="font-medium text-muted-foreground">{col.label}:</span>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {isJson ? formatJsonValue(value) : String(value)}
                    </pre>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
