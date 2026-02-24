import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ColumnConfigurator } from '@/components/shared/ColumnConfigurator'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { AddAccionDialog, CambiarFechaDialog, CompleteAndScheduleDialog } from '@/features/shared/ActionDialogs'
import { formatDate } from '@/lib/formatDate'
import { createStorage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Search, X, Plus, ChevronDown, ChevronRight, PanelRightOpen, ListPlus, CalendarClock, CalendarDays, Filter, ClipboardCopy, Check, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import apiClient from '@/api/client'

const LOG = createLogger('Search')

const DEFAULT_COLUMNS = ['tarea_id', 'tarea', 'responsable', 'tema', 'estado', 'fecha_siguiente_accion']
const DEFAULT_PAGE_SIZE = 50

const ALL_COLUMNS = [
  { id: 'tarea_id', label: 'ID', category: 'Principal' },
  { id: 'tarea', label: 'Tarea', category: 'Principal' },
  { id: 'responsable', label: 'Responsable', category: 'Principal' },
  { id: 'tema', label: 'Tema', category: 'Principal' },
  { id: 'estado', label: 'Estado', category: 'Principal' },
  { id: 'fecha_siguiente_accion', label: 'Fecha Sig. Accion', category: 'Fechas' },
  { id: 'descripcion', label: 'Descripcion', category: 'Detalle' },
  { id: 'fecha_creacion', label: 'Creado', category: 'Fechas' },
  { id: 'fecha_actualizacion', label: 'Actualizado', category: 'Fechas' },
]

const COLUMN_LABELS = Object.fromEntries(ALL_COLUMNS.map(c => [c.id, c.label]))

const FILTERABLE_COLUMNS = ['tarea_id', 'tarea', 'responsable', 'tema', 'estado']

const FILTER_LABELS = { tarea_id: 'ID', tarea: 'Tarea', responsable: 'Responsable', tema: 'Tema', estado: 'Estado' }

const searchStorage = createStorage('search')

// Module-level cache: survives in-app navigation, clears on page refresh
let searchStateCache = null

// Format a Date object as YYYY-MM-DD using local timezone
const formatLocalDate = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

export default function SearchPage() {
  usePageTitle('Busqueda')
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarTareaRef = useRef(null)
  const mobileTareaRef = useRef(null)
  const filterBarRef = useRef(null)
  const [filterBarHeight, setFilterBarHeight] = useState(0)

  // Restore state from module-level cache (survives in-app navigation)
  if (searchStateCache) {
    LOG.debug('Restoring search state from cache')
  }

  const [filters, setFilters] = useState(() =>
    searchStateCache?.filters || {
      tarea_id: '',
      tarea: '',
      responsable: '',
      tema: '',
      estado: 'En Curso',
    }
  )
  const [results, setResults] = useState(() => searchStateCache?.results || null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(() => searchStateCache?.page || 0)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortField, setSortField] = useState(() => searchStateCache?.sortField || 'fecha_siguiente_accion')
  const [sortDir, setSortDir] = useState(() => searchStateCache?.sortDir || 'asc')
  const [filterOptions, setFilterOptions] = useState(null)
  const [columns, setColumns] = useState(() =>
    searchStorage.loadJSON('columns', DEFAULT_COLUMNS)
  )

  // Column filters (client-side)
  const [columnFilters, setColumnFilters] = useState(() => searchStateCache?.columnFilters || {})

  // Quick filters
  const [proximaSemana, setProximaSemana] = useState(() => searchStateCache?.proximaSemana || false)
  const [proximosDias, setProximosDias] = useState(() => searchStateCache?.proximosDias || false)

  // Ref that always holds latest state (avoids stale closures in unmount cleanup)
  const stateRef = useRef()
  stateRef.current = { filters, results, page, sortField, sortDir, columnFilters, proximaSemana, proximosDias }

  // Cached scroll position to restore after mount
  const cachedScrollTop = useRef(searchStateCache?.scrollTop || 0)

  // Save state to module-level cache on unmount
  useEffect(() => {
    return () => {
      searchStateCache = {
        ...stateRef.current,
        scrollTop: window.scrollY || 0,
      }
      LOG.debug('Search state saved to cache')
    }
  }, [])

  // Track filter bar height for dynamic sticky thead positioning
  useEffect(() => {
    const el = filterBarRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setFilterBarHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [results])

  // Restore scroll position after results are rendered
  useEffect(() => {
    if (cachedScrollTop.current && results) {
      const scrollTop = cachedScrollTop.current
      cachedScrollTop.current = 0
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollTop)
        LOG.debug('Restored scroll position:', scrollTop)
      })
    }
  }, [results])

  // Expanded rows (inline accordion)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const accionesCache = useRef(new Map())

  // Side drawer
  const [drawerTarea, setDrawerTarea] = useState(null)
  const [drawerAcciones, setDrawerAcciones] = useState([])
  const [drawerLoading, setDrawerLoading] = useState(false)

  // New tarea dialog
  const [newTareaOpen, setNewTareaOpen] = useState(false)
  const [newTareaForm, setNewTareaForm] = useState({ tarea: '', responsable: '', tema: '', estado: '' })
  const [newTareaLoading, setNewTareaLoading] = useState(false)

  // Action dialogs (shared components)
  const [addAccionTarget, setAddAccionTarget] = useState(null)
  const [cambiarFechaTarget, setCambiarFechaTarget] = useState(null)
  const [completeScheduleTarget, setCompleteScheduleTarget] = useState(null)

  // Fetch filter options on first load
  useEffect(() => {
    apiClient.get('/tareas/filter-options').then(res => {
      setFilterOptions(res.data)
    }).catch(err => LOG.error('Error loading filter options', err))
  }, [])

  const doSearch = useCallback(async (pageOverride = 0) => {
    setLoading(true)
    setColumnFilters({})
    try {
      const searchFilters = []
      if (filters.tarea_id) searchFilters.push({ field: 'tarea_id', operator: 'eq', value: Number(filters.tarea_id) })
      if (filters.tarea) searchFilters.push({ field: 'tarea', operator: 'ilike', value: `%${filters.tarea}%` })
      if (filters.responsable) searchFilters.push({ field: 'responsable', operator: 'eq', value: filters.responsable })
      if (filters.tema) searchFilters.push({ field: 'tema', operator: 'eq', value: filters.tema })
      if (filters.estado) searchFilters.push({ field: 'estado', operator: 'eq', value: filters.estado })

      if (proximosDias) {
        const today = new Date()
        const todayStr = formatLocalDate(today)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 1)
        const endStr = formatLocalDate(endDate)
        searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'gte', value: todayStr })
        searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'lte', value: endStr })
        LOG.debug('Quick filter Próximos 2 días: ON', { from: todayStr, to: endStr })
      } else if (proximaSemana) {
        const today = new Date()
        const todayStr = formatLocalDate(today)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 6)
        const endStr = formatLocalDate(endDate)
        searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'gte', value: todayStr })
        searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'lte', value: endStr })
        LOG.debug('Quick filter Próxima semana: ON', { from: todayStr, to: endStr })
      }

      const body = {
        filters: searchFilters,
        limit: pageSize,
        offset: pageOverride * pageSize,
      }
      if (sortField) {
        body.order_by = sortField
        body.order_dir = sortDir
      }

      const res = await apiClient.post('/tareas/search', body)
      setResults(res.data)
      setPage(pageOverride)
    } catch (err) {
      LOG.error('Search error', err)
    } finally {
      setLoading(false)
    }
  }, [filters, sortField, sortDir, pageSize, proximaSemana, proximosDias])

  // Auto-search on initial load (skip if results restored from cache)
  const initialSearchDone = useRef(!!searchStateCache?.results)
  useEffect(() => {
    if (filterOptions && !initialSearchDone.current) {
      initialSearchDone.current = true
      doSearch(0)
    }
  }, [filterOptions, doSearch])

  const clearFilters = () => {
    setFilters({ tarea_id: '', tarea: '', responsable: '', tema: '', estado: 'En Curso' })
    setProximaSemana(false)
    setProximosDias(false)
  }

  const toggleProximaSemana = () => {
    setProximaSemana(prev => !prev)
    setProximosDias(false)
  }

  const toggleProximosDias = () => {
    setProximosDias(prev => !prev)
    setProximaSemana(false)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Re-search when sort changes (only if we have results)
  useEffect(() => {
    if (results && sortField) {
      doSearch(0)
    }
  }, [sortField, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when quick filter toggles (only if we have results)
  const proximaSemanaInitialized = useRef(false)
  useEffect(() => {
    if (!proximaSemanaInitialized.current) {
      proximaSemanaInitialized.current = true
      return
    }
    if (results) {
      doSearch(0)
    }
  }, [proximaSemana]) // eslint-disable-line react-hooks/exhaustive-deps

  const proximosDiasInitialized = useRef(false)
  useEffect(() => {
    if (!proximosDiasInitialized.current) {
      proximosDiasInitialized.current = true
      return
    }
    if (results) {
      doSearch(0)
    }
  }, [proximosDias]) // eslint-disable-line react-hooks/exhaustive-deps

  // Column persistence
  const handleColumnsChange = (newCols) => {
    setColumns(newCols)
    searchStorage.saveJSON('columns', newCols)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        // Focus the visible input (sidebar on xl+, mobile otherwise)
        const sidebarEl = sidebarTareaRef.current
        if (sidebarEl && sidebarEl.offsetParent !== null) {
          sidebarEl.focus()
        } else {
          mobileTareaRef.current?.focus()
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setNewTareaOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Handle focusTareaInput from navigation state (e.g. Ctrl+Shift+F from DetailPage)
  useEffect(() => {
    if (location.state?.focusTareaInput) {
      setTimeout(() => {
        const sidebarEl = sidebarTareaRef.current
        if (sidebarEl && sidebarEl.offsetParent !== null) {
          sidebarEl.focus()
        } else {
          mobileTareaRef.current?.focus()
        }
      }, 100)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter keydown (Enter to search)
  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSearch(0)
    }
  }

  // Navigate to detail (state is saved automatically on unmount)
  const goToDetail = (tareaId) => {
    navigate(`/detail/${tareaId}`)
  }

  // Toggle expanded row
  const toggleExpand = async (tareaId) => {
    const next = new Set(expandedRows)
    if (next.has(tareaId)) {
      next.delete(tareaId)
    } else {
      next.add(tareaId)
      if (!accionesCache.current.has(tareaId)) {
        try {
          const res = await apiClient.get(`/acciones/tarea/${tareaId}`)
          accionesCache.current.set(tareaId, res.data)
        } catch (err) {
          LOG.error('Error fetching acciones for expand', err)
          accionesCache.current.set(tareaId, [])
        }
      }
    }
    setExpandedRows(next)
  }

  // Open side drawer
  const openDrawer = async (e, row) => {
    e.stopPropagation()
    setDrawerTarea(row)
    setDrawerLoading(true)
    try {
      const res = await apiClient.get(`/acciones/tarea/${row.tarea_id}`)
      const sorted = [...res.data].sort((a, b) => {
        if (!a.fecha_accion) return 1
        if (!b.fecha_accion) return -1
        return b.fecha_accion.localeCompare(a.fecha_accion)
      })
      setDrawerAcciones(sorted)
    } catch (err) {
      LOG.error('Error fetching acciones for drawer', err)
      setDrawerAcciones([])
    } finally {
      setDrawerLoading(false)
    }
  }

  // New tarea
  const handleNewTarea = async () => {
    if (!newTareaForm.tarea) return
    setNewTareaLoading(true)
    try {
      await apiClient.post('/tareas', newTareaForm)
      setNewTareaOpen(false)
      setNewTareaForm({ tarea: '', responsable: '', tema: '', estado: '' })
      doSearch(0)
    } catch (err) {
      LOG.error('Error creating tarea', err)
    } finally {
      setNewTareaLoading(false)
    }
  }

  // Client-side column filtering
  const filteredData = useMemo(() => {
    if (!results?.data) return []
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v)
    if (activeFilters.length === 0) return results.data
    return results.data.filter(row =>
      activeFilters.every(([key, value]) => {
        const cellValue = row[key] || ''
        return cellValue.toString().toLowerCase().includes(value.toLowerCase())
      })
    )
  }, [results?.data, columnFilters])

  const totalPages = results ? Math.ceil(results.total / pageSize) : 0

  // Active filter tags (server-side filters)
  const activeFilterTags = useMemo(() => {
    const fmtShort = (d) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0')
    const tags = Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, label: FILTER_LABELS[key], value }))
    if (proximosDias) {
      const today = new Date()
      const end = new Date(today)
      end.setDate(end.getDate() + 1)
      tags.push({ key: '_proximosDias', label: 'Proximos 2 dias', value: `${fmtShort(today)} - ${fmtShort(end)}` })
    }
    if (proximaSemana) {
      const today = new Date()
      const end = new Date(today)
      end.setDate(end.getDate() + 6)
      tags.push({ key: '_proximaSemana', label: 'Proxima semana', value: `${fmtShort(today)} - ${fmtShort(end)}` })
    }
    return tags
  }, [filters, proximaSemana, proximosDias])

  // Remove a single filter and re-search
  const removeFilterTag = useCallback((key) => {
    if (key === '_proximosDias') {
      setProximosDias(false)
      return
    }
    if (key === '_proximaSemana') {
      setProximaSemana(false)
      return
    }
    const next = { ...filters, [key]: '' }
    setFilters(next)
    // Need to search with the updated filters — use a ref-based approach
    // since doSearch depends on filters state which won't be updated yet.
    // We schedule a search via setTimeout(0) to run after state update.
    setTimeout(() => {}, 0)
  }, [filters])

  // Watch for filter removal to trigger search
  const prevFiltersRef = useRef(filters)
  useEffect(() => {
    const prev = prevFiltersRef.current
    prevFiltersRef.current = filters
    // If any filter was cleared (went from non-empty to empty), auto-search
    const wasCleared = Object.keys(filters).some(k => prev[k] && !filters[k])
    if (wasCleared && results) {
      doSearch(0)
    }
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render a cell value
  const renderCell = (row, col) => {
    const val = row[col]
    if (col === 'tarea_id') return <span className="text-xs text-muted-foreground font-mono">{val || '-'}</span>
    if (col === 'tarea') return <span className="font-medium">{val || '-'}</span>
    if (col === 'estado') return <EstadoBadge estado={val} />
    if (col === 'fecha_siguiente_accion' || col === 'fecha_creacion' || col === 'fecha_actualizacion') return formatDate(val)
    return val || '-'
  }

  // Clipboard export
  const [copying, setCopying] = useState(null)
  const exportToClipboard = async () => {
    if (!filteredData.length) return
    setCopying('loading')
    try {
      const accionesPromises = filteredData.map(async (row) => {
        if (accionesCache.current.has(row.tarea_id)) {
          return { tareaId: row.tarea_id, tarea: row.tarea, acciones: accionesCache.current.get(row.tarea_id) }
        }
        try {
          const res = await apiClient.get(`/acciones/tarea/${row.tarea_id}`)
          accionesCache.current.set(row.tarea_id, res.data)
          return { tareaId: row.tarea_id, tarea: row.tarea, acciones: res.data }
        } catch {
          return { tareaId: row.tarea_id, tarea: row.tarea, acciones: [] }
        }
      })
      const allAcciones = await Promise.all(accionesPromises)
      const lines = allAcciones.map(({ tarea, acciones }) => {
        const pending = acciones.filter(a => a.estado?.toLowerCase() === 'pendiente').map(a => a.accion)
        return pending.length > 0 ? `${tarea}: ${pending.join(' / ')}` : tarea
      })
      const text = lines.join('\n')
      await navigator.clipboard.writeText(text)
      LOG.info('Exported tasks to clipboard', { count: lines.length })
      toast.success(`${lines.length} tarea${lines.length !== 1 ? 's' : ''} copiada${lines.length !== 1 ? 's' : ''} al portapapeles`)
      setCopying('done')
      setTimeout(() => setCopying(null), 2000)
    } catch (err) {
      LOG.error('Error exporting to clipboard', err)
      toast.error('Error al copiar al portapapeles')
      setCopying(null)
    }
  }

  // Filter Panel (reused in sidebar and mobile accordion)
  const renderFilterPanel = (tareaRef) => (
    <div className="space-y-2" onKeyDown={handleFilterKeyDown}>
      <div className="space-y-2">
        <Input
          placeholder="ID Tarea"
          value={filters.tarea_id}
          onChange={e => setFilters(f => ({ ...f, tarea_id: e.target.value }))}
        />
        <Input
          ref={tareaRef}
          placeholder="Tarea (Ctrl+Shift+F)"
          value={filters.tarea}
          onChange={e => setFilters(f => ({ ...f, tarea: e.target.value }))}
        />
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.responsable}
          onChange={e => setFilters(f => ({ ...f, responsable: e.target.value }))}
        >
          <option value="">Responsable: Todos</option>
          {filterOptions?.responsables?.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.tema}
          onChange={e => setFilters(f => ({ ...f, tema: e.target.value }))}
        >
          <option value="">Tema: Todos</option>
          {filterOptions?.temas?.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.estado}
          onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
        >
          <option value="">Estado: Todos</option>
          {filterOptions?.estados?.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          variant={proximosDias ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={toggleProximosDias}
        >
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          2 dias
        </Button>
        <Button
          variant={proximaSemana ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={toggleProximaSemana}
        >
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          Semana
        </Button>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => doSearch(0)} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
    </div>
  )

  const filterPanel = renderFilterPanel(sidebarTareaRef)
  const mobileFilterPanel = renderFilterPanel(mobileTareaRef)

  return (
    <Layout>
      <div className="w-full px-4 py-6 xl:px-8">
        {/* Header (sticky) */}
        <div className="sticky top-16 z-30 -mx-4 xl:-mx-8 mb-6 flex items-center justify-between bg-background px-4 xl:px-8 py-3 border-b">
          <h1 className="text-2xl font-bold">Busqueda de Tareas</h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setNewTareaOpen(true)}>
                  <Plus className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Tarea</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+Shift+N</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters - xl+ */}
          <aside className="hidden xl:block w-72 shrink-0">
            <div className="sticky top-[8rem] max-h-[calc(100vh-9rem)] overflow-y-auto rounded-lg border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Filtros</h2>
              {filterPanel}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile/tablet filters - below xl */}
            <div className="xl:hidden mb-6 sticky top-[7.25rem] z-20 bg-background">
              <Accordion type="single" collapsible defaultValue="filters">
                <AccordionItem value="filters">
                  <AccordionTrigger className="rounded-lg border bg-card px-4">
                    Filtros
                  </AccordionTrigger>
                  <AccordionContent className="rounded-b-lg border border-t-0 bg-card px-4">
                    {mobileFilterPanel}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Results */}
            {results && (
              <div className="rounded-lg border bg-card" style={{ '--thead-top': `calc(7.25rem + ${filterBarHeight}px)` }}>
                <div ref={filterBarRef} className="flex flex-wrap items-center gap-2 border-b px-4 py-3 xl:sticky xl:top-[7.25rem] xl:z-20 bg-card xl:border-t xl:border-border xl:rounded-t-lg xl:-mt-px">
                  <span className="text-sm text-muted-foreground">
                    {results.total} resultado{results.total !== 1 ? 's' : ''}
                  </span>
                  {activeFilterTags.map(tag => (
                    <Badge key={tag.key} variant="outline" className="gap-1 pl-2 pr-1 py-0.5 text-xs">
                      <span className="text-muted-foreground">{tag.label}:</span>
                      <span>{tag.value}</span>
                      <button
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        onClick={() => removeFilterTag(tag.key)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="ml-auto flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={copying === 'loading' || !filteredData.length}
                          onClick={exportToClipboard}
                        >
                          {copying === 'done'
                            ? <Check className="h-4 w-4 text-green-500" />
                            : <ClipboardCopy className="h-4 w-4" />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copiar tareas al portapapeles</TooltipContent>
                    </Tooltip>
                    <ColumnConfigurator
                      selectedColumns={columns}
                      onColumnsChange={handleColumnsChange}
                      onReset={() => {}}
                      allColumns={ALL_COLUMNS}
                      defaultColumns={DEFAULT_COLUMNS}
                    />
                  </div>
                </div>
                <div className="max-xl:overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 xl:top-[var(--thead-top)] z-10 bg-card">
                      <tr className="border-b bg-muted">
                        <th className="w-8 px-2 py-3" />
                        <th className="w-8 px-2 py-3" />
                        {columns.map(col => (
                          <th
                            key={col}
                            className="cursor-pointer px-4 py-3 text-left font-medium hover:bg-muted"
                            onClick={() => handleSort(col)}
                          >
                            <div className="flex items-center gap-1">
                              <span>{COLUMN_LABELS[col] || col}</span>
                              {sortField === col && (
                                <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                              )}
                              {FILTERABLE_COLUMNS.includes(col) && (
                                <Popover>
                                  <PopoverTrigger className="p-0.5">
                                    <Filter className={cn(
                                      'h-4 w-4 ml-1',
                                      columnFilters[col] ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
                                    )} />
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="p-2 min-w-[10rem]">
                                    <div className="flex items-center gap-1">
                                      {col === 'estado' ? (
                                        <select
                                          autoFocus
                                          className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                                          value={columnFilters[col] || ''}
                                          onChange={e => setColumnFilters(f => ({ ...f, [col]: e.target.value }))}
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <option value="">Todos</option>
                                          {filterOptions?.estados?.map(e => (
                                            <option key={e} value={e}>{e}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <Input
                                          autoFocus
                                          className="h-8 text-xs"
                                          placeholder={`Filtrar ${COLUMN_LABELS[col]}...`}
                                          value={columnFilters[col] || ''}
                                          onChange={e => setColumnFilters(f => ({ ...f, [col]: e.target.value }))}
                                          onClick={e => e.stopPropagation()}
                                        />
                                      )}
                                      {columnFilters[col] && (
                                        <button
                                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                          onClick={(e) => { e.stopPropagation(); setColumnFilters(f => ({ ...f, [col]: '' })) }}
                                          title="Limpiar filtro"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="w-[110px] px-2 py-3 text-center font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length + 3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No se encontraron resultados con los filtros de columna aplicados.
                          </td>
                        </tr>
                      ) : filteredData.map(row => (
                        <RowWithExpand
                          key={row.tarea_id}
                          row={row}
                          columns={columns}
                          renderCell={renderCell}
                          expanded={expandedRows.has(row.tarea_id)}
                          onToggleExpand={() => toggleExpand(row.tarea_id)}
                          accionesCache={accionesCache}
                          onRowClick={() => goToDetail(row.tarea_id)}
                          onOpenDrawer={(e) => openDrawer(e, row)}
                          onAddAccion={() => setAddAccionTarget({ tarea_id: row.tarea_id })}
                          onCambiarFecha={() => setCambiarFechaTarget({ tarea_id: row.tarea_id, fecha_siguiente_accion: row.fecha_siguiente_accion })}
                          onCompleteSchedule={() => setCompleteScheduleTarget({ tarea_id: row.tarea_id })}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => doSearch(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Pagina {page + 1} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => doSearch(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side drawer */}
      <Sheet open={!!drawerTarea} onOpenChange={() => setDrawerTarea(null)}>
        <SheetContent onClose={() => setDrawerTarea(null)} side="right">
          {drawerTarea && (
            <>
              <SheetHeader>
                <p className="text-xs text-muted-foreground font-mono">{drawerTarea.tarea_id}</p>
                <SheetTitle className="text-lg font-semibold">{drawerTarea.tarea}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Responsable</span>
                    <p>{drawerTarea.responsable || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tema</span>
                    <p>{drawerTarea.tema || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado</span>
                    <div className="mt-1"><EstadoBadge estado={drawerTarea.estado} /></div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha Sig. Accion</span>
                    <p>{formatDate(drawerTarea.fecha_siguiente_accion)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Acciones</h4>
                  {drawerLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                  ) : drawerAcciones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin acciones.</p>
                  ) : (
                    <div className="space-y-1">
                      {drawerAcciones.map(acc => (
                        <div key={acc.id} className="rounded border px-2 py-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(acc.fecha_accion)}</span>
                            <span className="flex-1 truncate">{acc.accion}</span>
                            <EstadoBadge estado={acc.estado} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button className="w-full" variant="outline" onClick={() => { setDrawerTarea(null); goToDetail(drawerTarea.tarea_id) }}>
                  Ver Detalle Completo
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New tarea dialog */}
      <Dialog open={newTareaOpen} onOpenChange={setNewTareaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tarea *</label>
              <Input
                value={newTareaForm.tarea}
                onChange={e => setNewTareaForm(f => ({ ...f, tarea: e.target.value }))}
                placeholder="Nombre de la tarea"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Responsable</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={newTareaForm.responsable}
                onChange={e => setNewTareaForm(f => ({ ...f, responsable: e.target.value }))}
              >
                <option value="">-- Seleccionar --</option>
                {filterOptions?.responsables?.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Tema</label>
              <Input
                value={newTareaForm.tema}
                onChange={e => setNewTareaForm(f => ({ ...f, tema: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={newTareaForm.estado}
                onChange={e => setNewTareaForm(f => ({ ...f, estado: e.target.value }))}
              >
                <option value="">-- Seleccionar --</option>
                {filterOptions?.estados?.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTareaOpen(false)}>Cancelar</Button>
            <Button onClick={handleNewTarea} disabled={newTareaLoading || !newTareaForm.tarea}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Accion Dialog (shared) */}
      <AddAccionDialog
        open={!!addAccionTarget}
        onOpenChange={(open) => { if (!open) setAddAccionTarget(null) }}
        tareaId={addAccionTarget?.tarea_id}
        onSuccess={() => doSearch(page)}
      />

      {/* Cambiar Fecha Dialog (shared) */}
      <CambiarFechaDialog
        open={!!cambiarFechaTarget}
        onOpenChange={(open) => { if (!open) setCambiarFechaTarget(null) }}
        tareaId={cambiarFechaTarget?.tarea_id}
        currentFecha={cambiarFechaTarget?.fecha_siguiente_accion}
        onSuccess={() => doSearch(page)}
      />

      {/* Complete & Schedule Dialog (shared) */}
      <CompleteAndScheduleDialog
        open={!!completeScheduleTarget}
        onOpenChange={(open) => { if (!open) setCompleteScheduleTarget(null) }}
        tareaId={completeScheduleTarget?.tarea_id}
        onSuccess={() => doSearch(page)}
      />
    </Layout>
  )
}

// Row component with expand/collapse
function RowWithExpand({ row, columns, renderCell, expanded, onToggleExpand, accionesCache, onRowClick, onOpenDrawer, onAddAccion, onCambiarFecha, onCompleteSchedule }) {
  const cachedAcciones = accionesCache.current.get(row.tarea_id) || []

  return (
    <>
      <tr
        className="cursor-pointer border-b hover:bg-muted/50"
        onClick={onRowClick}
      >
        <td className="px-2 py-3">
          <button
            className="rounded p-1.5 hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
            title="Expandir detalle"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-2 py-3">
          <button
            className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={onOpenDrawer}
            title="Vista rapida"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </td>
        {columns.map(col => (
          <td key={col} className="px-4 py-3">
            {renderCell(row, col)}
          </td>
        ))}
        <td className="px-2 py-3 text-center">
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); onAddAccion?.() }}
                >
                  <ListPlus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Añadir Accion</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); onCompleteSchedule?.() }}
                >
                  <ListChecks className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Completar y Programar Siguiente</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); onCambiarFecha?.() }}
                >
                  <CalendarClock className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Cambiar Fecha Siguiente Accion</TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={columns.length + 3} className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="space-y-3">
              {row.descripcion && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Descripcion</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{row.descripcion}</p>
                </div>
              )}
              {row.notas_anteriores && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Notas Anteriores</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{row.notas_anteriores}</p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Acciones ({cachedAcciones.length})</span>
                {cachedAcciones.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {cachedAcciones.map(acc => (
                      <div key={acc.id} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-20 sm:w-24 shrink-0">{formatDate(acc.fecha_accion)}</span>
                        <span className="flex-1">{acc.accion}</span>
                        <EstadoBadge estado={acc.estado} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Sin acciones.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
