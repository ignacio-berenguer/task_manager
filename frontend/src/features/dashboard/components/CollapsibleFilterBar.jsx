import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FilterBar } from './FilterBar'
import {
  saveFilterBarCollapsed,
  loadFilterBarCollapsed,
} from '../utils/filterStorage'

/**
 * Count active (non-default) filters
 */
function countActiveFilters(filters) {
  let count = 0
  const isMultiSelectActive = (val) =>
    Array.isArray(val) && !(val.length === 1 && val[0] === 'ALL')

  if (isMultiSelectActive(filters.digitalFramework)) count++
  if (isMultiSelectActive(filters.unidad)) count++
  if (isMultiSelectActive(filters.cluster)) count++
  if (isMultiSelectActive(filters.estado)) count++
  if (filters.previstasEsteAno && filters.previstasEsteAno !== 'Todos') count++
  if (filters.cerradaEconomicamente && filters.cerradaEconomicamente !== 'No') count++
  if (filters.excluirCanceladas === false) count++
  if (filters.excluirEPTs === false) count++

  return count
}

/**
 * Collapsible wrapper for the dashboard FilterBar
 */
export function CollapsibleFilterBar({
  filters,
  onFilterChange,
  onReset,
  unidadOptions,
  clusterOptions,
  estadoOptions,
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => loadFilterBarCollapsed())

  const activeCount = countActiveFilters(filters)

  const handleToggle = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    saveFilterBarCollapsed(next)
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          Filtros
          {isCollapsed && activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[500px] opacity-100 overflow-visible'
        }`}
      >
        <div className="pt-2">
          <FilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onReset}
            unidadOptions={unidadOptions}
            clusterOptions={clusterOptions}
            estadoOptions={estadoOptions}
          />
        </div>
      </div>
    </div>
  )
}
