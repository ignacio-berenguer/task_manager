import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { formatDate } from '@/lib/formatDate'
import { ArrowLeft, Plus, Pencil, Trash2, Calendar } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit tarea
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Accion modal
  const [accionOpen, setAccionOpen] = useState(false)
  const [accionForm, setAccionForm] = useState({ accion: '', fecha_accion: '', estado: '' })
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

  // Fetch responsables for dropdown
  useEffect(() => {
    apiClient.get('/responsables')
      .then(res => setResponsables(res.data))
      .catch(() => setResponsables([]))
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
  const openNewAccion = () => {
    setAccionForm({ accion: '', fecha_accion: '', estado: 'Pendiente' })
    setEditingAccionId(null)
    setAccionOpen(true)
  }

  const openEditAccion = (acc) => {
    setAccionForm({ accion: acc.accion, fecha_accion: acc.fecha_accion || '', estado: acc.estado || '' })
    setEditingAccionId(acc.id)
    setAccionOpen(true)
  }

  const saveAccion = async () => {
    try {
      const payload = { ...accionForm }
      if (!payload.fecha_accion) delete payload.fecha_accion
      if (editingAccionId) {
        await apiClient.put(`/acciones/${editingAccionId}`, payload)
      } else {
        await apiClient.post('/acciones', { tarea_id, ...payload })
      }
      setAccionOpen(false)
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

  // Keyboard shortcut: Ctrl+Shift+F → go to Search with focus on tarea input
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        navigate('/search', { state: { focusTareaInput: true } })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate])

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
              </div>
            </div>
            <Button variant="outline" onClick={openEdit} className="shrink-0">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* 1. Acciones Realizadas (primary content, moved up) */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Acciones Realizadas ({acciones.length})</h2>
            <Button size="sm" onClick={openNewAccion}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Accion
            </Button>
          </div>
          {acciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay acciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
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
                  {acciones.map(acc => (
                    <tr key={acc.id} className="border-b">
                      <td className="px-2 py-1.5 text-muted-foreground">{formatDate(acc.fecha_accion)}</td>
                      <td className="px-2 py-1.5">{acc.accion}</td>
                      <td className="px-2 py-1.5"><EstadoBadge estado={acc.estado} size="sm" /></td>
                      <td className="px-2 py-1.5 text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditAccion(acc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteAccion(acc.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 2. Notas Anteriores (accordion, closed by default) */}
        {tarea.notas_anteriores && (
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="notas" className="rounded-lg border bg-card">
              <AccordionTrigger className="px-6">
                <span className="text-lg font-semibold">Notas Anteriores</span>
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{tarea.notas_anteriores}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* 3. Datos de la Tarea (accordion, collapsed by default) */}
        <Accordion type="single" collapsible>
          <AccordionItem value="datos" className="rounded-lg border bg-card">
            <AccordionTrigger className="px-6">
              <span className="text-lg font-semibold">Datos de la Tarea</span>
            </AccordionTrigger>
            <AccordionContent className="px-6">
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
            <div className="space-y-3">
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
                <Input type="date" value={editForm.fecha_siguiente_accion || ''} onChange={e => setEditForm(f => ({ ...f, fecha_siguiente_accion: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Tema</label>
                <Input value={editForm.tema || ''} onChange={e => setEditForm(f => ({ ...f, tema: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Input value={editForm.estado || ''} onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Accion Dialog */}
        <Dialog open={accionOpen} onOpenChange={setAccionOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAccionId ? 'Editar Accion' : 'Nueva Accion'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Accion</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={accionForm.accion}
                  onChange={e => setAccionForm(f => ({ ...f, accion: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" value={accionForm.fecha_accion} onChange={e => setAccionForm(f => ({ ...f, fecha_accion: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Input value={accionForm.estado} onChange={e => setAccionForm(f => ({ ...f, estado: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAccionOpen(false)}>Cancelar</Button>
              <Button onClick={saveAccion}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
