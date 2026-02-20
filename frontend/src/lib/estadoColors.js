/**
 * Color mapping for estado values displayed as tags/badges.
 * Follows the same pattern as badgeColors.js (light + dark mode classes).
 *
 * Used by: EstadoTag component across Hechos report, LTP report,
 * Etiquetas report, Detail/Hechos table, and GenericReportPage.
 */

const SLATE = 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
const BLUE = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
const AMBER = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
const INDIGO = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
const EMERALD = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
const CYAN = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
const GREEN = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
const GRAY = 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
const VIOLET = 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
const RED = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'

/**
 * Maps estado values to Tailwind CSS color classes.
 * Groups follow the canonical workflow progression from estadoOrder.js.
 */
export const ESTADO_COLORS = {
  // Reception / Draft
  'Recepción': SLATE,

  // Documentation (SM100 / SM200)
  'SM100 Redacción': BLUE,
  'SM100 Final': BLUE,
  'SM200 En Revisión': BLUE,
  'SM200 Final': BLUE,

  // Review / Analysis
  'Análisis BI': AMBER,
  'Pendiente de Unidad Solicitante': AMBER,
  'Revisión Regulación': AMBER,
  'En Revisión P&C': AMBER,

  // Approval
  'En Aprobación': INDIGO,
  'Encolada por Prioridad': INDIGO,

  // Approved
  'Aprobada': EMERALD,
  'Aprobada con CCT': EMERALD,

  // Execution
  'En ejecución': CYAN,

  // Completed
  'Finalizado': GREEN,
  'Completado': GREEN,

  // Pending (LTP / generic)
  'Pendiente': RED,

  // Administrative / End-of-year
  'Pendiente PES': GRAY,
  'Facturación cierre año': GRAY,
  'Cierre económico iniciativa': GRAY,

  // Planning
  'Importe Estimado': VIOLET,
  'Importe Planificado': VIOLET,

  // Cancelled
  'Cancelado': RED,

  // Document processing states
  'Error': RED,
  'Ignorado': GRAY,
}

/** Default color for unknown estado values. */
const DEFAULT_COLOR = GRAY

/**
 * Get the Tailwind color class string for a given estado value.
 * Returns neutral gray for unknown/null values.
 */
export function getEstadoColor(estado) {
  if (!estado) return DEFAULT_COLOR
  return ESTADO_COLORS[estado] || DEFAULT_COLOR
}
