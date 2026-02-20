/**
 * Canonical ordering of estado_de_la_iniciativa values (logical workflow progression).
 * This is the single source of truth for estado ordering across the application.
 *
 * Used by: Dashboard charts, Search filters, Report filters, and any future
 * feature that displays estado_de_la_iniciativa options.
 */
export const ESTADO_ORDER = [
  'Recepción',
  'SM100 Redacción',
  'SM100 Final',
  'SM200 En Revisión',
  'SM200 Final',
  'Análisis BI',
  'Pendiente de Unidad Solicitante',
  'Revisión Regulación',
  'En Revisión P&C',
  'En Aprobación',
  'Encolada por Prioridad',
  'Aprobada',
  'Aprobada con CCT',
  'En ejecución',
  'Finalizado',
  'Pendiente PES',
  'Facturación cierre año',
  'Cierre económico iniciativa',
  'Importe Estimado',
  'Importe Planificado',
  'Cancelado',
]

/**
 * Get sort index for an estado value. Unknown values go to the end.
 */
export function getEstadoIndex(name) {
  const idx = ESTADO_ORDER.indexOf(name)
  return idx === -1 ? ESTADO_ORDER.length : idx
}

/**
 * Sort an array of estado strings by workflow order.
 */
export function sortEstados(estados) {
  return [...estados].sort((a, b) => getEstadoIndex(a) - getEstadoIndex(b))
}
