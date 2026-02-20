import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, LayoutList, FilterX } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { createLogger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { useSearchInitiatives, useExportInitiatives, buildSearchRequest } from './hooks/useSearchInitiatives'
import { useFilterOptions } from './hooks/useFilterOptions'
import { useSearchPreferences } from './hooks/useSearchPreferences'
import { exportData } from './utils/exportHelpers'
import { FilterPanel } from './components/FilterPanel'
import { ColumnConfigurator } from '@/components/shared/ColumnConfigurator'
import { ExportDropdown } from './components/ExportDropdown'
import { ALL_COLUMNS } from './utils/columnDefinitions'
import { DEFAULT_COLUMNS } from './utils/searchStorage'
import { DataGrid } from './components/DataGrid'
import { CardGrid } from './components/CardGrid'
import { GroupBySelector } from './components/GroupBySelector'
import { CopySelectedButton } from './components/CopySelectedButton'
import { FavoritesToolbar } from './components/FavoritesToolbar'
import { InitiativeDrawer } from '@/components/shared/InitiativeDrawer'
import { LtpModal } from './components/LtpModal'
import { Pagination } from './components/Pagination'
import { FilterChips } from './components/FilterChips'
import { useFavorites } from './hooks/useFavorites'
import { createStorage } from '@/lib/storage'

const viewModeStorage = createStorage('portfolio-search')

const logger = createLogger('SearchPage')

export default function SearchPage() {
  usePageTitle('Búsqueda')
  const location = useLocation()
  const navigate = useNavigate()

  // Preferences hook (localStorage persistence)
  const {
    columns,
    setColumns,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    clearFilters,
    resetColumns,
    hasActiveFilters,
    activeFilterCount,
  } = useSearchPreferences()

  // Favorites hook
  const {
    favorites,
    count: favoritesCount,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAll: clearFavorites,
    copyToClipboard: copyFavoritesToClipboard,
  } = useFavorites()

  // API hooks
  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions()
  const searchMutation = useSearchInitiatives()
  const exportMutation = useExportInitiatives()

  // View mode: table or cards
  const [viewMode, setViewMode] = useState(() => {
    const saved = viewModeStorage.loadString('view-mode', null)
    if (saved === 'cards' || saved === 'table') return saved
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  })

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode)
    viewModeStorage.saveString('view-mode', mode)
  }, [])

  // Local state
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ field: null, direction: null })
  const [results, setResults] = useState({ data: [], total: 0 })
  const [hasSearched, setHasSearched] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState({})

  const handleColumnFilterChange = useCallback((columnId, value) => {
    setColumnFilters((prev) => ({ ...prev, [columnId]: value }))
  }, [])

  const hasActiveColumnFilters = useMemo(() => {
    return Object.values(columnFilters).some((v) =>
      v != null && v !== '' &&
      !(Array.isArray(v) && v.length === 0) &&
      !(typeof v === 'object' && !Array.isArray(v) && v.min === '' && v.max === '')
    )
  }, [columnFilters])

  const [groupByField, setGroupByField] = useState(null)

  // Drawer state
  const [drawerData, setDrawerData] = useState({ isOpen: false, rowData: null })

  const handleOpenDrawer = useCallback((portfolioId) => {
    const row = (results.data || []).find((r) => r.portfolio_id === portfolioId)
    if (row) setDrawerData({ isOpen: true, rowData: row })
  }, [results.data])

  const handleCloseDrawer = useCallback(() => {
    setDrawerData({ isOpen: false, rowData: null })
  }, [])

  // LTP modal state
  const [ltpModalData, setLtpModalData] = useState({ isOpen: false, portfolioId: null, nombre: null })

  const handleOpenLtpModal = useCallback((portfolioId, nombre) => {
    setLtpModalData({ isOpen: true, portfolioId, nombre })
  }, [])

  const handleCloseLtpModal = useCallback(() => {
    setLtpModalData({ isOpen: false, portfolioId: null, nombre: null })
  }, [])

  // Selected portfolio IDs (keys of rowSelection are portfolio_ids via getRowId)
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  )

  // Ref to FilterPanel for focus
  const filterPanelRef = useRef(null)

  // Check for filters passed via location state (e.g., from Dashboard chart double-click)
  const locationFiltersRef = useRef(location.state?.filters || null)
  const pendingLocationSearchRef = useRef(false)

  // Execute search (does NOT clear row selection — callers decide)
  const executeSearch = useCallback(async (resetPage = false) => {
    const page = resetPage ? 1 : currentPage
    if (resetPage) {
      setCurrentPage(1)
    }

    const searchRequest = buildSearchRequest(filters, sortConfig, pageSize, page)
    logger.info('Executing search', { filters: searchRequest.filters?.length || 0, page, pageSize })

    try {
      const response = await searchMutation.mutateAsync(searchRequest)
      setResults(response)
      setHasSearched(true)
    } catch (error) {
      logger.error('Search failed', error)
    }
  }, [filters, sortConfig, pageSize, currentPage, searchMutation])

  // Initial search on mount — apply location state filters if present
  useEffect(() => {
    if (locationFiltersRef.current) {
      const stateFilters = locationFiltersRef.current
      locationFiltersRef.current = null
      logger.info('Applying filters from navigation state', stateFilters)
      setFilters(stateFilters)
      // Clear location state to prevent stale re-use on back/forward
      navigate('/search', { replace: true })
      // Flag: execute search after filters state settles (see effect below)
      pendingLocationSearchRef.current = true
    } else {
      setRowSelection({})
      executeSearch(true)
      setTimeout(() => {
        filterPanelRef.current?.focusPortfolioId()
      }, 100)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Execute pending search after navigation filters are applied to state.
  // This runs on the re-render after setFilters(), so executeSearch has the correct filters.
  useEffect(() => {
    if (pendingLocationSearchRef.current) {
      pendingLocationSearchRef.current = false
      setRowSelection({})
      executeSearch(true)
    }
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when page changes
  useEffect(() => {
    if (hasSearched) {
      executeSearch(false)
    }
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when sort changes (clears selection — result order changes)
  useEffect(() => {
    if (hasSearched) {
      setRowSelection({})
      executeSearch(true)
    }
  }, [sortConfig]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when page size changes (clears selection — page boundaries change)
  useEffect(() => {
    if (hasSearched) {
      setRowSelection({})
      executeSearch(true)
    }
  }, [pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter apply (clears selection — result set changes)
  const handleApplyFilters = () => {
    setRowSelection({})
    executeSearch(true)
  }

  // Handle filter clear (clears selection — result set changes)
  const handleClearFilters = () => {
    setRowSelection({})
    clearFilters()
    // Execute search with empty filters
    setTimeout(() => executeSearch(true), 0)
  }

  // Handle loading a saved search
  const handleLoadSearch = useCallback((savedFilters) => {
    setRowSelection({})
    setFilters(savedFilters)
    setTimeout(() => executeSearch(true), 0)
  }, [setFilters, executeSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
    // Search is triggered by useEffect when pageSize changes
  }

  // Handle export
  const handleExport = async (format) => {
    logger.info('Starting export', { format })
    console.log('[Export] Starting export with format:', format)

    try {
      // Build filters from current search (pagination is handled by the mutation)
      const searchRequest = buildSearchRequest(filters, sortConfig, 1000, 1)
      console.log('[Export] Fetching data with filters:', searchRequest.filters)

      const response = await exportMutation.mutateAsync({
        filters: searchRequest.filters,
        order_by: searchRequest.order_by,
        order_dir: searchRequest.order_dir,
      })
      console.log('[Export] Data fetched, rows:', response.data?.length)

      if (!response.data || response.data.length === 0) {
        console.warn('[Export] No data to export')
        return
      }

      // Export the data
      console.log('[Export] Exporting data with columns:', columns)
      exportData(format, response.data, columns)
      logger.info('Export completed', { format, rows: response.data.length })
      console.log('[Export] Export completed successfully')
    } catch (error) {
      logger.error('Export failed', error)
      console.error('[Export] Export failed:', error)
    }
  }

  // Handle removing a single filter chip
  const handleRemoveFilter = useCallback((filterKey) => {
    let newValue
    if (filterKey === 'includeCancelled') {
      // Removing "Excl. Canceladas" chip means include cancelled (set to true)
      newValue = true
    } else if (Array.isArray(filters[filterKey])) {
      newValue = []
    } else {
      newValue = ''
    }
    setFilters({ ...filters, [filterKey]: newValue })
    setRowSelection({})
    setTimeout(() => executeSearch(true), 0)
  }, [filters, setFilters, executeSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(results.total / pageSize)

  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-6 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6" />
            Búsqueda de Iniciativas
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Busque y explore las iniciativas del portfolio con criterios flexibles
          </p>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          ref={filterPanelRef}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onLoadSearch={handleLoadSearch}
          filterOptions={filterOptions}
          isLoading={searchMutation.isPending}
        />

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-md border border-input">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8 rounded-r-none', viewMode === 'table' && 'bg-accent text-accent-foreground')}
                onClick={() => handleViewModeChange('table')}
                aria-label="Vista tabla"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8 rounded-l-none border-l', viewMode === 'cards' && 'bg-accent text-accent-foreground')}
                onClick={() => handleViewModeChange('cards')}
                aria-label="Vista tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {viewMode === 'table' && (
              <GroupBySelector
                value={groupByField}
                onChange={setGroupByField}
                disabled={viewMode !== 'table'}
              />
            )}
            {viewMode === 'table' && (
              <ColumnConfigurator
                selectedColumns={columns}
                onColumnsChange={setColumns}
                onReset={resetColumns}
                allColumns={ALL_COLUMNS}
                defaultColumns={DEFAULT_COLUMNS}
              />
            )}
            <ExportDropdown
              onExport={handleExport}
              isExporting={exportMutation.isPending}
              disabled={results.total === 0}
            />
            <CopySelectedButton selectedIds={selectedIds} />
            <FavoritesToolbar
              favorites={favorites}
              count={favoritesCount}
              onCopyToClipboard={copyFavoritesToClipboard}
              onRemove={removeFavorite}
              onClearAll={clearFavorites}
            />
            {hasActiveColumnFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => setColumnFilters({})}
              >
                <FilterX className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros columna
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {selectedIds.length > 0 && (
              <span className="text-primary font-medium">
                {selectedIds.length} seleccionados
              </span>
            )}
            <span>{results.total.toLocaleString('es-ES')} iniciativas encontradas</span>
          </div>
        </div>

        {/* Data Grid or Card Grid */}
        {viewMode === 'table' ? (
          <DataGrid
            data={results.data}
            columns={columns}
            isLoading={searchMutation.isPending}
            sortConfig={sortConfig}
            onSort={setSortConfig}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onOpenDrawer={handleOpenDrawer}
            onOpenLtpModal={handleOpenLtpModal}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            groupByField={groupByField}
          />
        ) : (
          <CardGrid
            data={results.data}
            isLoading={searchMutation.isPending}
            onQuickView={handleOpenDrawer}
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={results.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
        <InitiativeDrawer
          isOpen={drawerData.isOpen}
          onClose={handleCloseDrawer}
          rowData={drawerData.rowData}
        />
        <LtpModal
          isOpen={ltpModalData.isOpen}
          onClose={handleCloseLtpModal}
          portfolioId={ltpModalData.portfolioId}
          nombre={ltpModalData.nombre}
        />
      </div>
    </Layout>
  )
}
