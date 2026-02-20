import { useState, createContext, useContext, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const CollapsibleContext = createContext({})

function Collapsible({ children, open: controlledOpen, onOpenChange, defaultOpen = false, className, ...props }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = (value) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <CollapsibleContext.Provider value={{ isOpen, setOpen }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

const CollapsibleTrigger = forwardRef(({ children, className, asChild, ...props }, ref) => {
  const { isOpen, setOpen } = useContext(CollapsibleContext)

  const handleClick = () => setOpen(!isOpen)

  if (asChild) {
    return (
      <span
        ref={ref}
        onClick={handleClick}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('cursor-pointer', className)}
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
      onClick={handleClick}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

const CollapsibleContent = forwardRef(({ children, className, ...props }, ref) => {
  const { isOpen } = useContext(CollapsibleContext)

  // Only use overflow-hidden when closed to allow dropdowns to render properly when open
  return (
    <div
      ref={ref}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'transition-all',
        !isOpen && 'overflow-hidden h-0',
        isOpen ? 'animate-collapsible-down' : 'animate-collapsible-up',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
