/**
 * Column definitions for the search results grid
 */

// Column type enum
export const COLUMN_TYPES = {
  TEXT: 'text',
  CURRENCY: 'currency',
  DATE: 'date',
  NUMBER: 'number',
  ESTADO: 'estado',
}

// All available columns from datos_relevantes
export const ALL_COLUMNS = [
  // Lookup from datos_descriptivos
  { id: 'portfolio_id', label: 'Portfolio ID', type: COLUMN_TYPES.TEXT, category: 'Identificación' },
  { id: 'nombre', label: 'Nombre', type: COLUMN_TYPES.TEXT, category: 'Identificación' },
  { id: 'unidad', label: 'Unidad', type: COLUMN_TYPES.TEXT, category: 'Identificación' },
  { id: 'origen', label: 'Origen', type: COLUMN_TYPES.TEXT, category: 'Identificación' },
  { id: 'digital_framework_level_1', label: 'Digital Framework', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },
  { id: 'prioridad_descriptiva', label: 'Prioridad', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },
  { id: 'cluster', label: 'Cluster 2025', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },
  { id: 'priorizacion', label: 'Priorización', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },
  { id: 'tipo', label: 'Tipo', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },
  { id: 'referente_negocio', label: 'Referente Negocio', type: COLUMN_TYPES.TEXT, category: 'Referentes' },
  { id: 'referente_bi', label: 'Referente BI', type: COLUMN_TYPES.TEXT, category: 'Referentes' },
  { id: 'jira_id', label: 'Jira ID', type: COLUMN_TYPES.TEXT, category: 'Identificación' },
  { id: 'it_partner', label: 'IT Partner', type: COLUMN_TYPES.TEXT, category: 'Referentes' },
  { id: 'referente_ict', label: 'Referente ICT', type: COLUMN_TYPES.TEXT, category: 'Referentes' },
  { id: 'tipo_agrupacion', label: 'Tipo Agrupación', type: COLUMN_TYPES.TEXT, category: 'Clasificación' },

  // Lookup from informacion_economica
  { id: 'capex_opex', label: 'CAPEX/OPEX', type: COLUMN_TYPES.TEXT, category: 'Económico' },
  { id: 'cini', label: 'CINI', type: COLUMN_TYPES.TEXT, category: 'Económico' },
  { id: 'fecha_prevista_pes', label: 'Fecha Prevista PES', type: COLUMN_TYPES.DATE, category: 'Fechas' },

  // Estado functions
  { id: 'estado_de_la_iniciativa', label: 'Estado Iniciativa', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'fecha_de_ultimo_estado', label: 'Fecha Último Estado', type: COLUMN_TYPES.DATE, category: 'Estado' },
  { id: 'estado_de_la_iniciativa_2026', label: 'Estado 2026', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_aprobacion', label: 'Estado Aprobación', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_ejecucion', label: 'Estado Ejecución', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_agrupado', label: 'Estado Agrupado', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_dashboard', label: 'Estado Dashboard', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_requisito_legal', label: 'Estado Requisito Legal', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_sm100', label: 'Estado SM100', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'estado_sm200', label: 'Estado SM200', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'iniciativa_aprobada', label: 'Iniciativa Aprobada', type: COLUMN_TYPES.ESTADO, category: 'Estado' },
  { id: 'iniciativa_cerrada_economicamente', label: 'Cerrada Econ.', type: COLUMN_TYPES.TEXT, category: 'Estado' },
  { id: 'activo_ejercicio_actual', label: 'Activo Ejercicio', type: COLUMN_TYPES.TEXT, category: 'Estado' },

  // Financial 2024
  { id: 'budget_2024', label: 'Budget 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },
  { id: 'importe_sm200_24', label: 'SM200 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },
  { id: 'importe_aprobado_2024', label: 'Aprobado 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },
  { id: 'importe_citetic_24', label: 'CITETIC 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },
  { id: 'importe_facturacion_2024', label: 'Facturación 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },
  { id: 'importe_2024', label: 'Importe 2024', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2024' },

  // Financial 2025
  { id: 'budget_2025', label: 'Budget 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'importe_sm200_2025', label: 'SM200 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'importe_aprobado_2025', label: 'Aprobado 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'importe_facturacion_2025', label: 'Facturación 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'importe_2025', label: 'Importe 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'importe_2025_cc_re', label: 'Importe 2025 CC RE', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },
  { id: 'nuevo_importe_2025', label: 'Nuevo Importe 2025', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2025' },

  // Financial 2026
  { id: 'budget_2026', label: 'Budget 2026', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2026' },
  { id: 'importe_sm200_2026', label: 'SM200 2026', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2026' },
  { id: 'importe_aprobado_2026', label: 'Aprobado 2026', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2026' },
  { id: 'importe_facturacion_2026', label: 'Facturación 2026', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2026' },
  { id: 'importe_2026', label: 'Importe 2026', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2026' },

  // Financial 2027
  { id: 'budget_2027', label: 'Budget 2027', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2027' },
  { id: 'importe_sm200_2027', label: 'SM200 2027', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2027' },
  { id: 'importe_aprobado_2027', label: 'Aprobado 2027', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2027' },
  { id: 'importe_facturacion_2027', label: 'Facturación 2027', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2027' },
  { id: 'importe_2027', label: 'Importe 2027', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2027' },

  // Financial 2028
  { id: 'importe_2028', label: 'Importe 2028', type: COLUMN_TYPES.CURRENCY, category: 'Financiero 2028' },

  // Other functions
  { id: 'en_presupuesto_del_ano', label: 'En Presupuesto del Año', type: COLUMN_TYPES.TEXT, category: 'Otros' },
  { id: 'calidad_valoracion', label: 'Calidad Valoración', type: COLUMN_TYPES.TEXT, category: 'Otros' },
  { id: 'siguiente_accion', label: 'Siguiente Acción', type: COLUMN_TYPES.TEXT, category: 'Otros' },
  { id: 'esta_en_los_206_me_de_2026', label: 'Está en 20.6 M€ 2026', type: COLUMN_TYPES.TEXT, category: 'Otros' },

  // Date functions
  { id: 'fecha_sm100', label: 'Fecha SM100', type: COLUMN_TYPES.DATE, category: 'Fechas' },
  { id: 'fecha_aprobada_con_cct', label: 'Fecha Aprobada CCT', type: COLUMN_TYPES.DATE, category: 'Fechas' },
  { id: 'fecha_en_ejecucion', label: 'Fecha en Ejecución', type: COLUMN_TYPES.DATE, category: 'Fechas' },
  { id: 'fecha_limite', label: 'Fecha Límite', type: COLUMN_TYPES.DATE, category: 'Fechas' },
  { id: 'fecha_limite_comentarios', label: 'Fecha Límite Comentarios', type: COLUMN_TYPES.TEXT, category: 'Fechas' },

  // Misc
  { id: 'diferencia_apr_eje_exc_ept', label: 'Diferencia Apr-Eje', type: COLUMN_TYPES.CURRENCY, category: 'Otros' },
  { id: 'cluster_de_antes_de_1906', label: 'Cluster Pre-1906', type: COLUMN_TYPES.TEXT, category: 'Otros' },

  // Etiquetas (joined from etiquetas table)
  { id: 'etiquetas', label: 'Etiquetas', type: 'longtext', category: 'Clasificación' },
]

// Create a map for quick lookup
const COLUMN_MAP = ALL_COLUMNS.reduce((acc, col) => {
  acc[col.id] = col
  return acc
}, {})

/**
 * Get column definition by ID
 */
export function getColumnDef(columnId) {
  return COLUMN_MAP[columnId] || { id: columnId, label: columnId, type: COLUMN_TYPES.TEXT }
}

/**
 * Format cell value based on column type
 */
export function formatCellValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (type) {
    case COLUMN_TYPES.CURRENCY:
      const numValue = Number(value)
      if (isNaN(numValue)) return value
      // Format as thousands with k€
      const kValue = numValue / 1000
      return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`

    case COLUMN_TYPES.DATE:
      // Convert ISO date/datetime to DD/MM/YYYY or DD/MM/YYYY HH:MM
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const datePart = value.slice(0, 10)
        const [year, month, day] = datePart.split('-')
        const timePart = value.length > 10 ? value.slice(11, 16) : null
        return timePart ? `${day}/${month}/${year} ${timePart}` : `${day}/${month}/${year}`
      }
      return value

    case COLUMN_TYPES.NUMBER:
      const num = Number(value)
      if (isNaN(num)) return value
      return num.toLocaleString('es-ES')

    case COLUMN_TYPES.TEXT:
    default:
      return String(value)
  }
}

/**
 * Get all unique categories
 */
export function getColumnCategories() {
  const categories = [...new Set(ALL_COLUMNS.map(col => col.category))]
  return categories
}

/**
 * Get columns by category
 */
export function getColumnsByCategory(category) {
  return ALL_COLUMNS.filter(col => col.category === category)
}
