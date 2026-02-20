import { Badge } from '@/components/ui/badge'

function getEstadoVariant(estado) {
  if (!estado) return 'outline'
  const normalized = estado.toLowerCase()
  switch (normalized) {
    case 'en curso':
    case 'pendiente':
      return 'destructive'
    case 'completado':
    case 'completada':
    case 'continuar en otra tarea':
      return 'success'
    case 'en progreso':
      return 'warning'
    case 'cancelado':
    case 'cancelada':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function EstadoBadge({ estado, size }) {
  const variant = getEstadoVariant(estado)
  return <Badge variant={variant} size={size} className="whitespace-nowrap">{estado || 'Sin estado'}</Badge>
}
