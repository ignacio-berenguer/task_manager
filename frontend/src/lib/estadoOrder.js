export const ESTADO_ORDER = [
  'En curso',
  'Completado',
  'Cancelado',
  'Pendiente',
  'Completada',
]

export function getEstadoIndex(name) {
  const idx = ESTADO_ORDER.indexOf(name)
  return idx === -1 ? ESTADO_ORDER.length : idx
}

export function sortEstados(estados) {
  return [...estados].sort((a, b) => getEstadoIndex(a) - getEstadoIndex(b))
}
