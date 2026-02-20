import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const REASON_STYLES = {
  etiqueta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  grupo: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

export function RelatedInitiativesSection({ data, isLoading, error }) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-2">Cargando iniciativas relacionadas...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive py-2">Error al cargar iniciativas relacionadas</p>
  }

  const related = data?.related || []

  if (related.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No se encontraron iniciativas relacionadas</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4 font-medium text-muted-foreground">Portfolio ID</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Nombre</th>
            <th className="py-2 font-medium text-muted-foreground">Razones</th>
          </tr>
        </thead>
        <tbody>
          {related.map((item) => (
            <tr key={item.portfolio_id} className="border-b last:border-b-0 hover:bg-muted/20">
              <td className="py-2 pr-4">
                <Link
                  to={`/detail/${item.portfolio_id}`}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {item.portfolio_id}
                </Link>
              </td>
              <td className="py-2 pr-4 max-w-xs truncate">{item.nombre || '—'}</td>
              <td className="py-2">
                <div className="flex flex-wrap gap-1">
                  {item.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        REASON_STYLES[reason.type] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {reason.type === 'grupo' ? reason.value : `${reason.type}: ${reason.value}`}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
