import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown, Star, PanelRightOpen, SearchX, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { getColumnDef, formatCellValue, COLUMN_TYPES } from '../utils/columnDefinitions'
import { RowActions } from './RowActions'
import { EmptyState } from '@/components/shared/EmptyState'
import { ColumnFilterButton, applyColumnFilters } from './ColumnFilter'

export function DataGrid({
  data,
  columns,
  isLoading,
  sortConfig,
  onSort,
  rowSelection,
  onRowSelectionChange,
  isFavorite,
  onToggleFavorite,
  onOpenDrawer,
  onOpenLtpModal,
  columnFilters,
  onColumnFilterChange,
  groupByField,
}) {
  // Stable refs to avoid re-creating column definitions on every filter change
  const columnFiltersRef = useRef(columnFilters)
  columnFiltersRef.current = columnFilters
  const onColumnFilterChangeRef = useRef(onColumnFilterChange)
  onColumnFilterChangeRef.current = onColumnFilterChange

  // Build column defs map for filter type resolution
  const columnDefsMap = useMemo(() => {
    const map = {}
    columns.forEach((colId) => { map[colId] = getColumnDef(colId) })
    return map
  }, [columns])

  // Apply client-side column filters
  const filteredData = useMemo(
    () => applyColumnFilters(data, columnFilters, columnDefsMap),
    [data, columnFilters, columnDefsMap]
  )

  // Row grouping
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())

  const groups = useMemo(() => {
    if (!groupByField || !filteredData) return null
    const map = new Map()
    for (const row of filteredData) {
      const key = String(row[groupByField] ?? '(vacío)')
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)
    }
    return map
  }, [groupByField, filteredData])

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Build column definitions for TanStack Table
  const tableColumns = useMemo(() => {
    // Checkbox select column
    const selectCol = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected()
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 40,
    }

    // Favorites star column
    const favCol = {
      id: 'favorite',
      header: () => <Star className="h-4 w-4 text-muted-foreground" />,
      cell: ({ row }) => {
        const pid = row.original.portfolio_id
        const isFav = isFavorite?.(pid)
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.(pid, row.original.nombre)
            }}
            className="p-0.5 rounded hover:bg-muted/50"
          >
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            />
          </button>
        )
      },
      size: 40,
    }

    // Quick-view drawer column
    const drawerCol = {
      id: 'drawer',
      header: () => <PanelRightOpen className="h-4 w-4 text-muted-foreground" />,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDrawer?.(row.original.portfolio_id)
              }}
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Vista rapida</TooltipContent>
        </Tooltip>
      ),
      size: 40,
    }

    const cols = columns.map((columnId) => {
      const colDef = getColumnDef(columnId)
      return {
        accessorKey: columnId,
        header: ({ column }) => {
          const isSorted = sortConfig?.field === columnId
          const direction = isSorted ? sortConfig.direction : null

          return (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => {
                  if (!isSorted) {
                    onSort({ field: columnId, direction: 'asc' })
                  } else if (direction === 'asc') {
                    onSort({ field: columnId, direction: 'desc' })
                  } else {
                    onSort({ field: null, direction: null })
                  }
                }}
              >
                <span className="truncate">{colDef.label}</span>
                {isSorted ? (
                  direction === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-30" />
                )}
              </button>
              {onColumnFilterChangeRef.current && (
                <ColumnFilterButton
                  columnId={columnId}
                  colDef={colDef}
                  filterValue={columnFiltersRef.current?.[columnId]}
                  onFilterChange={onColumnFilterChangeRef.current}
                  data={data}
                />
              )}
            </div>
          )
        },
        cell: ({ getValue, row }) => {
          const value = getValue()
          // Make portfolio_id a clickable link
          if (columnId === 'portfolio_id' && value) {
            return (
              <Link
                to={`/detail/${value}`}
                state={{ from: { route: '/search', label: 'Busqueda' } }}
                className="text-primary hover:underline font-medium"
              >
                {value}
              </Link>
            )
          }
          // Handle longtext columns - allow full display with word wrap
          if (colDef.type === 'longtext') {
            return (
              <span className="block whitespace-pre-wrap min-w-[150px] max-w-[400px]">
                {value || '-'}
              </span>
            )
          }
          if (colDef.type === COLUMN_TYPES.CURRENCY || colDef.type === 'currency') {
            return (
              <CurrencyCell
                value={value}
                formattedValue={formatCellValue(value, colDef.type)}
                className="truncate block max-w-[300px]"
              />
            )
          }
          if (colDef.type === COLUMN_TYPES.ESTADO) {
            return <EstadoTag value={value} />
          }
          return (
            <span className="truncate block max-w-[300px]" title={String(value || '')}>
              {formatCellValue(value, colDef.type)}
            </span>
          )
        },
      }
    })

    // Add actions column
    cols.push({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions portfolioId={row.original.portfolio_id} nombre={row.original.nombre} onOpenLtpModal={onOpenLtpModal} />,
      size: 80,
    })

    return [selectCol, favCol, drawerCol, ...cols]
  }, [columns, sortConfig, onSort, isFavorite, onToggleFavorite, onOpenDrawer, onOpenLtpModal, data])

  const table = useReactTable({
    data: filteredData || [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange,
    state: { rowSelection: rowSelection || {} },
    getRowId: (row) => row.portfolio_id,
  })

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted">
              <th className="p-3 w-10"></th>
              <th className="p-3 w-10"></th>
              <th className="p-3 w-10"></th>
              {columns.map((col) => (
                <th key={col} className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {getColumnDef(col).label}
                </th>
              ))}
              <th className="p-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns.length + 4} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description="No se encontraron iniciativas. Intente ajustar los filtros."
        />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="rounded-lg border overflow-auto max-h-[calc(100vh-20rem)]">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 bg-muted',
                    header.id === 'actions' && 'w-28',
                    header.id === 'select' && 'w-10',
                    header.id === 'favorite' && 'w-10',
                    header.id === 'drawer' && 'w-10'
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {groups ? (
            // Grouped rendering
            Array.from(groups.entries()).map(([groupKey, groupRows]) => {
              const isCollapsed = collapsedGroups.has(groupKey)
              const totalCols = tableColumns.length
              const groupRowIds = new Set(groupRows.map((r) => r.portfolio_id))
              const tableRows = table.getRowModel().rows.filter((r) => groupRowIds.has(r.id))
              return (
                <GroupSection
                  key={groupKey}
                  groupKey={groupKey}
                  rowCount={groupRows.length}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleGroup(groupKey)}
                  totalCols={totalCols}
                  groupByField={groupByField}
                  columnDefsMap={columnDefsMap}
                >
                  {tableRows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-border/50 transition-colors hover:bg-accent/50',
                        row.getIsSelected() ? 'bg-primary/5' : 'bg-background'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </GroupSection>
              )
            })
          ) : (
            // Flat rendering
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/50 transition-colors hover:bg-accent/50',
                  row.getIsSelected() ? 'bg-primary/5' : 'bg-background'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}

/** Group header + collapsible children rows */
function GroupSection({ groupKey, rowCount, isCollapsed, onToggle, totalCols, children }) {
  return (
    <>
      <tr
        className="border-b bg-muted/60 cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={onToggle}
      >
        <td colSpan={totalCols} className="p-2 px-3">
          <div className="flex items-center gap-2">
            {isCollapsed
              ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
            <span className="font-semibold text-sm">{groupKey}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({rowCount} {rowCount === 1 ? 'iniciativa' : 'iniciativas'})
            </span>
          </div>
        </td>
      </tr>
      {!isCollapsed && children}
    </>
  )
}
