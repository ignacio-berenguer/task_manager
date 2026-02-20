export const ESTADO_ORDER = [
  'Pendiente',
  'En Progreso',
  'Completada',
  'Cancelada'
]

export function getEstadoIndex(name) {
  const idx = ESTADO_ORDER.indexOf(name)
  return idx === -1 ? ESTADO_ORDER.length : idx
}

export function sortEstados(estados) {
  return [...estados].sort((a, b) => getEstadoIndex(a) - getEstadoIndex(b))
}
