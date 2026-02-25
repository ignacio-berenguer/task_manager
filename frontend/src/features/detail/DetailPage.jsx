import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { AddAccionDialog, CambiarFechaDialog, CompleteAndScheduleDialog } from '@/features/shared/ActionDialogs'
import { DateInput } from '@/components/ui/date-input'
import { formatDate } from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Kbd } from '@/components/ui/kbd'
import { ArrowLeft, Plus, Pencil, Trash2, Calendar, CalendarClock, ListChecks, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import apiClient from '@/api/client'

const LOG = createLogger('Detail')

const FIELD_LABELS = {
  tarea_id: 'ID',
  tarea: 'Tarea',
  responsable: 'Responsable',
  descripcion: 'Descripcion',
  fecha_siguiente_accion: 'Fecha Siguiente Accion',
  tema: 'Tema',
  estado: 'Estado',
  fecha_creacion: 'Fecha Creacion',
  fecha_actualizacion: 'Fecha Actualizacion',
}

const DISPLAY_FIELDS = ['tarea_id', 'tarea', 'responsable', 'descripcion', 'fecha_siguiente_accion', 'tema', 'estado', 'fecha_creacion', 'fecha_actualizacion']

export default function DetailPage() {
  const { tarea_id } = useParams()
  const navigate = useNavigate()
  usePageTitle(`Tarea ${tarea_id}`)

  const [tarea, setTarea] = useState(null)
  const [acciones, setAcciones] = useState([])
  const [responsables, setResponsables] = useState([])
  const [estadosTarea, setEstadosTarea] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit tarea
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Add accion dialog (shared component)
  const [addAccionOpen, setAddAccionOpen] = useState(false)

  // Cambiar fecha dialog (shared component)
  const [cambiarFechaOpen, setCambiarFechaOpen] = useState(false)

  // Complete & schedule dialog (shared component)
  const [completeScheduleOpen, setCompleteScheduleOpen] = useState(false)

  // Mark as completado confirm dialog
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Edit accion modal (inline — keeps estado editing)
  const [editAccionOpen, setEditAccionOpen] = useState(false)
  const [editAccionForm, setEditAccionForm] = useState({ accion: '', fecha_accion: '', estado: '' })
  const [editingAccionId, setEditingAccionId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tareaRes, accionesRes] = await Promise.all([
        apiClient.get(`/tareas/${tarea_id}`),
        apiClient.get(`/acciones/tarea/${tarea_id}`),
      ])
      setTarea(tareaRes.data)
      // Sort acciones by fecha_accion descending
      const sorted = [...accionesRes.data].sort((a, b) => {
        if (!a.fecha_accion) return 1
        if (!b.fecha_accion) return -1
        return b.fecha_accion.localeCompare(a.fecha_accion)
      })
      setAcciones(sorted)
    } catch (err) {
      LOG.error('Error loading detail', err)
      setError('Error cargando la tarea')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tarea_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch responsables and estados for dropdowns
  useEffect(() => {
    apiClient.get('/responsables')
      .then(res => setResponsables(res.data))
      .catch(() => setResponsables([]))
    apiClient.get('/estados-tareas')
      .then(res => setEstadosTarea(res.data))
      .catch(() => setEstadosTarea([]))
  }, [])

  // Edit tarea handlers
  const openEdit = () => {
    setEditForm({
      tarea: tarea.tarea || '',
      responsable: tarea.responsable || '',
      descripcion: tarea.descripcion || '',
      fecha_siguiente_accion: tarea.fecha_siguiente_accion || '',
      tema: tarea.tema || '',
      estado: tarea.estado || '',
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    try {
      await apiClient.put(`/tareas/${tarea_id}`, editForm)
      setEditOpen(false)
      fetchData()
    } catch (err) {
      LOG.error('Error updating tarea', err)
    }
  }

  // Accion handlers
  const openEditAccion = (acc) => {
    setEditAccionForm({ accion: acc.accion, fecha_accion: acc.fecha_accion || '', estado: acc.estado || '' })
    setEditingAccionId(acc.id)
    setEditAccionOpen(true)
  }

  const saveEditAccion = async () => {
    try {
      const payload = { ...editAccionForm }
      if (!payload.fecha_accion) delete payload.fecha_accion
      await apiClient.put(`/acciones/${editingAccionId}`, payload)
      setEditAccionOpen(false)
      fetchData()
    } catch (err) {
      LOG.error('Error saving accion', err)
    }
  }

  const deleteAccion = async (id) => {
    if (!confirm('Eliminar esta accion?')) return
    try {
      await apiClient.delete(`/acciones/${id}`)
      fetchData()
    } catch (err) {
      LOG.error('Error deleting accion', err)
    }
  }

  // Mark tarea as completado
  const handleMarkComplete = async () => {
    setCompleting(true)
    try {
      const res = await apiClient.post(`/tareas/${tarea_id}/complete`)
      toast.success(`Tarea marcada como Completado (${res.data.acciones_updated} acciones actualizadas)`)
      setCompleteConfirmOpen(false)
      fetchData()
    } catch (err) {
      LOG.error('Error marking tarea as complete', err)
      toast.error('Error al marcar como completado')
    } finally {
      setCompleting(false)
    }
  }

  // Keyboard row selection for acciones
  const [selectedAccionIndex, setSelectedAccionIndex] = useState(-1)
  const accionesContainerRef = useRef(null)

  // Reset selection when acciones change
  useEffect(() => {
    setSelectedAccionIndex(-1)
  }, [acciones])

  // Check if any dialog is open
  const anyDialogOpen = editOpen || addAccionOpen || cambiarFechaOpen || completeScheduleOpen || editAccionOpen || completeConfirmOpen

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      id: 'detail.ctrlShiftF',
      keys: 'Ctrl+Shift+F',
      key: 'F',
      modifiers: { ctrl: true, shift: true },
      description: 'Ir a Búsqueda',
      category: 'Detalle',
      action: () => navigate('/search', { state: { focusTareaInput: true } }),
      alwaysActive: true,
    },
    {
      id: 'detail.edit',
      keys: 'e',
      key: 'e',
      description: 'Editar tarea',
      category: 'Detalle',
      action: () => { if (!anyDialogOpen && tarea) openEdit() },
      enabled: !anyDialogOpen && !!tarea,
    },
    {
      id: 'detail.addAccion',
      keys: 'a',
      key: 'a',
      description: 'Nueva acción',
      category: 'Detalle',
      action: () => { if (!anyDialogOpen) setAddAccionOpen(true) },
      enabled: !anyDialogOpen,
    },
    {
      id: 'detail.ctrlEnter',
      keys: 'Ctrl+Enter',
      key: 'Enter',
      modifiers: { ctrl: true },
      description: 'Guardar cambios',
      category: 'Detalle',
      action: () => {},  // handled by dialog onKeyDown
    },
  ], [anyDialogOpen, tarea, navigate])

  // Arrow key handlers for acciones
  const handleAccionesKeyDown = useCallback((e) => {
    if (acciones.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedAccionIndex(prev => {
        const next = prev < acciones.length - 1 ? prev + 1 : prev
        scrollAccionIntoView(next)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedAccionIndex(prev => {
        const next = prev > 0 ? prev - 1 : 0
        scrollAccionIntoView(next)
        return next
      })
    } else if (e.key === 'Enter' && selectedAccionIndex >= 0) {
      e.preventDefault()
      const acc = acciones[selectedAccionIndex]
      if (acc) openEditAccion(acc)
    } else if (e.key === 'Escape') {
      setSelectedAccionIndex(-1)
    }
  }, [acciones, selectedAccionIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollAccionIntoView = (index) => {
    requestAnimationFrame(() => {
      const el = accionesContainerRef.current?.querySelectorAll('[data-accion-index]')?.[index]
      if (el) el.scrollIntoView({ block: 'nearest' })
    })
  }

  // Back navigation — use browser history to preserve Search state
  const goBack = () => {
    navigate(-1)
  }

  if (loading) return <Layout><div className="p-8 text-center text-muted-foreground">Cargando...</div></Layout>
  if (error) return <Layout><div className="p-8 text-center text-destructive">{error}</div></Layout>
  if (!tarea) return <Layout><div className="p-8 text-center">Tarea no encontrada</div></Layout>

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:max-w-full lg:px-8">
        {/* Header (sticky) */}
        <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 bg-background px-4 sm:px-6 lg:px-8 py-3 border-b">
          <button onClick={goBack} className="mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-xs text-muted-foreground font-mono">{tarea.tarea_id}</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{tarea.tarea}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <EstadoBadge estado={tarea.estado} />
                {tarea.responsable && <Badge variant="outline">{tarea.responsable}</Badge>}
                {tarea.fecha_siguiente_accion && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tarea.fecha_siguiente_accion)}
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => setCambiarFechaOpen(true)}
                    >
                      <CalendarClock className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Cambiar Fecha Siguiente Accion</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tarea.estado?.toLowerCase() !== 'completado' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setCompleteConfirmOpen(true)}>
                      <CheckCircle2 className="sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Completar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Marcar tarea como Completado</TooltipContent>
                </Tooltip>
              )}
              <Button variant="outline" onClick={openEdit}>
                <Pencil className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
                <Kbd className="ml-2 hidden lg:inline-flex">E</Kbd>
              </Button>
            </div>
          </div>
        </div>

        {/* 1. Acciones Realizadas (primary content, moved up) */}
        <Card className="mb-6 p-6" tabIndex={0} onKeyDown={handleAccionesKeyDown} ref={accionesContainerRef}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Acciones Realizadas ({acciones.length})</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCompleteScheduleOpen(true)}>
                <ListChecks className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Completar y Programar</span>
              </Button>
              <Button size="sm" onClick={() => setAddAccionOpen(true)}>
                <Plus className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nueva Accion</span>
                <Kbd className="ml-2 hidden lg:inline-flex">A</Kbd>
              </Button>
            </div>
          </div>
          {acciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay acciones registradas.</p>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="space-y-2 sm:hidden">
                {acciones.map((acc, idx) => (
                  <div key={acc.id} data-accion-index={idx} className={cn("rounded-lg border p-3", idx === selectedAccionIndex && "ring-2 ring-inset ring-primary bg-primary/5")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{acc.accion}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(acc.fecha_accion)}</span>
                          <EstadoBadge estado={acc.estado} size="sm" />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditAccion(acc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteAccion(acc.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b">
                      <th className="w-[100px] px-2 py-1.5 text-left font-medium">Fecha</th>
                      <th className="px-2 py-1.5 text-left font-medium">Accion</th>
                      <th className="w-[120px] px-2 py-1.5 text-left font-medium">Estado</th>
                      <th className="w-[80px] px-2 py-1.5 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acciones.map((acc, idx) => (
                      <tr key={acc.id} data-accion-index={idx} className={cn("border-b", idx === selectedAccionIndex && "ring-2 ring-inset ring-primary bg-primary/5")} aria-selected={idx === selectedAccionIndex}>
                        <td className="px-2 py-1.5 text-muted-foreground">{formatDate(acc.fecha_accion)}</td>
                        <td className="px-2 py-1.5">{acc.accion}</td>
                        <td className="px-2 py-1.5"><EstadoBadge estado={acc.estado} size="sm" /></td>
                        <td className="px-2 py-1.5 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditAccion(acc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteAccion(acc.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* 2. Notas Anteriores (accordion, closed by default) */}
        {tarea.notas_anteriores && (
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="notas" className="rounded-lg border bg-card">
              <AccordionTrigger className="px-4 sm:px-6">
                <span className="text-lg font-semibold">Notas Anteriores</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{tarea.notas_anteriores}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* 3. Datos de la Tarea (accordion, collapsed by default) */}
        <Accordion type="single" collapsible>
          <AccordionItem value="datos" className="rounded-lg border bg-card">
            <AccordionTrigger className="px-4 sm:px-6">
              <span className="text-lg font-semibold">Datos de la Tarea</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {DISPLAY_FIELDS.map(field => (
                  <div key={field}>
                    <dt className="text-sm font-medium text-muted-foreground">{FIELD_LABELS[field]}</dt>
                    <dd className="mt-1 text-sm">
                      {field === 'estado' ? (
                        <EstadoBadge estado={tarea[field]} />
                      ) : field.startsWith('fecha') ? (
                        formatDate(tarea[field])
                      ) : (
                        tarea[field] || '-'
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Edit Tarea Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Tarea</DialogTitle></DialogHeader>
            <div className="space-y-3" onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.rdp')))) {
                e.preventDefault(); saveEdit()
              }
            }}>
              <div>
                <label className="text-sm font-medium">Tarea</label>
                <Input value={editForm.tarea || ''} onChange={e => setEditForm(f => ({ ...f, tarea: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editForm.responsable || ''}
                  onChange={e => setEditForm(f => ({ ...f, responsable: e.target.value }))}
                >
                  <option value="">-- Seleccionar --</option>
                  {responsables.map(r => (
                    <option key={r.id} value={r.valor}>{r.valor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Descripcion</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={editForm.descripcion || ''}
                  onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Siguiente Accion</label>
                <DateInput value={editForm.fecha_siguiente_accion || ''} onChange={val => setEditForm(f => ({ ...f, fecha_siguiente_accion: val }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Tema</label>
                <Input value={editForm.tema || ''} onChange={e => setEditForm(f => ({ ...f, tema: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editForm.estado || ''}
                  onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}
                >
                  <option value="">-- Seleccionar --</option>
                  {estadosTarea.map(e => (
                    <option key={e.id} value={e.valor}>{e.valor}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Accion Dialog (shared) */}
        <AddAccionDialog
          open={addAccionOpen}
          onOpenChange={setAddAccionOpen}
          tareaId={tarea.tarea_id}
          onSuccess={fetchData}
        />

        {/* Cambiar Fecha Dialog (shared) */}
        <CambiarFechaDialog
          open={cambiarFechaOpen}
          onOpenChange={setCambiarFechaOpen}
          tareaId={tarea.tarea_id}
          currentFecha={tarea.fecha_siguiente_accion}
          onSuccess={fetchData}
        />

        {/* Complete & Schedule Dialog (shared) */}
        <CompleteAndScheduleDialog
          open={completeScheduleOpen}
          onOpenChange={setCompleteScheduleOpen}
          tareaId={tarea.tarea_id}
          onSuccess={fetchData}
        />

        {/* Edit Accion Dialog */}
        <Dialog open={editAccionOpen} onOpenChange={setEditAccionOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Accion</DialogTitle></DialogHeader>
            <div className="space-y-3" onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.rdp')))) {
                e.preventDefault(); saveEditAccion()
              }
            }}>
              <div>
                <label className="text-sm font-medium">Accion</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={editAccionForm.accion}
                  onChange={e => setEditAccionForm(f => ({ ...f, accion: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <DateInput value={editAccionForm.fecha_accion} onChange={val => setEditAccionForm(f => ({ ...f, fecha_accion: val }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Input value={editAccionForm.estado} onChange={e => setEditAccionForm(f => ({ ...f, estado: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAccionOpen(false)}>Cancelar</Button>
              <Button onClick={saveEditAccion}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Confirm Mark as Completado */}
        <ConfirmDialog
          open={completeConfirmOpen}
          onOpenChange={setCompleteConfirmOpen}
          title="Marcar como Completado"
          description="Se marcara la tarea y todas sus acciones pendientes como completadas."
          onConfirm={handleMarkComplete}
          confirmText="Completar"
          loading={completing}
        />
      </div>
    </Layout>
  )
}
