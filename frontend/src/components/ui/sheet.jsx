import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Side sheet/drawer component using React portals.
 * Slides in from the right (default) with overlay.
 */

function Sheet({ open, onOpenChange, children }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">{children}</div>,
    document.body
  )
}

function SheetOverlay({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 animate-in fade-in-0"
      onClick={onClose}
    />
  )
}

function SheetContent({ children, className, onClose, side = 'right' }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const sideClasses = {
    right: 'top-0 right-0 bottom-0 left-0 w-full h-full sm:left-auto sm:bottom-auto sm:w-[480px] sm:max-w-[90vw] sm:h-full sm:animate-in sm:slide-in-from-right',
    left: 'top-0 right-0 bottom-0 left-0 w-full h-full sm:right-auto sm:bottom-auto sm:w-[480px] sm:max-w-[90vw] sm:h-full sm:animate-in sm:slide-in-from-left',
    bottom: 'bottom-0 left-0 right-0 animate-in slide-in-from-bottom',
  }

  const borderClasses = side === 'bottom' ? 'border-t' : 'sm:border-l'

  return (
    <>
      <SheetOverlay onClose={onClose} />
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-background shadow-lg overflow-hidden',
          borderClasses,
          sideClasses[side] || sideClasses.right,
          className
        )}
      >
        {/* Mobile: visible close bar */}
        {side !== 'bottom' && (
          <div className="flex items-center border-b px-4 py-2 sm:hidden">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        )}
        {/* Desktop: subtle X button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-10 hidden sm:block"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  )
}

function SheetHeader({ children, className }) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      {children}
    </div>
  )
}

function SheetTitle({ children, className }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight font-heading', className)}>
      {children}
    </h2>
  )
}

export { Sheet, SheetContent, SheetHeader, SheetTitle }
