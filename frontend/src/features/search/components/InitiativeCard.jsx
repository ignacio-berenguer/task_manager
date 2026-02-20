import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { CurrencyCell } from '@/components/shared/CurrencyCell'

/**
 * Card component for a single initiative in the mobile card view.
 */
export function InitiativeCard({ initiative, onQuickView }) {
  const {
    portfolio_id,
    nombre,
    estado_de_la_iniciativa,
    unidad,
    cluster,
  } = initiative

  // Try multiple importe fields in order of preference
  const importe = initiative.importe_2026 ?? initiative.importe_2025 ?? initiative.budget_2026 ?? initiative.budget_2025

  return (
    <article className="rounded-lg border bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/detail/${portfolio_id}`}
          className="font-mono text-sm font-semibold text-primary hover:underline"
        >
          {portfolio_id}
        </Link>
        <button
          type="button"
          onClick={() => onQuickView?.(portfolio_id)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Vista rapida"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
        {nombre || '-'}
      </p>

      <div className="flex items-center gap-2 mb-2">
        {estado_de_la_iniciativa && (
          <EstadoTag estado={estado_de_la_iniciativa} />
        )}
        {importe != null && (
          <span className="text-sm font-medium text-muted-foreground ml-auto">
            <CurrencyCell value={importe} />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {unidad && <span>{unidad}</span>}
        {unidad && cluster && <span>|</span>}
        {cluster && <span>{cluster}</span>}
      </div>
    </article>
  )
}
