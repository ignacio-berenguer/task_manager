import { X } from 'lucide-react'

const FILTER_LABELS = {
  portfolioId: 'Portfolio ID',
  nombre: 'Nombre',
  digitalFramework: 'Digital Framework',
  unidad: 'Unidad',
  estado: 'Estado',
  estadoSm100: 'Estado SM100',
  estadoSm200: 'Estado SM200',
  iniciativaAprobada: 'Iniciativa Aprobada',
  cluster: 'Cluster',
  tipo: 'Tipo',
  etiquetas: 'Etiquetas',
  cerradaEconomicamente: 'Cerrada Econ.',
  activoEjercicioActual: 'Activo Ejercicio',
  includeCancelled: 'Excl. Canceladas',
}

function formatFilterValue(key, value) {
  // Handle includeCancelled boolean specially
  // Show chip when UNCHECKED (false) since that's when the exclusion filter is active
  if (key === 'includeCancelled') {
    return value === false ? 'Sí' : null
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    if (value.length <= 2) return value.join(', ')
    return `${value.length} seleccionados`
  }
  if (typeof value === 'string' && value.trim()) {
    return value.length > 30 ? value.slice(0, 30) + '...' : value
  }
  return null
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }) {
  const activeChips = Object.entries(filters)
    .map(([key, value]) => {
      const formatted = formatFilterValue(key, value)
      if (!formatted) return null
      return { key, label: FILTER_LABELS[key] || key, value: formatted }
    })
    .filter(Boolean)

  if (activeChips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {activeChips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
        >
          <span className="text-muted-foreground">{chip.label}:</span>
          <span>{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {activeChips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Limpiar todo
        </button>
      )}
    </div>
  )
}
