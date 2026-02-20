import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SortableColumnItem({ id, label, onRemove, isOnly }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border bg-background text-sm',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate">{label}</span>
      {!isOnly && (
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(id)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
