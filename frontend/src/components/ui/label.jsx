import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef(({ className, required, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium font-body leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
})
Label.displayName = 'Label'

export { Label }
