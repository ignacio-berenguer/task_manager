import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

const GROUP_OPTIONS = [
  { value: '', label: 'Sin agrupar' },
  { value: 'estado_iniciativa', label: 'Estado' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'cluster', label: 'Cluster' },
  { value: 'digital_framework_level_1', label: 'Digital Framework' },
  { value: 'tipo', label: 'Tipo' },
]

/**
 * Dropdown to select a group-by field for the DataGrid.
 */
export function GroupBySelector({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1.5">
      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={cn(
          'h-8 rounded-md border border-input bg-background px-2 text-xs',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {GROUP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
