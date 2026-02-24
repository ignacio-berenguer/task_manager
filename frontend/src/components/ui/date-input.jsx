import { useCallback } from 'react'
import { DatePicker } from './datepicker'
import { Button } from './button'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Parse an ISO date string (YYYY-MM-DD) into a Date object in local time.
 */
function parseISO(isoStr) {
  if (!isoStr) return undefined
  const [y, m, d] = isoStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Format a Date object into ISO YYYY-MM-DD string.
 */
function toISO(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayISO() {
  return toISO(new Date())
}

/**
 * DateInput component — wraps DatePicker with +/- day adjustment buttons and keyboard accelerators.
 *
 * @param {object} props
 * @param {string} [props.value] - ISO date string (YYYY-MM-DD) or empty
 * @param {(isoDate: string) => void} props.onChange - Returns ISO string or ''
 * @param {string} [props.placeholder='Seleccione fecha']
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.id]
 * @param {string} [props.className]
 */
export function DateInput({ value, onChange, placeholder, disabled = false, id, className }) {
  const adjustDate = useCallback((delta) => {
    if (disabled) return
    const base = value ? parseISO(value) : new Date()
    base.setDate(base.getDate() + delta)
    onChange(toISO(base))
  }, [value, onChange, disabled])

  const handleKeyDown = useCallback((e) => {
    // Don't intercept typing in text inputs or textareas
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      adjustDate(1)
    } else if (e.key === '-') {
      e.preventDefault()
      adjustDate(-1)
    }
  }, [adjustDate])

  return (
    <div className={cn('flex items-center gap-1', className)} onKeyDown={handleKeyDown}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => adjustDate(-1)}
        className="h-10 w-10 shrink-0"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        id={id}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => adjustDate(1)}
        className="h-10 w-10 shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
