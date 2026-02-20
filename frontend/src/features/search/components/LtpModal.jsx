import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { EntityFormModal } from '@/features/detail/components/EntityFormModal'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('LtpModal')

const LTP_FORM_FIELDS = [
  { key: 'responsable', label: 'Responsable', parametric: 'responsable' },
  { key: 'tarea', label: 'Tarea', type: 'longtext' },
  { key: 'siguiente_accion', label: 'Siguiente Accion', type: 'longtext' },
  { key: 'estado', label: 'Estado', parametric: 'estado' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

function formatDate(val) {
  if (!val) return '-'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = val.split('-')
    return `${day}/${month}/${year}`
  }
  return val
}

/**
 * Modal for viewing and managing LTPs associated with a portfolio_id.
 * Supports Create, Edit, and Delete via the transacciones_json system.
 */
export function LtpModal({ isOpen, onClose, portfolioId, nombre }) {
  const [ltps, setLtps] = useState([])
  const [loading, setLoading] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchLtps = useCallback(async () => {
    if (!portfolioId) return
    setLoading(true)
    try {
      const res = await apiClient.get(`/ltp/portfolio/${portfolioId}`)
      setLtps(res.data || [])
      logger.info(`Fetched ${res.data?.length || 0} LTPs for ${portfolioId}`)
    } catch (err) {
      logger.error('Failed to fetch LTPs', err)
      setLtps([])
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  useEffect(() => {
    if (isOpen && portfolioId) {
      fetchLtps()
    } else {
      setLtps([])
      setEditRecord(null)
      setCreateOpen(false)
    }
  }, [isOpen, portfolioId, fetchLtps])

  function handleSuccess() {
    fetchLtps()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent onClose={onClose} className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground font-normal">Portfolio ID: {portfolioId}</span>
                <span className="text-base font-semibold truncate max-w-[28rem]" title={nombre}>{nombre || portfolioId}</span>
              </div>
              <Button
                size="sm"
                className="gap-1 shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir LTP
              </Button>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ltps.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay LTPs registradas para esta iniciativa.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Responsable</th>
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Tarea</th>
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Sig. Accion</th>
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                    <th className="p-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {ltps.map((ltp) => (
                    <tr key={ltp.id} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="p-2 text-sm whitespace-nowrap">{ltp.responsable || '-'}</td>
                      <td className="p-2 text-sm whitespace-pre-wrap max-w-[200px]">{ltp.tarea || '-'}</td>
                      <td className="p-2 text-sm whitespace-pre-wrap max-w-[150px]">{ltp.siguiente_accion || '-'}</td>
                      <td className="p-2 text-sm"><EstadoTag value={ltp.estado} /></td>
                      <td className="p-2 text-sm whitespace-nowrap">{formatDate(ltp.fecha_creacion)}</td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditRecord(ltp)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit LTP modal */}
      {editRecord && (
        <EntityFormModal
          open={!!editRecord}
          onOpenChange={(open) => { if (!open) setEditRecord(null) }}
          mode="edit"
          entityName="ltp"
          entityLabel="LTP"
          portfolioId={portfolioId}
          record={editRecord}
          fields={LTP_FORM_FIELDS}
          onSuccess={handleSuccess}
        />
      )}

      {/* Create LTP modal */}
      <EntityFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        entityName="ltp"
        entityLabel="LTP"
        portfolioId={portfolioId}
        fields={LTP_FORM_FIELDS}
        onSuccess={handleSuccess}
      />
    </>
  )
}
