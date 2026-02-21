import { useState, createContext, useContext, forwardRef, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const PopoverContext = createContext({})

function Popover({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={popoverRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = forwardRef(({ children, asChild, className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useContext(PopoverContext)

  const handleClick = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  if (asChild) {
    return (
      <span ref={ref} onClick={handleClick} className={className} {...props}>
        {children}
      </span>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = 'PopoverTrigger'

const PopoverContent = forwardRef(
  ({ children, className, align = 'start', sideOffset = 4, ...props }, ref) => {
    const { isOpen } = useContext(PopoverContext)

    if (!isOpen) return null

    const alignClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[12rem] overflow-hidden rounded-md border border-border/50 bg-popover p-3 text-popover-foreground shadow-md',
          'top-full',
          'animate-in fade-in-0 slide-in-from-top-1',
          alignClasses[align],
          className
        )}
        style={{ marginTop: sideOffset }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
