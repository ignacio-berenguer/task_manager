import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Trend indicator for KPI cards
 */
function TrendIndicator({ trend }) {
  if (!trend) return null

  const { value, label } = trend

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <TrendingUp className="h-3 w-3" />
        <span>↑{Math.min(Math.abs(value), 999).toFixed(1)}%</span>
        <span className="text-muted-foreground">{label}</span>
      </span>
    )
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <TrendingDown className="h-3 w-3" />
        <span>↓{Math.min(Math.abs(value), 999).toFixed(1)}%</span>
        <span className="text-muted-foreground">{label}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span>Sin cambio</span>
      <span>{label}</span>
    </span>
  )
}

/**
 * KPI card component for displaying metrics with optional trend indicator
 */
export function KPICard({ title, value, icon: Icon, description, trend, className }) {
  return (
    <Card className={cn('border-l-2 border-l-primary', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium font-body uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-medium font-data tracking-tight">{value}</p>
            <TrendIndicator trend={trend} />
            {description && (
              <p className="text-xs text-muted-foreground font-body">{description}</p>
            )}
          </div>
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
