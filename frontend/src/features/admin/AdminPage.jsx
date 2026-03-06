import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import apiClient from '@/api/client'

const LOG = createLogger('Admin')

const TABS = [
  { key: 'estados-tareas', label: 'Estados de Tareas', endpoint: '/estados-tareas', hasColor: true },
  { key: 'estados-acciones', label: 'Estados de Acciones', endpoint: '/estados-acciones', hasColor: true },
  { key: 'responsables', label: 'Responsables', endpoint: '/responsables', hasColor: false },
]

export default function AdminPage() {
  usePageTitle('Tablas Parametricas')

  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ valor: '', orden: 0, color: '' })
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const tab = TABS.find(t => t.key === activeTab)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(tab.endpoint)
      setItems(res.data)
    } catch (err) {
      LOG.error(`Error loading ${tab.label}`, err)
      toast.error(`Error al cargar ${tab.label}`)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ valor: '', orden: items.length > 0 ? Math.max(...items.map(i => i.orden)) + 1 : 1, color: '' })
    setDialogOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ valor: item.valor, orden: item.orden, color: item.color || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.valor.trim() || saving) return
    setSaving(true)
    try {
      const payload = { valor: form.valor.trim(), orden: Number(form.orden) || 0 }
      if (tab.hasColor && form.color.trim()) {
        payload.color = form.color.trim()
      }
      if (editingItem) {
        await apiClient.put(`${tab.endpoint}/${editingItem.id}`, payload)
        toast.success('Registro actualizado')
      } else {
        await apiClient.post(tab.endpoint, payload)
        toast.success('Registro creado')
      }
      setDialogOpen(false)
      fetchItems()
    } catch (err) {
      LOG.error('Error saving', err)
      const msg = err.response?.data?.detail || 'Error al guardar'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (item) => {
    setDeletingItem(item)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      await apiClient.delete(`${tab.endpoint}/${deletingItem.id}`)
      toast.success('Registro eliminado')
      setDeleteConfirmOpen(false)
      fetchItems()
    } catch (err) {
      LOG.error('Error deleting', err)
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Tablas Parametricas</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{tab.label}</h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Valor</th>
                  <th className="px-4 py-2 text-left font-medium w-20">Orden</th>
                  {tab.hasColor && <th className="px-4 py-2 text-left font-medium w-24">Color</th>}
                  <th className="px-4 py-2 text-right font-medium w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">{item.valor}</td>
                    <td className="px-4 py-2">{item.orden}</td>
                    {tab.hasColor && <td className="px-4 py-2">{item.color || '-'}</td>}
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => confirmDelete(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Registro' : 'Nuevo Registro'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3" onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                handleSave()
              }
            }}>
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="Nombre del valor"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={e => setForm(f => ({ ...f, orden: e.target.value }))}
                />
              </div>
              {tab.hasColor && (
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="Ej: blue, green, gray"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.valor.trim()}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Eliminar Registro"
          description={`Se eliminara "${deletingItem?.valor}". Esta accion no se puede deshacer.`}
          onConfirm={handleDelete}
          confirmText="Eliminar"
          loading={deleting}
        />
      </div>
    </Layout>
  )
}
