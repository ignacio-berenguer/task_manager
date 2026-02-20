import { Settings2, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

/**
 * Column selector dropdown for reports.
 *
 * @param {string[]} selectedColumns - Currently selected column IDs
 * @param {function} onColumnsChange - Callback when columns change
 * @param {function} onReset - Callback to reset columns
 * @param {Array} reportColumns - Primary report columns [{id, label, category}]
 * @param {Array} additionalColumns - Additional available columns [{id, label, category}]
 * @param {string[]} defaultColumns - Default column IDs for badge count
 */
export function ReportColumnSelector({
  selectedColumns,
  onColumnsChange,
  onReset,
  reportColumns = [],
  additionalColumns = [],
  defaultColumns = [],
}) {
  const allColumns = [...reportColumns, ...additionalColumns]

  // Build column groups by category
  const columnGroups = []
  const seenCategories = new Set()

  // Report columns grouped by category
  for (const col of reportColumns) {
    if (!seenCategories.has(col.category)) {
      seenCategories.add(col.category)
      columnGroups.push({
        label: col.category,
        columns: reportColumns.filter((c) => c.category === col.category),
      })
    }
  }

  // Additional columns grouped by category
  const additionalCategories = new Set()
  for (const col of additionalColumns) {
    if (!additionalCategories.has(col.category)) {
      additionalCategories.add(col.category)
      columnGroups.push({
        label: col.category,
        columns: additionalColumns.filter((c) => c.category === col.category),
      })
    }
  }

  const additionalSelectedCount = selectedColumns.filter(
    (id) => !defaultColumns.includes(id)
  ).length

  const isSelected = (columnId) => selectedColumns.includes(columnId)

  const toggleColumn = (columnId) => {
    if (isSelected(columnId)) {
      if (selectedColumns.length <= 1) return
      onColumnsChange(selectedColumns.filter((id) => id !== columnId))
    } else {
      onColumnsChange([...selectedColumns, columnId])
    }
  }

  const handleReset = () => {
    onReset?.()
    onColumnsChange(defaultColumns)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columnas
          {additionalSelectedCount > 0 && (
            <Badge variant="secondary" size="sm">+{additionalSelectedCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
        <div className="flex gap-1 p-2">
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar por defecto
          </Button>
        </div>
        <DropdownMenuSeparator />

        {columnGroups.map((group) => (
          <div key={group.label}>
            <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
              {group.label}
            </DropdownMenuLabel>
            {group.columns.map((column) => (
              <DropdownMenuItem
                key={column.id}
                onSelect={(e) => {
                  e.preventDefault()
                  toggleColumn(column.id)
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    isSelected(column.id) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{column.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
