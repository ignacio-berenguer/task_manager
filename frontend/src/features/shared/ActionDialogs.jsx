import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import apiClient from '@/api/client'

const LOG = createLogger('ActionDialogs')

function getTodayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Dialog to add a new accion to a tarea.
 * Creates the accion with estado "PENDIENTE" and updates the tarea's fecha_siguiente_accion.
 */
export function AddAccionDialog({ open, onOpenChange, tareaId, onSuccess }) {
  const [form, setForm] = useState({ accion: '', fecha_accion: getTodayISO() })
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  // Reset form and focus when dialog opens
  useEffect(() => {
    if (open) {
      setForm({ accion: '', fecha_accion: getTodayISO() })
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!form.accion.trim() || !form.fecha_accion || saving) return
    setSaving(true)
    try {
      await apiClient.post('/acciones', {
        tarea_id: tareaId,
        accion: form.accion.trim(),
        fecha_accion: form.fecha_accion,
        estado: 'PENDIENTE',
      })
      await apiClient.put(`/tareas/${tareaId}`, {
        fecha_siguiente_accion: form.fecha_accion,
      })
      LOG.info(`Accion created for tarea ${tareaId}`)
      toast.success('Accion creada exitosamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      LOG.error('Error creating accion', err)
      toast.error('Error al crear la accion')
    } finally {
      setSaving(false)
    }
  }, [form, saving, tareaId, onOpenChange, onSuccess])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.rdp'))) {
        e.preventDefault()
        handleSave()
      }
    }
  }, [handleSave])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Nueva Accion</DialogTitle>
        </DialogHeader>
        <div className="space-y-3" onKeyDown={handleKeyDown}>
          <div>
            <label className="text-sm font-medium">Accion</label>
            <textarea
              ref={textareaRef}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              value={form.accion}
              onChange={e => setForm(f => ({ ...f, accion: e.target.value }))}
              placeholder="Descripcion de la accion..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fecha</label>
            <DateInput
              value={form.fecha_accion}
              onChange={val => setForm(f => ({ ...f, fecha_accion: val }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.accion.trim() || !form.fecha_accion}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog to complete a current action and optionally schedule the next one.
 * Creates accion1 (Completada, today), optionally accion2 (Pendiente, future date),
 * and updates tarea's fecha_siguiente_accion.
 */
export function CompleteAndScheduleDialog({ open, onOpenChange, tareaId, onSuccess }) {
  const [form, setForm] = useState({ accion_completada: '', accion_siguiente: '', fecha_siguiente: getTodayISO() })
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm({ accion_completada: '', accion_siguiente: '', fecha_siguiente: getTodayISO() })
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!form.accion_completada.trim() || !form.fecha_siguiente || saving) return
    setSaving(true)
    try {
      const payload = {
        tarea_id: tareaId,
        accion_completada: form.accion_completada.trim(),
        fecha_siguiente: form.fecha_siguiente,
      }
      if (form.accion_siguiente.trim()) {
        payload.accion_siguiente = form.accion_siguiente.trim()
      }
      await apiClient.post('/acciones/complete-and-schedule', payload)
      LOG.info(`Complete & schedule for tarea ${tareaId}`)
      toast.success(form.accion_siguiente.trim()
        ? 'Accion completada y siguiente programada'
        : 'Accion completada y fecha actualizada')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      LOG.error('Error in complete & schedule', err)
      toast.error('Error al completar y programar')
    } finally {
      setSaving(false)
    }
  }, [form, saving, tareaId, onOpenChange, onSuccess])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.rdp'))) {
        e.preventDefault()
        handleSave()
      }
    }
  }, [handleSave])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  const isValid = form.accion_completada.trim() && form.fecha_siguiente

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Completar y Programar Siguiente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2 rounded-md border p-3">
            <label className="text-sm font-medium">Accion Completada</label>
            <textarea
              ref={textareaRef}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={2}
              value={form.accion_completada}
              onChange={e => setForm(f => ({ ...f, accion_completada: e.target.value }))}
              placeholder="Descripcion de la accion realizada..."
            />
            <p className="text-xs text-muted-foreground">Se registrara con fecha de hoy y estado Completada</p>
          </div>
          <div>
            <label className="text-sm font-medium">Fecha Siguiente Accion</label>
            <DateInput
              value={form.fecha_siguiente}
              onChange={val => setForm(f => ({ ...f, fecha_siguiente: val }))}
            />
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <label className="text-sm font-medium">Siguiente Accion <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={2}
              value={form.accion_siguiente}
              onChange={e => setForm(f => ({ ...f, accion_siguiente: e.target.value }))}
              placeholder="Descripcion de la proxima accion..."
            />
            <p className="text-xs text-muted-foreground">Si se completa, se registrara como Pendiente con la fecha indicada</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog to change a tarea's fecha_siguiente_accion.
 */
export function CambiarFechaDialog({ open, onOpenChange, tareaId, currentFecha, onSuccess }) {
  const [fecha, setFecha] = useState(currentFecha || '')
  const [saving, setSaving] = useState(false)
  const datePickerRef = useRef(null)

  // Sync fecha when dialog opens and focus the date picker
  useEffect(() => {
    if (open) {
      setFecha(currentFecha || '')
      // Focus the DatePicker button (first button inside the container)
      setTimeout(() => {
        const btn = datePickerRef.current?.querySelector('button')
        btn?.focus()
      }, 50)
    }
  }, [open, currentFecha])

  const handleSave = useCallback(async () => {
    if (!fecha || saving) return
    setSaving(true)
    try {
      await apiClient.put(`/tareas/${tareaId}`, {
        fecha_siguiente_accion: fecha,
      })
      LOG.info(`Fecha siguiente accion updated for tarea ${tareaId}`)
      toast.success('Fecha actualizada exitosamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      LOG.error('Error updating fecha', err)
      toast.error('Error al actualizar la fecha')
    } finally {
      setSaving(false)
    }
  }, [fecha, saving, tareaId, onOpenChange, onSuccess])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.rdp'))) {
        e.preventDefault()
        handleSave()
      }
    }
  }, [handleSave])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Cambiar Fecha Siguiente Accion</DialogTitle>
        </DialogHeader>
        <div onKeyDown={handleKeyDown} ref={datePickerRef}>
          <label className="text-sm font-medium">Fecha Siguiente Accion</label>
          <DateInput
            value={fecha}
            onChange={setFecha}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !fecha}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
