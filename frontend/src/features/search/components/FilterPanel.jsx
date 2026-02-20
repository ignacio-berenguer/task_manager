import { ChevronDown, ChevronUp, Filter, X, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from '@/components/ui/multi-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DIGITAL_FRAMEWORK_OPTIONS } from '../hooks/useFilterOptions'
import { createStorage } from '@/lib/storage'
import { SavedSearches } from './SavedSearches'

const panelStorage = createStorage('portfolio-search')

const PORTFOLIO_ID_PATTERN = /^(SPA_[\w][\w-]*|INDEDSPAIN-\d+)$/i

export const FilterPanel = forwardRef(function FilterPanel({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onLoadSearch,
  filterOptions,
  isLoading,
}, ref) {
  const [isOpen, setIsOpen] = useState(() => panelStorage.loadJSON('filterPanelOpen', true))
  const [invalidIds, setInvalidIds] = useState([])

  const handleOpenChange = (open) => {
    setIsOpen(open)
    panelStorage.saveJSON('filterPanelOpen', open)
  }
  const portfolioIdInputRef = useRef(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focusPortfolioId: () => {
      portfolioIdInputRef.current?.focus()
    }
  }))

  // Clear paste validation warning when portfolioId filter is emptied (e.g., via Limpiar)
  useEffect(() => {
    if (!filters.portfolioId && invalidIds.length > 0) {
      setInvalidIds([])
    }
  }, [filters.portfolioId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+X to clear filters
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault()
        onClear()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClear])

  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  // Handle Enter key in input fields
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onApply()
    }
  }

  // Handle paste in Portfolio ID field — normalize separators, deduplicate, and validate
  const handlePortfolioIdPaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const pastedIds = pastedText
      .replace(/[\n\r\t;|]+/g, ',')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const currentIds = (filters.portfolioId || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const mergedIds = [...new Set([...currentIds, ...pastedIds])]
    updateFilter('portfolioId', mergedIds.join(', '))

    // Validate pasted IDs against expected format
    const invalid = pastedIds.filter((id) => !PORTFOLIO_ID_PATTERN.test(id))
    setInvalidIds(invalid.length > 0 ? invalid : [])
  }

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] && (Array.isArray(filters[key]) ? filters[key].length > 0 : filters[key])
  ).length

  const digitalFrameworkOptions = DIGITAL_FRAMEWORK_OPTIONS.map((opt) => ({
    value: opt,
    label: opt,
  }))

  const unidadOptions = (filterOptions?.unidades || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const estadoOptions = (filterOptions?.estados || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const clusterOptions = (filterOptions?.clusters || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const tipoOptions = (filterOptions?.tipos || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const estadoSm100Options = (filterOptions?.estadosSm100 || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const estadoSm200Options = (filterOptions?.estadosSm200 || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const iniciativaAprobadaOptions = (filterOptions?.iniciativaAprobada || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const etiquetasOptions = (filterOptions?.etiquetas || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const cerradaEconOptions = (filterOptions?.cerradaEconomicamente || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  const activoEjercicioOptions = (filterOptions?.activoEjercicioActual || ['Si', 'No']).map((opt) => ({
    value: opt,
    label: opt,
  }))

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="relative z-20 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 p-0 hover:bg-transparent">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <div className="flex flex-wrap items-center gap-2">
          <SavedSearches filters={filters} onLoadSearch={onLoadSearch} />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Enter para buscar • Ctrl+Shift+X para limpiar
          </span>
          <Button size="sm" onClick={onApply} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Aplicar Filtros'}
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
            {/* Portfolio ID */}
            <div className="space-y-2">
              <Label htmlFor="portfolioId">Portfolio ID</Label>
              <Input
                ref={portfolioIdInputRef}
                id="portfolioId"
                placeholder="Introduzca ID o IDs (separados por comas)"
                value={filters.portfolioId || ''}
                onChange={(e) => {
                  updateFilter('portfolioId', e.target.value)
                  if (invalidIds.length > 0) setInvalidIds([])
                }}
                onPaste={handlePortfolioIdPaste}
                onKeyDown={handleKeyDown}
              />
              {invalidIds.length > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span>Los siguientes IDs no coinciden con el formato esperado de portfolio: </span>
                    <span className="font-medium">{invalidIds.join(', ')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvalidIds([])}
                    className="shrink-0 hover:text-amber-900 dark:hover:text-amber-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Buscar por nombre..."
                value={filters.nombre || ''}
                onChange={(e) => updateFilter('nombre', e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Digital Framework */}
            <div className="space-y-2">
              <Label>Digital Framework</Label>
              <MultiSelect
                options={digitalFrameworkOptions}
                selected={filters.digitalFramework || []}
                onChange={(value) => updateFilter('digitalFramework', value)}
                placeholder="Todos los frameworks"
                searchable
              />
            </div>

            {/* Unidad */}
            <div className="space-y-2">
              <Label>Unidad</Label>
              <MultiSelect
                options={unidadOptions}
                selected={filters.unidad || []}
                onChange={(value) => updateFilter('unidad', value)}
                placeholder="Todas las unidades"
                searchable
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado de la Iniciativa</Label>
              <MultiSelect
                options={estadoOptions}
                selected={filters.estado || []}
                onChange={(value) => updateFilter('estado', value)}
                placeholder="Todos los estados"
                searchable
              />
            </div>

            {/* Estado SM100 */}
            <div className="space-y-2">
              <Label>Estado SM100</Label>
              <MultiSelect
                options={estadoSm100Options}
                selected={filters.estadoSm100 || []}
                onChange={(value) => updateFilter('estadoSm100', value)}
                placeholder="Todos"
                searchable
              />
            </div>

            {/* Estado SM200 */}
            <div className="space-y-2">
              <Label>Estado SM200</Label>
              <MultiSelect
                options={estadoSm200Options}
                selected={filters.estadoSm200 || []}
                onChange={(value) => updateFilter('estadoSm200', value)}
                placeholder="Todos"
                searchable
              />
            </div>

            {/* Iniciativa Aprobada */}
            <div className="space-y-2">
              <Label>Iniciativa Aprobada</Label>
              <MultiSelect
                options={iniciativaAprobadaOptions}
                selected={filters.iniciativaAprobada || []}
                onChange={(value) => updateFilter('iniciativaAprobada', value)}
                placeholder="Todas"
                searchable
              />
            </div>

            {/* Cluster */}
            <div className="space-y-2">
              <Label>Cluster</Label>
              <MultiSelect
                options={clusterOptions}
                selected={filters.cluster || []}
                onChange={(value) => updateFilter('cluster', value)}
                placeholder="Todos los clusters"
                searchable
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <MultiSelect
                options={tipoOptions}
                selected={filters.tipo || []}
                onChange={(value) => updateFilter('tipo', value)}
                placeholder="Todos los tipos"
                searchable
              />
            </div>

            {/* Etiquetas */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <MultiSelect
                options={etiquetasOptions}
                selected={filters.etiquetas || []}
                onChange={(value) => updateFilter('etiquetas', value)}
                placeholder="Todas las etiquetas"
                searchable
              />
            </div>

            {/* Cerrada Económicamente */}
            <div className="space-y-2">
              <Label>Cerrada Econ.</Label>
              <MultiSelect
                options={cerradaEconOptions}
                selected={filters.cerradaEconomicamente || []}
                onChange={(value) => updateFilter('cerradaEconomicamente', value)}
                placeholder="Todas"
                searchable
              />
            </div>

            {/* Activo Ejercicio Actual */}
            <div className="space-y-2">
              <Label>Activo Ejercicio</Label>
              <MultiSelect
                options={activoEjercicioOptions}
                selected={filters.activoEjercicioActual || []}
                onChange={(value) => updateFilter('activoEjercicioActual', value)}
                placeholder="Todos"
                searchable
              />
            </div>
          </div>

          {/* Incluir Canceladas checkbox */}
          <div className="flex items-center space-x-2 pt-4 mt-4 border-t">
            <Checkbox
              id="includeCancelled"
              checked={filters.includeCancelled || false}
              onCheckedChange={(checked) => updateFilter('includeCancelled', checked)}
            />
            <label
              htmlFor="includeCancelled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Incluir Iniciativas Canceladas
            </label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})
