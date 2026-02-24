import { useEffect, useCallback, Children, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Custom Dialog component using React portals.
 * No Radix dependency — matches existing UI pattern (accordion.jsx).
 */

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  const close = () => onOpenChange(false)
  const enhanced = Children.map(children, child =>
    isValidElement(child) && child.type === DialogContent
      ? cloneElement(child, { onClose: child.props.onClose || close })
      : child
  )
  return createPortal(
    <div className="fixed inset-0 z-50">{enhanced}</div>,
    document.body
  )
}

function DialogOverlay({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
      onClick={onClose}
    />
  )
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[95vw]',
}

function DialogContent({ children, className, onClose, size = 'md' }) {
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

  return (
    <>
      <DialogOverlay onClose={onClose} />
      <div
        className={cn(
          `fixed left-1/2 top-1/2 z-50 w-full max-w-[calc(100vw-2rem)] ${SIZE_CLASSES[size] || SIZE_CLASSES.md} -translate-x-1/2 -translate-y-1/2`,
          'rounded-lg border border-border/50 bg-background p-4 sm:p-6 shadow-lg',
          'animate-in fade-in-0 zoom-in-[0.97]',
          className
        )}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>
    </>
  )
}

function DialogHeader({ children, className }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  )
}

function DialogTitle({ children, className }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight font-heading', className)}>
      {children}
    </h2>
  )
}

function DialogFooter({ children, className }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)}>
      {children}
    </div>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
