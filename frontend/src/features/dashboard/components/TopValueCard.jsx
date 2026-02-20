import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { formatImporte } from '@/lib/utils'

const THRESHOLD_OPTIONS = [
  { value: 500000, label: '500 k€' },
  { value: 1000000, label: '1.000 k€' },
  { value: 2000000, label: '2.000 k€' },
  { value: 5000000, label: '5.000 k€' },
]

/**
 * Card showing top value initiatives above a configurable threshold
 */
export function TopValueCard({ items, year, threshold, onThresholdChange, isLoading }) {
  const importeField = `importe_${year}`

  const topItems = (items || [])
    .filter((item) => (item[importeField] || 0) > threshold)
    .sort((a, b) => (b[importeField] || 0) - (a[importeField] || 0))
    .slice(0, 20)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Iniciativas mas importantes</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor="threshold-select" className="text-xs text-muted-foreground">
            Umbral:
          </label>
          <select
            id="threshold-select"
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {THRESHOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : topItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay iniciativas que superen el umbral seleccionado
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
                  <th className="pb-2 text-right font-heading text-xs font-semibold uppercase tracking-wider">Importe {year}</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
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
                    <td className="py-2 pr-4 truncate max-w-[400px]" title={item.nombre || ''}>
                      {item.nombre || '-'}
                    </td>
                    <td className="py-2 text-right tabular-nums font-data text-xs">
                      {formatImporte(item[importeField] || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: stacked card layout */}
          <div className="sm:hidden divide-y">
            {topItems.map((item) => (
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
                    {formatImporte(item[importeField] || 0)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.nombre || '-'}</p>
              </div>
            ))}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
