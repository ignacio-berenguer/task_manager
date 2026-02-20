import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { EstadoTag } from '@/components/shared/EstadoTag'

/**
 * Format value based on type
 */
export function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return '-'
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

    case 'number':
      const num = Number(value)
      if (isNaN(num)) return value
      return num.toLocaleString('es-ES')

    default:
      return String(value)
  }
}

/**
 * Compare two values for sorting, with nulls last
 */
function compareValues(a, b, type, direction) {
  const aVal = a === null || a === undefined || a === '' ? null : a
  const bVal = b === null || b === undefined || b === '' ? null : b

  // Nulls always last regardless of direction
  if (aVal === null && bVal === null) return 0
  if (aVal === null) return 1
  if (bVal === null) return -1

  let result = 0

  if (type === 'currency' || type === 'number') {
    result = Number(aVal) - Number(bVal)
  } else if (type === 'date') {
    result = String(aVal).localeCompare(String(bVal))
  } else {
    result = String(aVal).localeCompare(String(bVal), 'es')
  }

  return direction === 'desc' ? -result : result
}

/**
 * Simple table component for displaying data arrays with sortable columns
 */
export function SimpleTable({ data, columns, className, onRowEdit }) {
  const { portfolio_id: currentPid } = useParams()
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const handleSort = (colKey) => {
    setSortConfig((prev) => {
      if (prev.key !== colKey) return { key: colKey, direction: 'asc' }
      if (prev.direction === 'asc') return { key: colKey, direction: 'desc' }
      return { key: null, direction: null }
    })
  }

  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key) return data
    const col = columns.find((c) => c.key === sortConfig.key)
    if (!col) return data
    return [...data].sort((a, b) =>
      compareValues(a[sortConfig.key], b[sortConfig.key], col.type, sortConfig.direction)
    )
  }, [data, columns, sortConfig])

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No data available</p>
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {onRowEdit && (
              <th className="p-2 w-10" />
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'p-2 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  col.className
                )}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  <span>{col.label}</span>
                  {sortConfig.key === col.key ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={row.id || index}
              className={cn(
                'border-b border-border/50 transition-colors hover:bg-accent/50',
                'bg-background'
              )}
            >
              {onRowEdit && (
                <td className="p-2 w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRowEdit(row)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'p-2',
                    col.type === 'longtext' && 'min-w-[200px] max-w-[400px]',
                    col.cellClassName
                  )}
                  title={col.type !== 'longtext' ? String(row[col.key] || '') : undefined}
                >
                  {col.render ? (
                    col.render(row[col.key], row)
                  ) : col.type === 'link' && row[col.key] ? (
                    <Link
                      to={`${col.linkPrefix || ''}${row[col.key]}`}
                      state={col.linkPrefix === '/detail/' && currentPid ? { from: { route: `/detail/${currentPid}`, label: currentPid } } : undefined}
                      className="text-primary hover:underline"
                    >
                      {row[col.key]}
                    </Link>
                  ) : col.type === 'longtext' ? (
                    <span className="block whitespace-pre-wrap text-sm">
                      {row[col.key] || '-'}
                    </span>
                  ) : col.type === 'estado' ? (
                    <EstadoTag value={row[col.key]} />
                  ) : col.type === 'currency' ? (
                    <CurrencyCell
                      value={row[col.key]}
                      formattedValue={formatValue(row[col.key], col.type)}
                      className="block truncate max-w-[300px]"
                    />
                  ) : (
                    <span className="block truncate max-w-[300px]">
                      {formatValue(row[col.key], col.type)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}
