/**
 * LocalStorage utilities for dashboard filter preferences.
 *
 * Uses the shared createStorage factory for consistent error handling.
 * Includes domain-specific migration logic for backwards compatibility.
 */
import { createStorage } from '@/lib/storage'
import { createLogger } from '@/lib/logger'

const logger = createLogger('FilterStorage')
const storage = createStorage('portfolio-dashboard')

/**
 * Get default filter values
 */
export function getDefaultFilters() {
  const currentYear = new Date().getFullYear()
  // Ensure year is within valid range
  const year = currentYear >= 2025 && currentYear <= 2028 ? currentYear : 2025

  return {
    year,
    digitalFramework: ['ALL'],
    unidad: ['ALL'],
    cluster: ['ALL'],
    estado: ['ALL'],
    previstasEsteAno: 'Todos',
    excluirCanceladas: true,
    excluirEPTs: true,
    cerradaEconomicamente: 'No',
  }
}

/**
 * Save filters to localStorage
 */
export function saveFilters(filters) {
  storage.saveJSON('filters', filters)
  logger.debug('Filters saved to storage', filters)
}

/**
 * Load filters from localStorage
 */
export function loadFilters() {
  const stored = storage.loadJSON('filters', null)
  if (stored) {
    logger.info('Restored filters from storage', stored)
  }
  return stored
}

/**
 * Migrate old filter format to new format
 */
function migrateFilters(stored) {
  const defaults = getDefaultFilters()
  let migrated = false

  // Migrate includeCerradas → cerradaEconomicamente
  if ('includeCerradas' in stored) {
    stored.cerradaEconomicamente = stored.includeCerradas ? 'Todos' : 'No'
    delete stored.includeCerradas
    migrated = true
  }

  // Migrate old excluirCerradas boolean → cerradaEconomicamente
  if ('excluirCerradas' in stored) {
    if (typeof stored.excluirCerradas === 'boolean') {
      stored.cerradaEconomicamente = stored.excluirCerradas ? 'No' : 'Todos'
    }
    delete stored.excluirCerradas
    migrated = true
  }

  // Migrate old previstasEsteAno boolean → string
  if (typeof stored.previstasEsteAno === 'boolean') {
    stored.previstasEsteAno = stored.previstasEsteAno ? 'Sí' : 'Todos'
    migrated = true
  }

  // Migrate old "Sí" cerradaEconomicamente → "Cerrado"
  if (stored.cerradaEconomicamente === 'Sí') {
    stored.cerradaEconomicamente = 'Cerrado'
    migrated = true
  }

  // Add missing new keys with defaults
  const newKeys = ['estado', 'previstasEsteAno', 'excluirCanceladas', 'excluirEPTs', 'cerradaEconomicamente']
  for (const key of newKeys) {
    if (!(key in stored)) {
      stored[key] = defaults[key]
      migrated = true
    }
  }

  if (migrated) {
    logger.info('Migrated filters to new format', stored)
    saveFilters(stored)
  }

  return stored
}

/**
 * Initialize filters - load from storage or use defaults
 */
export function initializeFilters() {
  const stored = loadFilters()
  if (stored) {
    // Validate stored filters have base required keys
    const baseKeys = ['year', 'digitalFramework', 'unidad', 'cluster']
    const valid = baseKeys.every((key) => key in stored)

    if (valid) {
      return migrateFilters(stored)
    }
    logger.warning('Invalid stored filters, using defaults')
  }
  logger.info('Using default filters')
  return getDefaultFilters()
}

/**
 * Clear stored filters
 */
export function clearFilters() {
  storage.remove('filters')
  logger.info('Filters cleared from storage')
}

/**
 * Save FilterBar collapsed state to localStorage
 */
export function saveFilterBarCollapsed(collapsed) {
  storage.saveJSON('filtersCollapsed', collapsed)
}

/**
 * Load FilterBar collapsed state from localStorage
 */
export function loadFilterBarCollapsed() {
  return storage.loadJSON('filtersCollapsed', false)
}
