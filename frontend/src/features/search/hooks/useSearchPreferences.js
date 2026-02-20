import { useState, useEffect, useCallback } from 'react'
import {
  loadColumns,
  saveColumns,
  loadPageSize,
  savePageSize,
  loadFilters,
  saveFilters,
  clearFilters as clearStoredFilters,
  DEFAULT_COLUMNS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_FILTERS,
} from '../utils/searchStorage'

/**
 * Hook to manage search preferences with localStorage persistence
 */
export function useSearchPreferences() {
  // Initialize state from localStorage
  const [columns, setColumnsState] = useState(() => loadColumns())
  const [pageSize, setPageSizeState] = useState(() => loadPageSize())
  const [filters, setFiltersState] = useState(() => loadFilters())

  // Persist columns to localStorage
  const setColumns = useCallback((newColumns) => {
    setColumnsState(newColumns)
    saveColumns(newColumns)
  }, [])

  // Persist page size to localStorage
  const setPageSize = useCallback((newSize) => {
    setPageSizeState(newSize)
    savePageSize(newSize)
  }, [])

  // Persist filters to localStorage
  const setFilters = useCallback((newFilters) => {
    setFiltersState(newFilters)
    saveFilters(newFilters)
  }, [])

  // Update a single filter value
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value }
      // Remove empty values
      if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete updated[key]
      }
      return updated
    })
  }, [setFilters])

  // Clear all filters (resets to defaults)
  const clearFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS })
    clearStoredFilters()
  }, [])

  // Reset columns to defaults
  const resetColumns = useCallback(() => {
    setColumnsState(DEFAULT_COLUMNS)
    saveColumns(DEFAULT_COLUMNS)
  }, [])

  // Reset page size to default
  const resetPageSize = useCallback(() => {
    setPageSizeState(DEFAULT_PAGE_SIZE)
    savePageSize(DEFAULT_PAGE_SIZE)
  }, [])

  // Reset everything to defaults
  const resetAll = useCallback(() => {
    resetColumns()
    resetPageSize()
    clearFilters()
  }, [resetColumns, resetPageSize, clearFilters])

  // Count active filters
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    // includeCancelled=false means exclusion filter is active, count it
    // includeCancelled=true means no filter (include all), don't count
    if (key === 'includeCancelled') {
      return value === false ? count + 1 : count
    }
    // Count arrays with values
    if (Array.isArray(value) && value.length > 0) {
      return count + 1
    }
    // Count non-empty strings
    if (typeof value === 'string' && value.trim()) {
      return count + 1
    }
    return count
  }, 0)

  // Check if there are any active filters
  const hasActiveFilters = activeFilterCount > 0

  return {
    // State
    columns,
    pageSize,
    filters,

    // Setters
    setColumns,
    setPageSize,
    setFilters,
    updateFilter,

    // Actions
    clearFilters,
    resetColumns,
    resetPageSize,
    resetAll,

    // Helpers
    hasActiveFilters,
    activeFilterCount,
  }
}
