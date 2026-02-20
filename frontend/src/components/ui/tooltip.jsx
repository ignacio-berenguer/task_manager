import { useState, createContext, useContext, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const TooltipContext = createContext({})

function TooltipProvider({ children, delayDuration = 200 }) {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  )
}

function Tooltip({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const { delayDuration } = useContext(TooltipContext)
  let timeoutId = null

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => setIsOpen(true), delayDuration || 200)
  }

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setIsOpen(false)
  }

  return (
    <TooltipItemContext.Provider value={{ isOpen, handleMouseEnter, handleMouseLeave }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipItemContext.Provider>
  )
}

const TooltipItemContext = createContext({})

const TooltipTrigger = forwardRef(({ children, asChild, ...props }, ref) => {
  const { handleMouseEnter, handleMouseLeave } = useContext(TooltipItemContext)

  if (asChild) {
    return (
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        {...props}
      >
        {children}
      </span>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
})
TooltipTrigger.displayName = 'TooltipTrigger'

const TooltipContent = forwardRef(
  ({ children, className, side = 'top', sideOffset = 4, ...props }, ref) => {
    const { isOpen } = useContext(TooltipItemContext)

    if (!isOpen) return null

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          'absolute z-50 overflow-hidden rounded-md border border-border/50 bg-popover px-3 py-1.5 text-xs font-body text-popover-foreground shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          positionClasses[side],
          className
        )}
        style={{ marginTop: side === 'bottom' ? sideOffset : undefined }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
