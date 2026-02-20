import { InitiativeCard } from './InitiativeCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchX } from 'lucide-react'

/**
 * Grid of initiative cards for mobile/alternate view.
 */
export function CardGrid({ data = [], isLoading, onQuickView }) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-36" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin resultados"
        description="No se encontraron iniciativas. Intente ajustar los filtros."
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map((initiative) => (
        <InitiativeCard
          key={initiative.portfolio_id}
          initiative={initiative}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  )
}
