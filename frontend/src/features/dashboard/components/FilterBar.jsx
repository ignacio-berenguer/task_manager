import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { YearSelector } from './YearSelector'

// Fixed options for Digital Framework
const DIGITAL_FRAMEWORK_OPTIONS = [
  { value: 'MANDATORY', label: 'Mandatory' },
  { value: 'BUSINESS IMPROVEMENT', label: 'Business Improvement' },
  { value: 'TLC', label: 'TLC' },
  { value: 'DISTRIBUTED SERVICES', label: 'Distributed Services' },
  { value: 'OPEX CAPITALIZATION', label: 'Opex Capitalization' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
]

/**
 * Filter bar component for dashboard
 */
export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  unidadOptions = [],
  clusterOptions = [],
  estadoOptions = [],
}) {
  const handleYearChange = (year) => {
    onFilterChange({ ...filters, year })
  }

  const handleDigitalFrameworkChange = (values) => {
    onFilterChange({ ...filters, digitalFramework: values })
  }

  const handleUnidadChange = (values) => {
    onFilterChange({ ...filters, unidad: values })
  }

  const handleClusterChange = (values) => {
    onFilterChange({ ...filters, cluster: values })
  }

  const handleEstadoChange = (values) => {
    onFilterChange({ ...filters, estado: values })
  }

  const handleToggle = (key) => (e) => {
    onFilterChange({ ...filters, [key]: e.target.checked })
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border/50 bg-muted/40 p-4">
      <YearSelector
        value={filters.year}
        onChange={handleYearChange}
      />

      <MultiSelect
        label="Framework"
        options={DIGITAL_FRAMEWORK_OPTIONS}
        selected={filters.digitalFramework}
        onChange={handleDigitalFrameworkChange}
        placeholder="Framework..."
        searchable
      />

      <MultiSelect
        label="Unidad"
        options={unidadOptions}
        selected={filters.unidad}
        onChange={handleUnidadChange}
        placeholder="Unidad..."
        searchable
      />

      <MultiSelect
        label="Cluster"
        options={clusterOptions}
        selected={filters.cluster}
        onChange={handleClusterChange}
        placeholder="Cluster..."
        searchable
      />

      <MultiSelect
        label="Estado"
        options={estadoOptions}
        selected={filters.estado || ['ALL']}
        onChange={handleEstadoChange}
        placeholder="Estado..."
        searchable
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="previstasEsteAno" className="text-sm font-medium whitespace-nowrap">
          Previstas este ano
        </label>
        <select
          id="previstasEsteAno"
          value={filters.previstasEsteAno || 'Todos'}
          onChange={(e) => onFilterChange({ ...filters, previstasEsteAno: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="Todos">Todos</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cerradaEconomicamente" className="text-sm font-medium whitespace-nowrap">
          Cerrada Econ.
        </label>
        <select
          id="cerradaEconomicamente"
          value={filters.cerradaEconomicamente || 'No'}
          onChange={(e) => onFilterChange({ ...filters, cerradaEconomicamente: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="Todos">Todos</option>
          <option value="Cerrado">Cerrado</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="flex items-center gap-2 h-9 self-end">
        <input
          type="checkbox"
          id="excluirCanceladas"
          checked={filters.excluirCanceladas ?? true}
          onChange={handleToggle('excluirCanceladas')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="excluirCanceladas" className="text-sm whitespace-nowrap cursor-pointer">
          Excluir Canceladas
        </label>
      </div>

      <div className="flex items-center gap-2 h-9 self-end">
        <input
          type="checkbox"
          id="excluirEPTs"
          checked={filters.excluirEPTs ?? true}
          onChange={handleToggle('excluirEPTs')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="excluirEPTs" className="text-sm whitespace-nowrap cursor-pointer">
          Excluir EPTs
        </label>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="h-9"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Resetear
      </Button>
    </div>
  )
}
