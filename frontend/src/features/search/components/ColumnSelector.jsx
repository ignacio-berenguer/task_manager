import { useState } from 'react'
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
import { ALL_COLUMNS, getColumnCategories, getColumnsByCategory } from '../utils/columnDefinitions'
import { DEFAULT_COLUMNS } from '../utils/searchStorage'

export function ColumnSelector({
  selectedColumns,
  onColumnsChange,
  onReset,
}) {
  const categories = getColumnCategories()

  const isSelected = (columnId) => selectedColumns.includes(columnId)

  const toggleColumn = (columnId) => {
    if (isSelected(columnId)) {
      onColumnsChange(selectedColumns.filter((id) => id !== columnId))
    } else {
      onColumnsChange([...selectedColumns, columnId])
    }
  }

  const selectAll = () => {
    onColumnsChange(ALL_COLUMNS.map((col) => col.id))
  }

  const selectNone = () => {
    onColumnsChange(['portfolio_id']) // Keep at least portfolio_id
  }

  const handleReset = () => {
    onReset?.()
    onColumnsChange(DEFAULT_COLUMNS)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columnas
          <Badge variant="secondary" size="sm">
            {selectedColumns.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
        <div className="flex gap-1 p-2">
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={selectAll}>
            Seleccionar Todo
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={selectNone}>
            Ninguno
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        <DropdownMenuSeparator />

        {categories.map((category) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
              {category}
            </DropdownMenuLabel>
            {getColumnsByCategory(category).map((column) => (
              <DropdownMenuItem
                key={column.id}
                onSelect={() => toggleColumn(column.id)}
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
