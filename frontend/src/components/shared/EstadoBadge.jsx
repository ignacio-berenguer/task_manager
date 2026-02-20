import { Badge } from '@/components/ui/badge'

function getEstadoVariant(estado) {
  if (!estado) return 'outline'
  switch (estado) {
    case 'En Curso':
      return 'destructive'
    case 'Completado':
    case 'Continuar en otra tarea':
      return 'success'
    case 'Cancelado':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function EstadoBadge({ estado, size }) {
  const variant = getEstadoVariant(estado)
  return <Badge variant={variant} size={size} className="whitespace-nowrap">{estado || 'Sin estado'}</Badge>
}
