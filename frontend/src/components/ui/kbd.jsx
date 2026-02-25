import { cn } from '@/lib/utils'

/**
 * Styled keyboard shortcut badge.
 * Renders a <kbd> element with theme-aware styling.
 */
export function Kbd({ children, className, size = 'sm' }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded border border-border bg-muted font-mono font-medium text-muted-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]',
        size === 'sm' && 'min-w-[1.25rem] h-5 px-1 text-[10px]',
        size === 'md' && 'min-w-[1.5rem] h-6 px-1.5 text-[11px]',
        className
      )}
    >
      {children}
    </kbd>
  )
}
