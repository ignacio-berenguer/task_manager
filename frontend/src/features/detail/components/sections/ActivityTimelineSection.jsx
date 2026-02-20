import { FileText, StickyNote, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TYPE_CONFIG = {
  hecho: {
    icon: FileText,
    label: 'Hecho',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    dotClass: 'bg-amber-400',
  },
  nota: {
    icon: StickyNote,
    label: 'Nota',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    dotClass: 'bg-sky-400',
  },
  transaccion: {
    icon: ArrowRightLeft,
    label: 'Transacción',
    badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    dotClass: 'bg-violet-400',
  },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  // If has time component, show time too
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function TimelineEntry({ entry }) {
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.transaccion
  const Icon = config.icon

  return (
    <div className="flex gap-3 py-3 px-2 hover:bg-muted/20 transition-colors">
      {/* Timeline dot & line */}
      <div className="flex flex-col items-center pt-1">
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', config.dotClass)} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', config.badgeClass)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          {entry.badge && entry.type !== 'nota' && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {entry.badge}
            </span>
          )}
          {entry.user && (
            <span className="text-xs text-muted-foreground">
              por {entry.user}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed">
          {entry.summary || '—'}
        </p>
        {entry.detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
        )}
      </div>
    </div>
  )
}

export function ActivityTimelineSection({ data, isLoading, error, hasMore, isFetchingMore, onLoadMore }) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-2">Cargando actividad...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-2">Error al cargar la actividad</p>
  }

  const timeline = data?.timeline || []

  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No hay actividad registrada</p>
  }

  return (
    <div>
      <div className="divide-y">
        {timeline.map((entry, idx) => (
          <TimelineEntry key={`${entry.type}-${entry.source_id}-${idx}`} entry={entry} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  )
}
