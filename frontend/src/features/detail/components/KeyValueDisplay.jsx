import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { EstadoTag } from '@/components/shared/EstadoTag'

/**
 * Format value based on type
 */
function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">-</span>
  }

  switch (type) {
    case 'currency':
      const numValue = Number(value)
      if (isNaN(numValue)) return value
      const kValue = numValue / 1000
      return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`

    case 'date':
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = value.split('-')
        return `${day}/${month}/${year}`
      }
      return value

    case 'boolean':
      return value ? 'Sí' : 'No'

    case 'number':
      const num = Number(value)
      if (isNaN(num)) return value
      return num.toLocaleString('es-ES')

    default:
      return String(value)
  }
}

/**
 * Display a single key-value pair
 */
export function KeyValuePair({ label, value, type = 'text', className }) {
  const formatted = formatValue(value, type)

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-xs font-body text-muted-foreground">{label}</span>
      <span className="font-medium text-sm font-body">
        {type === 'estado' && value ? (
          <EstadoTag value={value} />
        ) : type === 'currency' && value !== null && value !== undefined && value !== '' ? (
          <TooltipProvider delayDuration={200}>
            <CurrencyCell value={value} formattedValue={formatted} />
          </TooltipProvider>
        ) : (
          formatted
        )}
      </span>
    </div>
  )
}

/**
 * Display multiple key-value pairs in a grid
 */
export function KeyValueDisplay({ data, fields, columns = 3, className }) {
  if (!data) return null

  return (
    <div
      className={cn(
        'grid gap-x-4 gap-y-3',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {fields.map(({ key, label, type }) => (
        <KeyValuePair
          key={key}
          label={label}
          value={data[key]}
          type={type}
        />
      ))}
    </div>
  )
}
