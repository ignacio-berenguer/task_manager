import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings, Plus, Pencil, Trash2 } from 'lucide-react'
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
import { ParametroFormDialog } from './ParametroFormDialog'
import { getBadgeColorClass } from '@/lib/badgeColors'

const logger = createLogger('ParametricasPage')

export default function ParametricasPage() {
  usePageTitle('Parametricas')

  const queryClient = useQueryClient()

  const { data: response, isLoading } = useQuery({
    queryKey: ['parametros-all'],
    queryFn: async () => {
      const res = await apiClient.get('/parametros/')
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })

  const parametros = response?.data || []

  // Distinct nombre_parametro values
  const existingNames = useMemo(() => {
    const names = [...new Set(parametros.map((p) => p.nombre_parametro))]
    return names.sort()
  }, [parametros])

  // Filter state
  const [filterName, setFilterName] = useState('')

  const filteredParametros = useMemo(() => {
    if (!filterName) return parametros
    return parametros.filter((p) => p.nombre_parametro === filterName)
  }, [parametros, filterName])

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
        await apiClient.post('/parametros/', payload)
        logger.info('Parametro created', payload)
      } else {
        await apiClient.put(`/parametros/${editData.id}`, payload)
        logger.info('Parametro updated', { id: editData.id, ...payload })
      }
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['parametros-all'] })
    } catch (error) {
      const detail = error.response?.data?.detail || 'Error al guardar'
      logger.error('Save parametro failed', error)
      alert(detail)
    }
  }, [formMode, editData, queryClient])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await apiClient.delete(`/parametros/${deleteConfirm.id}`)
      logger.info('Parametro deleted', { id: deleteConfirm.id })
      setDeleteConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['parametros-all'] })
    } catch (error) {
      logger.error('Delete parametro failed', error)
      alert('Error al eliminar el parametro')
    }
  }, [deleteConfirm, queryClient])

  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-6 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Parametricas
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Gestione los valores parametricos del sistema
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            >
              <option value="">Todos los parametros</option>
              {existingNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              {filteredParametros.length} registros
            </span>
          </div>

          <Button onClick={handleCreate} className="gap-1">
            <Plus className="h-4 w-4" />
            Nuevo Parametro
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Cargando parametros...
          </div>
        ) : filteredParametros.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No se encontraron parametros.
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nombre Parametro
                  </th>
                  <th className="p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor
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
                {filteredParametros.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50 bg-background"
                  >
                    <td className="p-3 font-medium">{row.nombre_parametro}</td>
                    <td className="p-3">{row.valor}</td>
                    <td className="p-3">
                      {row.color ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full ${getBadgeColorClass(row.color).split(' ').find((c) => c.startsWith('bg-')) || 'bg-gray-100'}`}
                          />
                          <span className="text-xs text-muted-foreground">{row.color}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
      <ParametroFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={editData}
        existingNames={existingNames}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar parametro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Esta seguro de que desea eliminar el parametro{' '}
            <strong>{deleteConfirm?.nombre_parametro}</strong> con valor{' '}
            <strong>{deleteConfirm?.valor}</strong>?
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
