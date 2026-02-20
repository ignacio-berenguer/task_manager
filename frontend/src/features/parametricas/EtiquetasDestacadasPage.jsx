import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Star, Plus, Pencil, Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { createLogger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import apiClient from '@/api/client'
import { useEtiquetasDestacadas } from './hooks/useEtiquetasDestacadas'
import { EtiquetaDestacadaFormDialog } from './EtiquetaDestacadaFormDialog'
import { getBadgeColorClass } from '@/lib/badgeColors'

const logger = createLogger('EtiquetasDestacadasPage')

export default function EtiquetasDestacadasPage() {
  usePageTitle('Etiquetas Destacadas')

  const queryClient = useQueryClient()
  const { data: etiquetas = [], isLoading } = useEtiquetasDestacadas()

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [editData, setEditData] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleCreate = useCallback(() => {
    setFormMode('create')
    setEditData(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((row) => {
    setFormMode('edit')
    setEditData(row)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback(async (payload) => {
    try {
      if (formMode === 'create') {
        await apiClient.post('/etiquetas-destacadas/', payload)
        logger.info('Etiqueta destacada created', payload)
      } else {
        await apiClient.put(`/etiquetas-destacadas/${editData.id}`, payload)
        logger.info('Etiqueta destacada updated', { id: editData.id, ...payload })
      }
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['etiquetas-destacadas-all'] })
    } catch (error) {
      const detail = error.response?.data?.detail || 'Error al guardar'
      logger.error('Save etiqueta destacada failed', error)
      alert(detail)
    }
  }, [formMode, editData, queryClient])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await apiClient.delete(`/etiquetas-destacadas/${deleteConfirm.id}`)
      logger.info('Etiqueta destacada deleted', { id: deleteConfirm.id })
      setDeleteConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['etiquetas-destacadas-all'] })
    } catch (error) {
      logger.error('Delete etiqueta destacada failed', error)
      alert('Error al eliminar la etiqueta destacada')
    }
  }, [deleteConfirm, queryClient])

  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-6 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6" />
            Etiquetas Destacadas
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Gestione las etiquetas destacadas que se muestran de forma prominente en las iniciativas
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {etiquetas.length} registros
          </span>

          <Button onClick={handleCreate} className="gap-1">
            <Plus className="h-4 w-4" />
            Nueva Etiqueta Destacada
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Cargando etiquetas destacadas...
          </div>
        ) : etiquetas.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No se encontraron etiquetas destacadas.
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Etiqueta
                  </th>
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Color
                  </th>
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Orden
                  </th>
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fecha Creacion
                  </th>
                  <th className="p-3 w-24 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {etiquetas.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50 bg-background"
                  >
                    <td className="p-3 font-medium">{row.etiqueta}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeColorClass(row.color)}`}>
                        {row.color}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.orden ?? '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {row.fecha_creacion
                        ? new Date(row.fecha_creacion).toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(row)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(row)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <EtiquetaDestacadaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={editData}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar etiqueta destacada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Esta seguro de que desea eliminar la etiqueta destacada{' '}
            <strong>{deleteConfirm?.etiqueta}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
