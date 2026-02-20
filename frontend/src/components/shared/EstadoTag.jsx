import { getEstadoColor } from '@/lib/estadoColors'
import { ETIQUETA_DESTACADA_COLORS } from '@/lib/badgeColors'

/**
 * Renders an estado value as a colored tag/badge.
 * Uses semantic colors based on the workflow stage.
 * Null/empty values render as plain "---" text.
 *
 * @param {string} value - The estado value to display
 * @param {string} className - Additional CSS classes
 * @param {Record<string, string>} colorMap - Optional map of value -> color key (from parametros).
 *   When provided and a match exists, uses ETIQUETA_DESTACADA_COLORS[colorKey].
 *   Falls back to getEstadoColor() otherwise.
 */
export function EstadoTag({ value, className = '', colorMap }) {
  if (!value) return <span className="text-muted-foreground">—</span>

  let colorClasses
  if (colorMap && colorMap[value] && ETIQUETA_DESTACADA_COLORS[colorMap[value]]) {
    colorClasses = ETIQUETA_DESTACADA_COLORS[colorMap[value]]
  } else {
    colorClasses = getEstadoColor(value)
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium min-w-[8.5rem] text-center ${colorClasses} ${className}`}
    >
      {value}
    </span>
  )
}
