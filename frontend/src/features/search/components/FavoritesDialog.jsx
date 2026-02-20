import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function FavoritesDialog({ open, onOpenChange, favorites, onRemove, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    onClearAll()
    setConfirmClear(false)
  }

  const handleClose = () => {
    setConfirmClear(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleClose} className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Favoritos ({favorites.length})</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay favoritos guardados.
            </p>
          ) : (
            <div className="space-y-1">
              {favorites.map((fav) => (
                <div
                  key={fav.portfolioId}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-mono font-medium">{fav.portfolioId}</span>
                    {fav.nombre && fav.nombre !== fav.portfolioId && (
                      <span className="text-sm text-muted-foreground ml-2 truncate">
                        {fav.nombre}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(fav.portfolioId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          {favorites.length > 0 && (
            <Button
              variant={confirmClear ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClearAll}
              className="gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmClear ? 'Confirmar borrado' : 'Vaciar lista'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
