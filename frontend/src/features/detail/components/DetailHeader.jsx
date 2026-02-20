import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBadgeColorClass } from '@/lib/badgeColors'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { useParametroColors } from '@/hooks/useParametroColors'

// Helper to determine SM status badge properties
// Returns: { text, color: 'green' | 'red' | 'amber' }
// Values in DB may include prefix like "SM100 Pendiente", "SM200 Cancelada"
function getSmBadgeProps(value, label) {
  if (!value) {
    return { text: `Sin ${label}`, color: 'red' }
  }
  const lowerValue = value.toLowerCase()
  if (lowerValue.includes('cancelada') || lowerValue.includes('cancelado')) {
    return { text: 'Cancelada', color: 'red' }
  }
  if (lowerValue.includes('pendiente')) {
    return { text: `${label} Pendiente`, color: 'amber' }
  }
  return { text: `Tiene ${label}`, color: 'green' }
}

// Badge color classes
const BADGE_COLORS = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

// Simple badge component for status display
function SmBadge({ text, color = 'green' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[color]}`}
    >
      {text}
    </span>
  )
}

export function DetailHeader({
  portfolioId,
  nombre,
  highlightedEtiquetas = [],
  estadoIniciativa,
  estadoSm100,
  estadoSm200,
  iniciativaAprobada,
}) {
  const estadoColorMap = useParametroColors('estado_de_la_iniciativa')
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = location.state?.from

  const sm100Badge = getSmBadgeProps(estadoSm100, 'SM100')
  const sm200Badge = getSmBadgeProps(estadoSm200, 'SM200')

  const handleBack = () => {
    if (fromState?.route) {
      navigate(fromState.route)
    } else {
      navigate(-1)
    }
  }

  const backLabel = fromState?.label ? `Volver a ${fromState.label}` : 'Volver'

  return (
    <div className="sticky top-16 z-10 bg-muted/50 backdrop-blur-sm border-b py-4 shadow-sm">
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" onClick={handleBack} className="gap-2 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div className="min-w-0">
            <div className="text-sm font-data text-muted-foreground">Portfolio ID: {portfolioId}</div>
            <h1 className="text-xl font-bold font-heading tracking-tight truncate" title={nombre}>
              {nombre || 'Detalle de Iniciativa'}
            </h1>
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {estadoIniciativa && (
                <EstadoTag value={estadoIniciativa} colorMap={estadoColorMap} />
              )}
              <SmBadge text={sm100Badge.text} color={sm100Badge.color} />
              <SmBadge text={sm200Badge.text} color={sm200Badge.color} />
              <SmBadge
                text={iniciativaAprobada === 'Aprobada' ? 'Aprobada' : 'No Aprobada'}
                color={iniciativaAprobada === 'Aprobada' ? 'green' : 'red'}
              />
            </div>
          </div>
        </div>

        {highlightedEtiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
            {highlightedEtiquetas.map((et) => (
              <span
                key={et.etiqueta}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getBadgeColorClass(et.color)}`}
              >
                {et.etiqueta}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
