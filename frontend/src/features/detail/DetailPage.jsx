import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  usePageTitle(`Tarea ${tarea_id}`)

  const [tarea, setTarea] = useState(null)
  const [acciones, setAcciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit tarea
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Accion modal
  const [accionOpen, setAccionOpen] = useState(false)
  const [accionForm, setAccionForm] = useState({ accion: '', estado: '' })
  const [editingAccionId, setEditingAccionId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tareaRes, accionesRes] = await Promise.all([
        apiClient.get(`/tareas/${tarea_id}`),
        apiClient.get(`/acciones/tarea/${tarea_id}`),
      ])
      setTarea(tareaRes.data)
      setAcciones(accionesRes.data)
    } catch (err) {
      LOG.error('Error loading detail', err)
      setError('Error cargando la tarea')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tarea_id]) // eslint-disable-line react-hooks/exhaustive-deps

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
    setAccionForm({ accion: '', estado: 'Pendiente' })
    setEditingAccionId(null)
    setAccionOpen(true)
  }

  const openEditAccion = (acc) => {
    setAccionForm({ accion: acc.accion, estado: acc.estado || '' })
    setEditingAccionId(acc.id)
    setAccionOpen(true)
  }

  const saveAccion = async () => {
    try {
      if (editingAccionId) {
        await apiClient.put(`/acciones/${editingAccionId}`, accionForm)
      } else {
        await apiClient.post('/acciones', { tarea_id, ...accionForm })
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

  if (loading) return <Layout><div className="p-8 text-center text-muted-foreground">Cargando...</div></Layout>
  if (error) return <Layout><div className="p-8 text-center text-destructive">{error}</div></Layout>
  if (!tarea) return <Layout><div className="p-8 text-center">Tarea no encontrada</div></Layout>

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/search" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{tarea.tarea_id}</h1>
                <Badge>{tarea.estado || 'Sin estado'}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{tarea.tarea}</p>
            </div>
          </div>
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Tarea Info */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-lg font-semibold">Datos de la Tarea</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DISPLAY_FIELDS.map(field => (
              <div key={field}>
                <dt className="text-sm font-medium text-muted-foreground">{FIELD_LABELS[field]}</dt>
                <dd className="mt-1 text-sm">{tarea[field] || '-'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Acciones */}
        <Card className="p-6">
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Accion</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {acciones.map(acc => (
                  <tr key={acc.id} className="border-b">
                    <td className="px-3 py-2">{acc.accion}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{acc.estado || '-'}</Badge></td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditAccion(acc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAccion(acc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

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
                <Input value={editForm.responsable || ''} onChange={e => setEditForm(f => ({ ...f, responsable: e.target.value }))} />
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
