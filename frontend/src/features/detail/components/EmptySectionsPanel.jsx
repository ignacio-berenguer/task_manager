import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Summary panel for sections without data.
 * Shows section names with optional "Añadir" create buttons for CRUD-enabled entities.
 */
export function EmptySectionsPanel({ emptySections, onCreateAction }) {
  if (emptySections.length === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4" id="secciones-sin-datos">
      <h3 className="text-sm font-semibold font-heading text-muted-foreground mb-3">
        Secciones sin datos
      </h3>
      <div className="flex flex-wrap gap-2">
        {emptySections.map((section) => (
          <div
            key={section.id}
            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground"
          >
            <span>{section.title}</span>
            {section.crudAction && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-0.5"
                onClick={() => onCreateAction(section.id)}
                title={`Añadir ${section.title}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
