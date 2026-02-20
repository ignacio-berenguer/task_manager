import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'

/**
 * Format ISO date string to DD/MM/YYYY
 */
function formatDate(isoDate) {
  if (!isoDate) return '-'
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Card showing initiatives with recent status changes
 */
export function RecentChangesCard({ items, recentDays, onNavigateToHechos, isLoading }) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - recentDays)
  const cutoffISO = cutoffDate.toISOString().split('T')[0]

  const recentItems = (items || [])
    .filter((item) => item.fecha_de_ultimo_estado && item.fecha_de_ultimo_estado >= cutoffISO)
    .sort((a, b) => (a.fecha_de_ultimo_estado || '').localeCompare(b.fecha_de_ultimo_estado || ''))
    .slice(0, 20)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-base">Iniciativas con cambios recientes</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateToHechos}
          className="gap-1 shrink-0"
        >
          <span className="hidden sm:inline">Ver en Informe Hechos</span>
          <span className="sm:hidden">Hechos</span>
          <ExternalLink className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay iniciativas con cambios en los últimos {recentDays} días
          </p>
        ) : (
          <>
          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-heading text-xs font-semibold uppercase tracking-wider">Portfolio ID</th>
                  <th className="pb-2 pr-4 font-heading text-xs font-semibold uppercase tracking-wider">Nombre</th>
                  <th className="pb-2 pr-4 font-heading text-xs font-semibold uppercase tracking-wider">Estado</th>
                  <th className="pb-2 font-heading text-xs font-semibold uppercase tracking-wider">Fecha Ultimo Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item.portfolio_id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/detail/${item.portfolio_id}`}
                        state={{ from: { route: '/dashboard', label: 'Dashboard' } }}
                        className="text-primary hover:underline font-medium"
                      >
                        {item.portfolio_id}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 truncate max-w-[300px]" title={item.nombre || ''}>
                      {item.nombre || '-'}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {item.estado_de_la_iniciativa || '-'}
                    </td>
                    <td className="py-2 whitespace-nowrap tabular-nums font-data text-xs">
                      {formatDate(item.fecha_de_ultimo_estado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: stacked card layout */}
          <div className="sm:hidden divide-y">
            {recentItems.map((item) => (
              <div key={item.portfolio_id} className="py-2.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/detail/${item.portfolio_id}`}
                    state={{ from: { route: '/dashboard', label: 'Dashboard' } }}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {item.portfolio_id}
                  </Link>
                  <span className="text-xs tabular-nums font-data text-muted-foreground">
                    {formatDate(item.fecha_de_ultimo_estado)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.nombre || '-'}</p>
                <p className="text-xs text-muted-foreground">{item.estado_de_la_iniciativa || '-'}</p>
              </div>
            ))}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
