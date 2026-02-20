import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Reusable empty state component for when there is no data to display.
 *
 * @param {object} props
 * @param {React.Component} [props.icon=Inbox] - Lucide icon component
 * @param {string} props.title - Primary message
 * @param {string} [props.description] - Secondary message
 * @param {{ label: string, onClick: () => void, variant?: string }} [props.action] - Optional action button
 * @param {boolean} [props.compact=false] - Compact variant for inline usage (drawers, accordions)
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-4 gap-1.5' : 'py-12 gap-3'}`}>
      <Icon className={`text-muted-foreground/50 ${compact ? 'h-8 w-8' : 'h-12 w-12'}`} />
      <p className={`font-semibold text-foreground ${compact ? 'text-base' : 'text-lg'}`}>
        {title}
      </p>
      {description && (
        <p className={`text-muted-foreground max-w-sm ${compact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'outline'}
          size={compact ? 'sm' : 'default'}
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
