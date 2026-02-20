import { useState, useRef, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/style.css'
import './datepicker.css'

/**
 * Parse an ISO date string (YYYY-MM-DD) into a Date object in local time.
 */
function parseISO(isoStr) {
  if (!isoStr) return undefined
  const [y, m, d] = isoStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Format a Date object into DD/MM/YYYY display string.
 */
function formatDisplay(date) {
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
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

/**
 * DatePicker component with calendar popup.
 *
 * @param {object} props
 * @param {string} [props.value] - ISO date string (YYYY-MM-DD) or empty
 * @param {(isoDate: string) => void} props.onChange - Returns ISO string or ''
 * @param {string} [props.placeholder='Seleccione fecha']
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.id]
 * @param {string} [props.className]
 */
export function DatePicker({ value, onChange, placeholder = 'Seleccione fecha', disabled = false, id, className }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedDate = parseISO(value)

  const handleSelect = useCallback((date) => {
    if (date) {
      onChange(toISO(date))
    }
    setOpen(false)
  }, [onChange])

  const handleClear = useCallback((e) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }, [onChange])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {selectedDate ? formatDisplay(selectedDate) : placeholder}
        </span>
        {value && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            className="ml-1 shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-md border border-border/50 bg-background p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={es}
            defaultMonth={selectedDate}
          />
        </div>
      )}
    </div>
  )
}
