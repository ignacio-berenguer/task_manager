import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Multi-select dropdown component with checkboxes
 */
export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Seleccionar...',
  searchable = false,
  className,
  label,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAllSelected = selected.includes('ALL') || selected.length === options.length

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange(['ALL'])
    }
  }

  const handleToggleOption = (value) => {
    let newSelected
    if (selected.includes('ALL')) {
      // Switching from ALL to specific selection
      newSelected = options
        .map((o) => o.value)
        .filter((v) => v !== value)
    } else if (selected.includes(value)) {
      // Deselect
      newSelected = selected.filter((v) => v !== value)
    } else {
      // Select
      newSelected = [...selected, value]
      // If all are now selected, switch to ALL
      if (newSelected.length === options.length) {
        newSelected = ['ALL']
      }
    }
    onChange(newSelected)
  }

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder
    if (isAllSelected) return 'Todos'
    if (selected.length === 1) {
      const option = options.find((o) => o.value === selected[0])
      return option?.label || selected[0]
    }
    return `${selected.length} seleccionados`
  }

  const isOptionSelected = (value) => {
    return isAllSelected || selected.includes(value)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full min-w-[140px] items-center justify-between rounded-md border border-input',
          'bg-background px-3 py-2 text-sm font-body dark:bg-muted/20',
          'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border bg-popover p-1 shadow-md">
          {searchable && (
            <div className="flex items-center border-b px-2 pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="ml-1">
                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          )}

          <div className="max-h-60 overflow-auto">
            {/* Select All option */}
            <div
              onClick={handleToggleAll}
              className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                isAllSelected && 'bg-accent/50'
              )}
            >
              <div className={cn(
                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                isAllSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'
              )}>
                {isAllSelected && <Check className="h-3 w-3" />}
              </div>
              <span className="font-medium">Todos</span>
            </div>

            <div className="my-1 h-px bg-border" />

            {/* Options */}
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleToggleOption(option.value)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  isOptionSelected(option.value) && 'bg-accent/50'
                )}
              >
                <div className={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  isOptionSelected(option.value) ? 'bg-primary text-primary-foreground' : 'opacity-50'
                )}>
                  {isOptionSelected(option.value) && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate">{option.label}</span>
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="py-2 text-center text-sm text-muted-foreground">
                No hay opciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
