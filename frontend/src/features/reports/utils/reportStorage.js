/**
 * LocalStorage utilities for report preferences.
 *
 * Uses the shared createStorage factory for consistent error handling.
 */
import { createStorage } from '@/lib/storage'

const storage = createStorage('portfolio-report')

// Default columns to display in the report
export const DEFAULT_COLUMNS = [
  'portfolio_id',
  'fecha',
  'estado',
  'nombre',
  'notas',
  'importe',
  'id_hecho',
  'referente_bi',
  'digital_framework_level_1',
  'unidad',
  'cluster',
  'tipo',
]

export const DEFAULT_PAGE_SIZE = 50

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
  storage.removeMany(['columns', 'column-order', 'page-size'])
}
