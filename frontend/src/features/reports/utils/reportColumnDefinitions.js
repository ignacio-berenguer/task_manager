/**
 * Column definitions for the report grid
 */
import { ALL_COLUMNS, formatCellValue } from '@/features/search/utils/columnDefinitions'

// Column type enum
export const COLUMN_TYPES = {
  TEXT: 'text',
  CURRENCY: 'currency',
  DATE: 'date',
  NUMBER: 'number',
  LONGTEXT: 'longtext',
}

// Default report columns (hechos + datos_relevantes join)
export const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Hechos' },
  { id: 'fecha', label: 'Fecha', type: 'date', category: 'Hechos' },
  { id: 'estado', label: 'Estado', type: 'estado', category: 'Hechos' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Hechos' },
  { id: 'notas', label: 'Nota', type: 'longtext', category: 'Hechos' },
  { id: 'importe', label: 'Importe', type: 'currency', category: 'Hechos' },
  { id: 'id_hecho', label: 'ID Hecho', type: 'number', category: 'Hechos' },
  { id: 'referente_bi', label: 'Referente BI', type: 'text', category: 'Hechos' },
  { id: 'digital_framework_level_1', label: 'Digital Framework', type: 'text', category: 'Portfolio' },
  { id: 'unidad', label: 'Unidad', type: 'text', category: 'Portfolio' },
  { id: 'cluster', label: 'Cluster', type: 'text', category: 'Portfolio' },
  { id: 'tipo', label: 'Tipo', type: 'text', category: 'Portfolio' },
]

// IDs of default report columns for quick lookup
const REPORT_COLUMN_IDS = new Set(REPORT_COLUMNS.map((col) => col.id))

// Additional columns from datos_relevantes not already in the default report columns
export const ADDITIONAL_COLUMNS = ALL_COLUMNS.filter((col) => !REPORT_COLUMN_IDS.has(col.id))

// All report columns: default + additional
export const ALL_REPORT_COLUMNS = [...REPORT_COLUMNS, ...ADDITIONAL_COLUMNS]

// Create a map for quick lookup
const COLUMN_MAP = ALL_REPORT_COLUMNS.reduce((acc, col) => {
  acc[col.id] = col
  return acc
}, {})

/**
 * Get column definition by ID
 */
export function getReportColumnDef(columnId) {
  return COLUMN_MAP[columnId] || { id: columnId, label: columnId, type: COLUMN_TYPES.TEXT }
}

/**
 * Format cell value based on column type
 * Reuses formatCellValue from search columnDefinitions
 */
export function formatReportCellValue(value, type) {
  return formatCellValue(value, type)
}

/**
 * Get all unique categories from report columns
 */
export function getReportColumnCategories() {
  const categories = [...new Set(ALL_REPORT_COLUMNS.map((col) => col.category))]
  return categories
}

/**
 * Get report columns by category
 */
export function getReportColumnsByCategory(category) {
  return ALL_REPORT_COLUMNS.filter((col) => col.category === category)
}
