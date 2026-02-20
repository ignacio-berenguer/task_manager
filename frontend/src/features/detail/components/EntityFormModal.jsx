import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DatePicker } from '@/components/ui/datepicker'
import { resolveDefaults } from '../config/entityDefaults'
import { isLongTextField, isMonetaryField, getSelectOptions, getAutoDateFields } from '../config/entityFieldConfig'
import { useParametricFields } from '../hooks/useParametricOptions'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('EntityFormModal')

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getNowISO() {
  return new Date().toISOString().slice(0, 19)
}

/**
 * Generic CUD modal for any entity, driven by field configuration.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {'create'|'edit'} props.mode
 * @param {string} props.entityName - table name for transaction (e.g. 'hechos')
 * @param {string} props.entityLabel - display name (e.g. 'Hecho')
 * @param {string} props.portfolioId
 * @param {object} [props.record] - existing record for edit mode
 * @param {Array<{key: string, label: string, type?: string, required?: boolean, readOnly?: boolean, readOnlyOnEdit?: boolean}>} props.fields
 * @param {() => void} props.onSuccess
 */
export function EntityFormModal({
  open,
  onOpenChange,
  mode,
  entityName,
  entityLabel,
  portfolioId,
  record,
  fields,
  onSuccess,
  disableDelete = false,
}) {
  const isEdit = mode === 'edit'
  const { user } = useUser()
  const userName = user?.fullName || user?.firstName || 'Unknown'

  const [formData, setFormData] = useState({})
  const [mensajeCommit, setMensajeCommit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const firstFieldRef = useRef(null)
  const { optionsMap: parametricOptions } = useParametricFields(fields)

  // Reset form state every time the dialog opens
  useEffect(() => {
    if (open) {
      const defaults = resolveDefaults(entityName)
      const initial = {}
      for (const field of fields) {
        if (isEdit) {
          initial[field.key] = record?.[field.key] ?? ''
        } else {
          initial[field.key] = defaults[field.key] ?? ''
        }
      }
      setFormData(initial)
      setMensajeCommit('')
      setError(null)
      setDeleteConfirmOpen(false)
      const timer = setTimeout(() => firstFieldRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function submitTransaction(tipoOperacion, cambios) {
    const clavePrimaria = isEdit
      ? buildEditPrimaryKey()
      : { portfolio_id: portfolioId }

    const payload = {
      entidad: entityName,
      tipo_operacion: tipoOperacion,
      clave_primaria: JSON.stringify(clavePrimaria),
      cambios: cambios ? JSON.stringify(cambios) : null,
      usuario: userName,
      mensaje_commit: mensajeCommit,
      estado_excel: 'PENDIENTE',
      portfolio_id: portfolioId,
    }

    logger.info('Creating transaction', { tipoOperacion, entityName, portfolioId })
    await apiClient.post('/transacciones-json/', payload)

    logger.info('Processing pending transactions')
    await apiClient.post('/transacciones-json/process')
  }

  function buildEditPrimaryKey() {
    // hechos uses id_hecho as PK
    if (entityName === 'hechos') {
      return { id_hecho: record.id_hecho }
    }
    return { id: record.id }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Get auto-date fields for this entity
      const autoDateFields = getAutoDateFields(entityName)

      if (isEdit) {
        const cambios = {}
        for (const field of fields) {
          if (field.readOnly) continue
          const currentVal = formData[field.key] ?? ''
          const originalVal = record?.[field.key] ?? ''
          if (String(currentVal) !== String(originalVal)) {
            cambios[field.key] = currentVal || null
          }
        }
        // Add auto-date fields
        for (const [fieldKey, dateType] of Object.entries(autoDateFields)) {
          cambios[fieldKey] = dateType === 'datetime' ? getNowISO() : getTodayISO()
        }

        // Check if there are real changes (excluding auto-date fields)
        const realChanges = Object.keys(cambios).filter((k) => !autoDateFields[k])
        if (realChanges.length === 0) {
          setError('No se detectaron cambios.')
          setSubmitting(false)
          return
        }

        await submitTransaction('UPDATE', cambios)
        toast.success(`${entityLabel} actualizado correctamente`)
      } else {
        const cambios = { portfolio_id: portfolioId }
        for (const field of fields) {
          if (field.readOnly) continue
          const val = formData[field.key]
          cambios[field.key] = val !== '' ? val : null
        }
        // Add auto-date fields
        for (const [fieldKey, dateType] of Object.entries(autoDateFields)) {
          cambios[fieldKey] = dateType === 'datetime' ? getNowISO() : getTodayISO()
        }

        await submitTransaction('INSERT', cambios)
        toast.success(`${entityLabel} creado correctamente`)
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
      toast.success(`${entityLabel} eliminado correctamente`)
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

  function renderField(field, index) {
    const isFieldReadOnly = field.readOnly || (isEdit && field.readOnlyOnEdit)
    const value = formData[field.key] ?? ''
    const fieldId = `${entityName}-${field.key}`
    const isFirst = index === 0 || (fields[0].readOnly && index === 1)
    const ref = isFirst ? firstFieldRef : undefined

    // Parametric select field (from API)
    const parametricOpts = parametricOptions[field.key]
    if (parametricOpts && parametricOpts.length > 0) {
      // Preserve legacy value not in parametric list
      const hasLegacyValue = value && !parametricOpts.includes(value)
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <select
            id={fieldId}
            ref={ref}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            disabled={isFieldReadOnly || submitting}
            required={field.required}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- Seleccionar --</option>
            {hasLegacyValue && <option value={value}>{value}</option>}
            {parametricOpts.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )
    }

    // Hardcoded select field (fallback)
    const selectOpts = getSelectOptions(entityName, field.key)
    if (selectOpts) {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <select
            id={fieldId}
            ref={ref}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            disabled={isFieldReadOnly || submitting}
            required={field.required}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- Seleccionar --</option>
            {selectOpts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    }

    // Currency field
    if (isMonetaryField(entityName, field.key)) {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}</Label>
          <CurrencyInput
            id={fieldId}
            ref={ref}
            value={value !== '' ? Number(value) : null}
            onChange={(v) => setField(field.key, v)}
            disabled={isFieldReadOnly || submitting}
          />
        </div>
      )
    }

    // Long-text field
    if (isLongTextField(entityName, field.key) || field.type === 'longtext') {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <textarea
            id={fieldId}
            ref={ref}
            rows={4}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            disabled={isFieldReadOnly || submitting}
            required={field.required}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )
    }

    // Date field
    if (field.type === 'date') {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <DatePicker
            id={fieldId}
            value={value ? String(value).slice(0, 10) : ''}
            onChange={(isoDate) => setField(field.key, isoDate)}
            disabled={isFieldReadOnly || submitting}
            className={isFieldReadOnly ? 'bg-muted' : ''}
          />
        </div>
      )
    }

    // Datetime field
    if (field.type === 'datetime') {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <Input
            id={fieldId}
            ref={ref}
            type="datetime-local"
            value={value ? String(value).slice(0, 16) : ''}
            onChange={(e) => setField(field.key, e.target.value)}
            disabled={isFieldReadOnly || submitting}
            required={field.required}
            className={isFieldReadOnly ? 'bg-muted' : ''}
          />
        </div>
      )
    }

    // Number field
    if (field.type === 'number') {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
          <Input
            id={fieldId}
            ref={ref}
            type="number"
            value={value}
            onChange={(e) => setField(field.key, e.target.value !== '' ? Number(e.target.value) : '')}
            disabled={isFieldReadOnly || submitting}
            required={field.required}
            className={isFieldReadOnly ? 'bg-muted' : ''}
          />
        </div>
      )
    }

    // Default: text input
    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={fieldId}>{field.label}{field.required ? ' *' : ''}</Label>
        <Input
          id={fieldId}
          ref={ref}
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          disabled={isFieldReadOnly || submitting}
          required={field.required}
          className={isFieldReadOnly ? 'bg-muted' : ''}
        />
      </div>
    )
  }

  // Find the first non-readOnly field index for auto-focus
  const firstEditableIndex = fields.findIndex((f) => !f.readOnly && !(isEdit && f.readOnlyOnEdit))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onClose={() => onOpenChange(false)} className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Editar ${entityLabel}` : `Añadir ${entityLabel}`}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field, index) => renderField(field, index === firstEditableIndex ? 0 : index + 1))}

            <hr className="border-muted" />

            <div className="space-y-2">
              <Label htmlFor={`${entityName}-commit`}>Mensaje de commit *</Label>
              <Input
                id={`${entityName}-commit`}
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
              {isEdit && !disableDelete && (
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
                {isEdit ? 'Guardar Cambios' : `Crear ${entityLabel}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Eliminar ${entityLabel}`}
        description={`¿Esta seguro que desea eliminar este registro de ${entityLabel.toLowerCase()}? Esta accion no se puede deshacer.`}
        onConfirm={executeDelete}
        confirmText="Eliminar"
        loading={submitting}
      />
    </>
  )
}
