import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (EUR)
 */
export function formatCurrency(value, decimals = 0) {
  if (value == null || isNaN(value)) return '€0'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a large number with K/M/B suffixes
 */
export function formatCompactNumber(value) {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}

/**
 * Format importe in k€ or M€ depending on magnitude.
 * Uses M€ (1 decimal) for values >= 10M EUR, k€ (no decimals) otherwise.
 */
export function formatImporte(value) {
  if (value == null || isNaN(value)) return '0 k€'
  const absValue = Math.abs(value)
  if (absValue >= 10_000_000) {
    const mValue = value / 1_000_000
    return `${mValue.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€`
  }
  const kValue = value / 1000
  return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`
}

/**
 * Format a currency value with full precision for tooltip display.
 * Returns "1.500.000,00 €" format, or null if value is not numeric.
 */
export function formatCurrencyFull(value) {
  if (value === null || value === undefined || value === '') return null
  const numValue = Number(value)
  if (isNaN(numValue)) return null
  return `${numValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/**
 * Format year without thousand separator
 */
export function formatYear(year) {
  return String(year)
}
