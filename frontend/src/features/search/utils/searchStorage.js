/**
 * LocalStorage utilities for search preferences.
 *
 * Uses the shared createStorage factory for consistent error handling.
 */
import { createStorage } from '@/lib/storage'

const storage = createStorage('portfolio-search')

// Default columns to display
export const DEFAULT_COLUMNS = [
  'portfolio_id',
  'nombre',
  'unidad',
  'digital_framework_level_1',
  'estado_de_la_iniciativa',
  'fecha_de_ultimo_estado',
  'cluster',
  'tipo',
  'importe_2026',
]

export const DEFAULT_PAGE_SIZE = 50

export const DEFAULT_FILTERS = {
  cerradaEconomicamente: ['No'],
  includeCancelled: false, // Default: exclude cancelled initiatives
}

export function saveFilters(filters) {
  storage.saveJSON('filters', filters)
}

export function loadFilters() {
  const filters = storage.loadJSON('filters', { ...DEFAULT_FILTERS })
  // Migrate old "Sí" value in cerradaEconomicamente to match new format
  if (filters.cerradaEconomicamente && Array.isArray(filters.cerradaEconomicamente)) {
    const hasSi = filters.cerradaEconomicamente.some((v) => v === 'Sí' || v === 'Si')
    if (hasSi) {
      filters.cerradaEconomicamente = filters.cerradaEconomicamente.filter((v) => v !== 'Sí' && v !== 'Si')
      if (filters.cerradaEconomicamente.length === 0) {
        filters.cerradaEconomicamente = DEFAULT_FILTERS.cerradaEconomicamente
      }
      saveFilters(filters)
    }
  }
  return filters
}

export function saveColumns(columns) {
  storage.saveJSON('columns', columns)
}

export function loadColumns() {
  return storage.loadJSON('columns', DEFAULT_COLUMNS)
}

export function saveColumnOrder(order) {
  storage.saveJSON('column-order', order)
}

export function loadColumnOrder() {
  return storage.loadJSON('column-order', DEFAULT_COLUMNS)
}

export function savePageSize(size) {
  storage.saveString('page-size', size)
}

export function loadPageSize() {
  return storage.loadInt('page-size', DEFAULT_PAGE_SIZE)
}

export function resetToDefaults() {
  storage.removeMany(['filters', 'columns', 'column-order', 'page-size'])
}

export function clearFilters() {
  storage.remove('filters')
}

// Saved searches
export function loadSavedSearches() {
  return storage.loadJSON('saved-searches', [])
}

export function saveSavedSearches(searches) {
  storage.saveJSON('saved-searches', searches)
}
