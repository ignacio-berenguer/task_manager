import { useState, useCallback } from 'react'

const DEFAULT_PAGE_SIZE = 50
const MAX_TEMPLATES = 10

/**
 * Create storage helpers for a given key prefix
 */
function createStorage(prefix) {
  const keys = {
    COLUMNS: `portfolio-report-${prefix}-columns`,
    PAGE_SIZE: `portfolio-report-${prefix}-page-size`,
    TEMPLATES: `portfolio-report-${prefix}-templates`,
  }

  return {
    loadColumns(defaultColumns) {
      try {
        const stored = localStorage.getItem(keys.COLUMNS)
        return stored ? JSON.parse(stored) : defaultColumns
      } catch {
        return defaultColumns
      }
    },
    saveColumns(columns) {
      try {
        localStorage.setItem(keys.COLUMNS, JSON.stringify(columns))
      } catch { /* ignore */ }
    },
    loadPageSize() {
      try {
        const stored = localStorage.getItem(keys.PAGE_SIZE)
        return stored ? parseInt(stored, 10) : DEFAULT_PAGE_SIZE
      } catch {
        return DEFAULT_PAGE_SIZE
      }
    },
    savePageSize(size) {
      try {
        localStorage.setItem(keys.PAGE_SIZE, String(size))
      } catch { /* ignore */ }
    },
    loadTemplates() {
      try {
        const stored = localStorage.getItem(keys.TEMPLATES)
        return stored ? JSON.parse(stored) : []
      } catch {
        return []
      }
    },
    saveTemplates(templates) {
      try {
        localStorage.setItem(keys.TEMPLATES, JSON.stringify(templates))
      } catch { /* ignore */ }
    },
  }
}

/**
 * Hook to manage report preferences with localStorage persistence
 * @param {string} storagePrefix - Prefix for localStorage keys (e.g., 'hechos', 'ltps')
 * @param {string[]} defaultColumns - Default column IDs for this report
 */
export function useReportPreferences(storagePrefix, defaultColumns) {
  const storage = createStorage(storagePrefix)

  const [columns, setColumnsState] = useState(() => storage.loadColumns(defaultColumns))
  const [pageSize, setPageSizeState] = useState(() => storage.loadPageSize())
  const [templates, setTemplatesState] = useState(() => storage.loadTemplates())

  const setColumns = useCallback((newColumns) => {
    setColumnsState(newColumns)
    storage.saveColumns(newColumns)
  }, [storage])

  const setPageSize = useCallback((newSize) => {
    setPageSizeState(newSize)
    storage.savePageSize(newSize)
  }, [storage])

  const resetColumns = useCallback(() => {
    setColumnsState(defaultColumns)
    storage.saveColumns(defaultColumns)
  }, [defaultColumns, storage])

  const saveTemplate = useCallback((name, filters, sortConfig) => {
    const template = {
      name,
      createdAt: new Date().toISOString(),
      filters,
      columns,
      sortConfig,
      pageSize,
    }
    const updated = [template, ...templates].slice(0, MAX_TEMPLATES)
    setTemplatesState(updated)
    storage.saveTemplates(updated)
    return updated
  }, [templates, columns, pageSize, storage])

  const deleteTemplate = useCallback((index) => {
    const updated = templates.filter((_, i) => i !== index)
    setTemplatesState(updated)
    storage.saveTemplates(updated)
    return updated
  }, [templates, storage])

  return {
    columns,
    pageSize,
    setColumns,
    setPageSize,
    resetColumns,
    templates,
    saveTemplate,
    deleteTemplate,
  }
}
