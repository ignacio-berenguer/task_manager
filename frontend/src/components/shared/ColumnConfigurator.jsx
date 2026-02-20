import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Settings2, RotateCcw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { SortableColumnItem } from './SortableColumnItem'

/**
 * Column configurator dialog with drag-and-drop reordering.
 *
 * @param {string[]} selectedColumns - Ordered array of visible column IDs
 * @param {function} onColumnsChange - Callback with new ordered array
 * @param {function} onReset - Reset to defaults
 * @param {Array} allColumns - All available columns [{id, label, category}]
 * @param {string[]} defaultColumns - Default column IDs (for reset)
 * @param {string} [triggerLabel="Columnas"] - Button label
 */
export function ColumnConfigurator({
  selectedColumns,
  onColumnsChange,
  onReset,
  allColumns,
  defaultColumns,
  triggerLabel = 'Columnas',
}) {
  const [open, setOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Build a lookup map for column metadata
  const columnMap = useMemo(() => {
    const map = {}
    allColumns.forEach((col) => { map[col.id] = col })
    return map
  }, [allColumns])

  // Group available columns by category (preserving definition order)
  const categoryGroups = useMemo(() => {
    const groups = []
    const seen = new Set()
    for (const col of allColumns) {
      const cat = col.category || 'Otros'
      if (!seen.has(cat)) {
        seen.add(cat)
        groups.push({
          label: cat,
          columns: allColumns.filter((c) => (c.category || 'Otros') === cat),
        })
      }
    }
    return groups
  }, [allColumns])

  const selectedSet = useMemo(() => new Set(selectedColumns), [selectedColumns])

  const getLabel = (id) => columnMap[id]?.label || id

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = selectedColumns.indexOf(active.id)
    const newIndex = selectedColumns.indexOf(over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onColumnsChange(arrayMove(selectedColumns, oldIndex, newIndex))
  }

  const handleRemove = (columnId) => {
    if (selectedColumns.length <= 1) return
    onColumnsChange(selectedColumns.filter((id) => id !== columnId))
  }

  const handleToggle = (columnId) => {
    if (selectedSet.has(columnId)) {
      if (selectedColumns.length <= 1) return
      onColumnsChange(selectedColumns.filter((id) => id !== columnId))
    } else {
      onColumnsChange([...selectedColumns, columnId])
    }
  }

  const handleReset = () => {
    onReset?.()
    onColumnsChange([...defaultColumns])
  }

  const extraCount = selectedColumns.filter((id) => !defaultColumns.includes(id)).length

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Settings2 className="h-4 w-4" />
        {triggerLabel}
        <Badge variant="secondary" size="sm">
          {selectedColumns.length}
        </Badge>
        {extraCount > 0 && (
          <Badge variant="secondary" size="sm">+{extraCount}</Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" onClose={() => setOpen(false)} className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Configurar Columnas</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* Visible columns - sortable */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                Columnas Visibles ({selectedColumns.length})
              </h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedColumns}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {selectedColumns.map((columnId) => (
                      <SortableColumnItem
                        key={columnId}
                        id={columnId}
                        label={getLabel(columnId)}
                        onRemove={handleRemove}
                        isOnly={selectedColumns.length === 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Available columns - grouped by category */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                Columnas Disponibles
              </h3>
              <div className="space-y-1">
                {categoryGroups.map((group) => (
                  <Collapsible key={group.label}>
                    <CollapsibleTrigger className="flex items-center gap-1 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50">
                      <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
                      <span>{group.label}</span>
                      <span className="text-xs ml-auto">
                        {group.columns.filter((c) => selectedSet.has(c.id)).length}/{group.columns.length}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-5 space-y-0.5 py-1">
                        {group.columns.map((col) => (
                          <label
                            key={col.id}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-muted/50',
                              selectedSet.has(col.id) && 'text-foreground',
                              !selectedSet.has(col.id) && 'text-muted-foreground'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSet.has(col.id)}
                              onChange={() => handleToggle(col.id)}
                              className="rounded border-input"
                              disabled={selectedSet.has(col.id) && selectedColumns.length === 1}
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t mt-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar por defecto
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
