import { formatCurrencyFull } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

/**
 * Currency cell that displays a formatted k€ value with a tooltip showing
 * the full-precision value (e.g., "1.500.000,00 €") on hover.
 *
 * @param {number|string} value - Raw numeric value from database
 * @param {string} formattedValue - Already formatted display string (e.g., "1.500 k€")
 * @param {string} className - Optional CSS class for the wrapper span
 */
export function CurrencyCell({ value, formattedValue, className = '' }) {
  const fullValue = formatCurrencyFull(value)

  if (!fullValue) {
    return <span className={className}>{formattedValue}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`cursor-default ${className}`}>{formattedValue}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {fullValue}
      </TooltipContent>
    </Tooltip>
  )
}
