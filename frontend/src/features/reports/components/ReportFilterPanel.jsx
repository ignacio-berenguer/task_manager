import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { sortEstados } from '@/lib/estadoOrder'
import { ReportTemplates } from './ReportTemplates'

/**
 * Date range preset definitions
 */
const DATE_PRESETS = [
  {
    label: 'Últ. 7 días',
    getRange: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: 'Últ. 30 días',
    getRange: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: 'Este mes',
    getRange: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: 'Este trimestre',
    getRange: () => {
      const end = new Date()
      const qMonth = Math.floor(end.getMonth() / 3) * 3
      const start = new Date(end.getFullYear(), qMonth, 1)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: 'Este año',
    getRange: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), 0, 1)
      return { start: toISO(start), end: toISO(end) }
    },
  },
]

function toISO(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Date range preset buttons
 */
function DateRangePresets({ startKey, endKey, onFiltersChange, filters }) {
  const handlePreset = (preset) => {
    const { start, end } = preset.getRange()
    onFiltersChange({ ...filters, [startKey]: start, [endKey]: end })
  }

  return (
    <div className="col-span-full flex flex-wrap gap-1 -mt-2">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => handlePreset(preset)}
          className="px-2 py-0.5 text-xs rounded-full border border-border/50 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Generic filter panel for reports.
 *
 * @param {object} filters - Current filter values
 * @param {function} onFiltersChange - Callback when filters change
 * @param {function} onApply - Callback for search button
 * @param {function} onClear - Callback to clear all filters
 * @param {object} filterOptions - Available options from API (keyed by optionsKey)
 * @param {boolean} isLoading - Loading state
 * @param {Array} filterDefs - Filter definitions: [{key, label, type, optionsKey?, placeholder?, dateRangeGroup?}]
 *   type: 'date' | 'multiselect' | 'text' | 'number'
 * @param {string[]} dateFilterKeys - Keys to exclude from active filter count (defaults to date fields)
 */
export function ReportFilterPanel({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  filterOptions,
  isLoading,
  filterDefs = [],
  dateFilterKeys,
  templateProps,
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [focusedDate, setFocusedDate] = useState(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault()
        onClear()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClear])

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onApply()
    }
  }

  // Determine which keys to exclude from active filter count
  const excludeKeys = dateFilterKeys || filterDefs
    .filter((d) => d.type === 'date')
    .map((d) => d.key)

  const activeFilterCount = Object.keys(filters).filter((key) => {
    if (excludeKeys.includes(key)) return false
    const value = filters[key]
    return value && (Array.isArray(value) ? value.length > 0 : value)
  }).length

  // Identify date range groups for preset buttons
  const dateRangeGroups = useMemo(() => {
    const groups = {}
    filterDefs.forEach((def) => {
      if (def.type === 'date' && def.dateRangeGroup) {
        if (!groups[def.dateRangeGroup]) groups[def.dateRangeGroup] = []
        groups[def.dateRangeGroup].push(def.key)
      }
    })
    return groups
  }, [filterDefs])

  // Track which groups have had their presets rendered
  const renderedGroups = new Set()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative z-20 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 p-0 hover:bg-transparent">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">{activeFilterCount}</Badge>
            )}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <div className="flex flex-wrap items-center gap-2">
          {templateProps && (
            <ReportTemplates
              templates={templateProps.templates}
              onSave={templateProps.onSave}
              onLoad={templateProps.onLoad}
              onDelete={templateProps.onDelete}
            />
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">Enter para buscar</span>
          <Button size="sm" onClick={onApply} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
          {activeFilterCount > 0 && (
            <Button size="sm" variant="outline" onClick={onClear}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent>
        <div className="rounded-b-lg border border-border/50 bg-muted/30 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterDefs.map((def) => {
              if (def.type === 'date') {
                const hasValue = !!filters[def.key]
                const isFocused = focusedDate === def.key
                const group = def.dateRangeGroup
                const groupKeys = group ? dateRangeGroups[group] : null
                // Show presets after the last date input in a group
                const isLastInGroup = groupKeys && groupKeys[groupKeys.length - 1] === def.key
                const shouldShowPresets = isLastInGroup && !renderedGroups.has(group)
                if (shouldShowPresets) renderedGroups.add(group)

                return [
                  <div key={def.key} className="space-y-2">
                    <Label htmlFor={def.key}>{def.label}</Label>
                    <Input
                      id={def.key}
                      type={isFocused || hasValue ? 'date' : 'text'}
                      value={filters[def.key] || ''}
                      onFocus={() => setFocusedDate(def.key)}
                      onBlur={() => setFocusedDate(null)}
                      onChange={(e) => updateFilter(def.key, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                    />
                  </div>,
                  shouldShowPresets && (
                    <DateRangePresets
                      key={`presets-${group}`}
                      startKey={groupKeys[0]}
                      endKey={groupKeys[1]}
                      onFiltersChange={onFiltersChange}
                      filters={filters}
                    />
                  ),
                ]
              }

              if (def.type === 'multiselect') {
                let rawOptions = filterOptions?.[def.optionsKey] || []
                if (def.sortByEstado) {
                  rawOptions = sortEstados(rawOptions)
                }
                const options = rawOptions.map((opt) => ({
                  value: opt,
                  label: opt,
                }))
                return (
                  <div key={def.key} className="space-y-2">
                    <Label>{def.label}</Label>
                    <MultiSelect
                      options={options}
                      selected={filters[def.key] || []}
                      onChange={(value) => updateFilter(def.key, value)}
                      placeholder={def.placeholder || `Todos`}
                      searchable
                    />
                  </div>
                )
              }

              if (def.type === 'text') {
                return (
                  <div key={def.key} className="space-y-2">
                    <Label htmlFor={def.key}>{def.label}</Label>
                    <Input
                      id={def.key}
                      type="text"
                      value={filters[def.key] || ''}
                      onChange={(e) => updateFilter(def.key, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={def.placeholder || ''}
                    />
                  </div>
                )
              }

              if (def.type === 'number') {
                return (
                  <div key={def.key} className="space-y-2">
                    <Label htmlFor={def.key}>{def.label}</Label>
                    <Input
                      id={def.key}
                      type="number"
                      value={filters[def.key] || ''}
                      onChange={(e) => updateFilter(def.key, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={def.placeholder || ''}
                    />
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
