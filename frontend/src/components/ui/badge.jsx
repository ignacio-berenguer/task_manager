import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
  variant: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input',
    success: 'bg-success text-white hover:bg-success/80',
    warning: 'bg-warning text-white hover:bg-warning/80',
  },
  size: {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-[10px]',
    lg: 'px-3 py-1 text-sm',
  },
}

const Badge = forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium font-body tracking-wide transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          badgeVariants.variant[variant],
          badgeVariants.size[size],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
