import { forwardRef, createContext, useContext, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const AccordionContext = createContext({})

const Accordion = forwardRef(
  ({ children, type = 'single', collapsible = false, defaultValue, value: controlledValue, onValueChange, className, ...props }, ref) => {
    const [internalOpenItems, setInternalOpenItems] = useState(() => {
      if (defaultValue) {
        return type === 'single' ? [defaultValue] : defaultValue
      }
      return []
    })

    const isControlled = controlledValue !== undefined
    const openItems = isControlled ? controlledValue : internalOpenItems

    const toggleItem = (value) => {
      const isOpen = openItems.includes(value)
      let next
      if (type === 'single') {
        if (isOpen && collapsible) next = []
        else if (isOpen) next = openItems
        else next = [value]
      } else {
        next = isOpen ? openItems.filter((v) => v !== value) : [...openItems, value]
      }
      if (isControlled) {
        onValueChange?.(next)
      } else {
        setInternalOpenItems(next)
      }
    }

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = 'Accordion'

const AccordionItem = forwardRef(({ children, value, className, ...props }, ref) => {
  const { openItems } = useContext(AccordionContext)
  const isOpen = openItems.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('border-b', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
})
AccordionItem.displayName = 'AccordionItem'

const AccordionItemContext = createContext({})

const AccordionTrigger = forwardRef(({ children, className, ...props }, ref) => {
  const { toggleItem } = useContext(AccordionContext)
  const { value, isOpen } = useContext(AccordionItemContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        'flex flex-1 w-full items-center justify-between py-4 font-medium font-heading transition-all',
        'hover:bg-muted/40 rounded-sm px-2 [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </button>
  )
})
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = forwardRef(({ children, className, ...props }, ref) => {
  const { isOpen } = useContext(AccordionItemContext)

  return (
    <div
      ref={ref}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden text-sm transition-all',
        isOpen ? 'animate-accordion-down' : 'animate-accordion-up hidden',
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
