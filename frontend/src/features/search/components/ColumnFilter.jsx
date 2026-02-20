import { useState, useRef, useEffect, useMemo } from 'react'
import { Filter, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { COLUMN_TYPES } from '../utils/columnDefinitions'

/**
 * Determine filter type based on column definition type.
 */
function getFilterType(colType) {
  if (colType === COLUMN_TYPES.ESTADO || colType === 'estado') return 'select'
  if (colType === COLUMN_TYPES.CURRENCY || colType === 'currency') return 'range'
  return 'text'
}

/**
 * Column filter popover component.
 * Renders a funnel icon that opens a dropdown filter for the column.
 */
export function ColumnFilterButton({ columnId, colDef, filterValue, onFilterChange, data }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const isActive = filterValue != null && filterValue !== '' &&
    !(Array.isArray(filterValue) && filterValue.length === 0) &&
    !(typeof filterValue === 'object' && !Array.isArray(filterValue) && filterValue.min === '' && filterValue.max === '')

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const filterType = getFilterType(colDef?.type)

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={cn(
          'p-0.5 rounded hover:bg-accent/80 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'
        )}
        aria-label={`Filtrar ${colDef?.label || columnId}`}
      >
        <Filter className={cn('h-3 w-3', isActive && 'fill-current')} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 min-w-[220px] rounded-md border bg-popover p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {filterType === 'text' && (
            <TextColumnFilter
              value={filterValue || ''}
              onChange={(val) => onFilterChange(columnId, val)}
              onClear={() => onFilterChange(columnId, '')}
              label={colDef?.label}
            />
          )}
          {filterType === 'select' && (
            <SelectColumnFilter
              value={filterValue || []}
              onChange={(val) => onFilterChange(columnId, val)}
              onClear={() => onFilterChange(columnId, [])}
              data={data}
              columnId={columnId}
              label={colDef?.label}
            />
          )}
          {filterType === 'range' && (
            <RangeColumnFilter
              value={filterValue || { min: '', max: '' }}
              onChange={(val) => onFilterChange(columnId, val)}
              onClear={() => onFilterChange(columnId, { min: '', max: '' })}
              label={colDef?.label}
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Text filter: "contains" search */
function TextColumnFilter({ value, onChange, onClear, label }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Filtrar {label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Contiene..."
        className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
        autoFocus
      />
      {value && (
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={onClear}>
          <X className="h-3 w-3 mr-1" /> Limpiar
        </Button>
      )}
    </div>
  )
}

/** Select filter: checkbox list of unique values */
function SelectColumnFilter({ value, onChange, onClear, data, columnId, label }) {
  const [searchTerm, setSearchTerm] = useState('')

  const uniqueValues = useMemo(() => {
    const values = new Set()
    ;(data || []).forEach((row) => {
      const v = row[columnId]
      if (v != null && v !== '') values.add(String(v))
    })
    return Array.from(values).sort()
  }, [data, columnId])

  const filtered = searchTerm
    ? uniqueValues.filter((v) => v.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueValues

  const toggleValue = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Filtrar {label}</p>
      {uniqueValues.length > 5 && (
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      )}
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {filtered.map((val) => {
          const selected = value.includes(val)
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggleValue(val)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent',
                selected && 'bg-accent/50'
              )}
            >
              <div className={cn(
                'h-3.5 w-3.5 rounded-sm border border-primary flex items-center justify-center',
                selected ? 'bg-primary text-primary-foreground' : 'opacity-50'
              )}>
                {selected && <Check className="h-2.5 w-2.5" />}
              </div>
              <span className="truncate">{val}</span>
            </button>
          )
        })}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => onChange(uniqueValues)}>
          Todos
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onClear}>
          Ninguno
        </Button>
      </div>
    </div>
  )
}

/** Numeric range filter: min/max inputs */
function RangeColumnFilter({ value, onChange, onClear, label }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Filtrar {label}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          placeholder="Min"
          className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">-</span>
        <input
          type="number"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          placeholder="Max"
          className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {(value.min || value.max) && (
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={onClear}>
          <X className="h-3 w-3 mr-1" /> Limpiar
        </Button>
      )}
    </div>
  )
}

/**
 * Apply column filters to data client-side.
 * Returns filtered array.
 */
export function applyColumnFilters(data, columnFilters, columnDefs) {
  if (!data || !columnFilters || Object.keys(columnFilters).length === 0) return data

  return data.filter((row) => {
    for (const [columnId, filterValue] of Object.entries(columnFilters)) {
      if (filterValue == null || filterValue === '') continue
      if (Array.isArray(filterValue) && filterValue.length === 0) continue

      const cellValue = row[columnId]
      const colDef = columnDefs?.[columnId]
      const filterType = getFilterType(colDef?.type)

      if (filterType === 'text') {
        if (!String(cellValue || '').toLowerCase().includes(String(filterValue).toLowerCase())) {
          return false
        }
      } else if (filterType === 'select') {
        if (!filterValue.includes(String(cellValue ?? ''))) {
          return false
        }
      } else if (filterType === 'range') {
        const num = parseFloat(cellValue)
        if (isNaN(num)) return false
        if (filterValue.min !== '' && num < parseFloat(filterValue.min)) return false
        if (filterValue.max !== '' && num > parseFloat(filterValue.max)) return false
      }
    }
    return true
  })
}
