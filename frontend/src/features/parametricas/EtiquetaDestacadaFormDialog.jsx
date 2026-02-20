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

export function EtiquetaDestacadaFormDialog({ open, onOpenChange, mode, initialData, onSave }) {
  const [formData, setFormData] = useState({
    etiqueta: '',
    color: 'blue',
    orden: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setFormData({
          etiqueta: initialData.etiqueta || '',
          color: initialData.color || 'blue',
          orden: initialData.orden != null ? String(initialData.orden) : '',
        })
      } else {
        setFormData({ etiqueta: '', color: 'blue', orden: '' })
      }
      setError('')
    }
  }, [open, mode, initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!formData.etiqueta.trim()) {
      setError('Etiqueta es obligatoria')
      return
    }

    const payload = {
      etiqueta: formData.etiqueta.trim(),
      color: formData.color,
      orden: formData.orden.trim() ? parseInt(formData.orden, 10) : null,
    }

    if (payload.orden !== null && isNaN(payload.orden)) {
      setError('Orden debe ser un número entero')
      return
    }

    onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Etiqueta Destacada' : 'Editar Etiqueta Destacada'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="etiqueta">Etiqueta</Label>
            <Input
              id="etiqueta"
              value={formData.etiqueta}
              onChange={(e) => setFormData((prev) => ({ ...prev, etiqueta: e.target.value }))}
              placeholder="Nombre de la etiqueta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-5 w-5 rounded-full shrink-0 ${getBadgeColorClass(formData.color).split(' ').find((c) => c.startsWith('bg-')) || 'bg-blue-100'}`}
              />
              <select
                id="color"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              >
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
