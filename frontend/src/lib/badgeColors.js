/**
 * Shared badge color constants for transacciones tables.
 * Used across Detail page sections and Report pages.
 */

import { createElement } from 'react'

export const TIPO_CAMBIO_COLORS = {
  ALTA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MODIFICACION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  BAJA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const ESTADO_CAMBIO_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EJECUTADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const TIPO_OPERACION_COLORS = {
  INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const ESTADO_DB_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EJECUTADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  NO_APLICA: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
}

/**
 * Inline badge component used across transacciones tables.
 */
export function TransactionBadge({ children, className = '' }) {
  return createElement(
    'span',
    { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}` },
    children
  )
}

/**
 * Color classes for etiquetas destacadas badges and parametros color assignments.
 */
export const ETIQUETA_DESTACADA_COLORS = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  lime: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function getBadgeColorClass(color) {
  return ETIQUETA_DESTACADA_COLORS[color] || ETIQUETA_DESTACADA_COLORS.blue
}

/**
 * Reusable color palette for color selector dropdowns.
 */
export const COLOR_PALETTE = [
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'purple', label: 'Morado' },
  { value: 'orange', label: 'Naranja' },
  { value: 'red', label: 'Rojo' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'pink', label: 'Rosa' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'teal', label: 'Teal' },
  { value: 'cyan', label: 'Cian' },
  { value: 'amber', label: 'Ambar' },
  { value: 'lime', label: 'Lima' },
  { value: 'rose', label: 'Rosado' },
  { value: 'slate', label: 'Pizarra' },
  { value: 'emerald', label: 'Esmeralda' },
  { value: 'violet', label: 'Violeta' },
  { value: 'gray', label: 'Gris' },
]
