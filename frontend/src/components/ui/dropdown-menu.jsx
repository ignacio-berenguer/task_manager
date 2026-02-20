import { useState, createContext, useContext, forwardRef, useRef, useEffect, cloneElement, isValidElement, Children } from 'react'
import { cn } from '@/lib/utils'

const DropdownMenuContext = createContext({})

function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = forwardRef(({ children, asChild, className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useContext(DropdownMenuContext)

  const handleClick = () => setIsOpen(!isOpen)

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
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = forwardRef(
  ({ children, className, align = 'start', sideOffset = 4, ...props }, ref) => {
    const { isOpen, setIsOpen } = useContext(DropdownMenuContext)

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
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-border/50 bg-popover p-1 text-popover-foreground shadow-md',
          'top-full mt-1',
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
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = forwardRef(
  ({ children, className, disabled, onSelect, asChild, ...props }, ref) => {
    const { setIsOpen } = useContext(DropdownMenuContext)

    const handleClick = () => {
      if (disabled) return
      let shouldClose = true
      const event = { preventDefault: () => { shouldClose = false } }
      onSelect?.(event)
      if (shouldClose) setIsOpen(false)
    }

    const itemClassName = cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
      disabled && 'pointer-events-none opacity-50',
      className
    )

    if (asChild && isValidElement(children)) {
      const child = Children.only(children)
      return cloneElement(child, {
        ref,
        role: 'menuitem',
        onClick: (e) => {
          handleClick()
          child.props.onClick?.(e)
        },
        className: cn(itemClassName, child.props.className),
        ...props,
      })
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        onClick={handleClick}
        className={itemClassName}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

const DropdownMenuLabel = forwardRef(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold font-heading',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
