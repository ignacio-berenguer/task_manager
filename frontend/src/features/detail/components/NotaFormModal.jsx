import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('NotaFormModal')

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Modal form for creating, editing, and deleting notas via transacciones_json.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {'create'|'edit'} props.mode
 * @param {string} props.portfolioId
 * @param {object} [props.nota] - existing nota for edit mode
 * @param {() => void} props.onSuccess - called after successful create/edit/delete
 */
export function NotaFormModal({ open, onOpenChange, mode, portfolioId, nota, onSuccess }) {
  const isEdit = mode === 'edit'
  const { user } = useUser()
  const userName = user?.fullName || user?.firstName || 'Unknown'

  const [fecha, setFecha] = useState(isEdit ? (nota?.fecha || '') : getTodayISO())
  const [notaText, setNotaText] = useState(isEdit ? (nota?.nota || '') : '')
  const [mensajeCommit, setMensajeCommit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const notaTextRef = useRef(null)

  // Reset form state every time the dialog opens
  useEffect(() => {
    if (open) {
      setFecha(isEdit ? (nota?.fecha || '') : getTodayISO())
      setNotaText(isEdit ? (nota?.nota || '') : '')
      setMensajeCommit('')
      setError(null)
      setDeleteConfirmOpen(false)
      // Defer focus to allow dialog animation to complete
      const timer = setTimeout(() => notaTextRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const registradoPor = isEdit ? (nota?.registrado_por || userName) : userName

  async function submitTransaction(tipoOperacion, cambios) {
    const clavePrimaria = isEdit
      ? { id: nota.id }
      : { portfolio_id: portfolioId }

    const payload = {
      entidad: 'notas',
      tipo_operacion: tipoOperacion,
      clave_primaria: JSON.stringify(clavePrimaria),
      cambios: cambios ? JSON.stringify(cambios) : null,
      usuario: userName,
      mensaje_commit: mensajeCommit,
      estado_excel: 'PENDIENTE',
      portfolio_id: portfolioId,
    }

    logger.info('Creating transaction', { tipoOperacion, portfolioId })
    await apiClient.post('/transacciones-json/', payload)

    logger.info('Processing pending transactions')
    await apiClient.post('/transacciones-json/process')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEdit) {
        // Build cambios with only changed fields
        const cambios = {}
        if (fecha !== (nota?.fecha || '')) cambios.fecha = fecha || null
        if (notaText !== (nota?.nota || '')) cambios.nota = notaText || null

        if (Object.keys(cambios).length === 0) {
          setError('No se detectaron cambios.')
          setSubmitting(false)
          return
        }

        await submitTransaction('UPDATE', cambios)
        toast.success('Nota actualizada correctamente')
      } else {
        const cambios = {
          portfolio_id: portfolioId,
          fecha: fecha || null,
          registrado_por: registradoPor,
          nota: notaText || null,
        }
        await submitTransaction('INSERT', cambios)
        toast.success('Nota creada correctamente')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      logger.error('Transaction failed', err)
      const msg = err.response?.data?.detail || err.message || 'Error al guardar'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleteClick() {
    if (!mensajeCommit.trim()) {
      setError('El mensaje de commit es obligatorio para eliminar.')
      return
    }
    setDeleteConfirmOpen(true)
  }

  async function executeDelete() {
    setDeleteConfirmOpen(false)
    setError(null)
    setSubmitting(true)

    try {
      await submitTransaction('DELETE', null)
      toast.success('Nota eliminada correctamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      logger.error('Delete transaction failed', err)
      const msg = err.response?.data?.detail || err.message || 'Error al eliminar'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onClose={() => onOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Nota' : 'Añadir Nota'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nota-fecha">Fecha *</Label>
              <Input
                id="nota-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota-registrado-por">Registrado por</Label>
              <Input
                id="nota-registrado-por"
                value={registradoPor}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota-text">Nota *</Label>
              <textarea
                ref={notaTextRef}
                id="nota-text"
                rows={4}
                value={notaText}
                onChange={(e) => setNotaText(e.target.value)}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Contenido de la nota"
              />
            </div>

            <hr className="border-muted" />

            <div className="space-y-2">
              <Label htmlFor="nota-commit" required>Mensaje de commit *</Label>
              <Input
                id="nota-commit"
                value={mensajeCommit}
                onChange={(e) => setMensajeCommit(e.target.value)}
                placeholder="Descripción del cambio"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={submitting}
                  tabIndex={-1}
                  className="mr-auto"
                >
                  Eliminar
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                tabIndex={-1}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Guardar Cambios' : 'Crear Nota'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Nota"
        description="¿Esta seguro que desea eliminar esta nota? Esta accion no se puede deshacer."
        onConfirm={executeDelete}
        confirmText="Eliminar"
        loading={submitting}
      />
    </>
  )
}
