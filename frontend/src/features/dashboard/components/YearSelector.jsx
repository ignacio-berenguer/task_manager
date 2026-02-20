import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const YEARS = [2025, 2026, 2027, 2028]

/**
 * Year selector dropdown (single select)
 */
export function YearSelector({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (year) => {
    onChange(year)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        Ano
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-[100px] items-center justify-between rounded-md border border-input',
          'bg-background px-3 py-2 text-sm',
          'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        <span>{value}</span>
        <ChevronDown className={cn('ml-2 h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {YEARS.map((year) => (
            <div
              key={year}
              onClick={() => handleSelect(year)}
              className={cn(
                'cursor-pointer rounded-sm px-2 py-1.5 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                value === year && 'bg-accent'
              )}
            >
              {year}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
