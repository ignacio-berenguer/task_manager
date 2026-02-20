import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COLOR_PALETTE, getBadgeColorClass } from '@/lib/badgeColors'

export function ParametroFormDialog({ open, onOpenChange, mode, initialData, existingNames, onSave }) {
  const [formData, setFormData] = useState({
    nombre_parametro: '',
    valor: '',
    color: '',
    orden: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setFormData({
          nombre_parametro: initialData.nombre_parametro || '',
          valor: initialData.valor || '',
          color: initialData.color || '',
          orden: initialData.orden != null ? String(initialData.orden) : '',
        })
      } else {
        setFormData({ nombre_parametro: '', valor: '', color: '', orden: '' })
      }
      setError('')
    }
  }, [open, mode, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre_parametro.trim()) {
      setError('Nombre parametro es obligatorio')
      return
    }
    if (!formData.valor.trim()) {
      setError('Valor es obligatorio')
      return
    }

    const payload = {
      nombre_parametro: formData.nombre_parametro.trim(),
      valor: formData.valor.trim(),
      color: formData.color || null,
      orden: formData.orden.trim() ? parseInt(formData.orden, 10) : null,
    }

    if (payload.orden !== null && isNaN(payload.orden)) {
      setError('Orden debe ser un numero entero')
      return
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Parametro' : 'Editar Parametro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_parametro">Nombre Parametro</Label>
            <Input
              id="nombre_parametro"
              list="existing-names"
              value={formData.nombre_parametro}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre_parametro: e.target.value }))}
              placeholder="Ej: estado, cluster, unidad"
            />
            <datalist id="existing-names">
              {(existingNames || []).map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              value={formData.valor}
              onChange={(e) => setFormData((prev) => ({ ...prev, valor: e.target.value }))}
              placeholder="Valor del parametro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color (opcional)</Label>
            <div className="flex items-center gap-2">
              {formData.color && (
                <span
                  className={`inline-block h-5 w-5 rounded-full shrink-0 ${getBadgeColorClass(formData.color).split(' ').find((c) => c.startsWith('bg-')) || 'bg-gray-100'}`}
                />
              )}
              <select
                id="color"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              >
                <option value="">Sin color</option>
                {COLOR_PALETTE.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orden">Orden (opcional)</Label>
            <Input
              id="orden"
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData((prev) => ({ ...prev, orden: e.target.value }))}
              placeholder="Orden de visualizacion"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
