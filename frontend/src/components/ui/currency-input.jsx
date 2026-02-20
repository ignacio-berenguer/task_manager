import { useState, forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * Parse a Spanish-locale currency string to a raw float.
 * Handles: "1.234,56" → 1234.56, "1234.56" → 1234.56, "" → null
 */
function parseSpanishCurrency(str) {
  if (!str || str.trim() === '') return null
  // Remove all dots (thousands sep), replace comma with dot (decimal sep)
  const cleaned = str.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Format a number to Spanish locale currency display (no symbol).
 * 1234.56 → "1.234,56"
 */
function formatSpanishCurrency(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Currency input with Spanish locale formatting (dot thousands, comma decimals).
 * Stores raw numeric value. Shows formatted display when not focused.
 *
 * @param {object} props
 * @param {number|null} props.value - raw numeric value
 * @param {(value: number|null) => void} props.onChange - called with raw numeric value
 */
const CurrencyInput = forwardRef(({ value, onChange, className, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  const [displayValue, setDisplayValue] = useState(() =>
    value != null ? formatSpanishCurrency(value) : ''
  )

  const handleFocus = useCallback(() => {
    setFocused(true)
    // Show raw editable format on focus
    setDisplayValue(value != null ? formatSpanishCurrency(value) : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setFocused(false)
    const parsed = parseSpanishCurrency(displayValue)
    onChange?.(parsed)
    setDisplayValue(parsed != null ? formatSpanishCurrency(parsed) : '')
  }, [displayValue, onChange])

  const handleChange = useCallback((e) => {
    const raw = e.target.value
    // Allow digits, dots, commas, minus sign while typing
    if (/^-?[\d.,]*$/.test(raw) || raw === '') {
      setDisplayValue(raw)
    }
  }, [])

  // When value changes externally and not focused, update display
  const formattedExternal = value != null ? formatSpanishCurrency(value) : ''
  const shown = focused ? displayValue : formattedExternal

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={shown}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm font-body text-right',
          'ring-offset-background placeholder:text-muted-foreground dark:bg-muted/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
        €
      </span>
    </div>
  )
})
CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput, parseSpanishCurrency, formatSpanishCurrency }
