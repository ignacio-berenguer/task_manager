import { useState } from 'react'
import { Star, Clipboard, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { FavoritesDialog } from './FavoritesDialog'

export function FavoritesToolbar({ favorites, count, onCopyToClipboard, onRemove, onClearAll }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  if (count === 0) return null

  const handleClearAll = (event) => {
    if (!confirmClear) {
      event?.preventDefault()
      setConfirmClear(true)
      return
    }
    onClearAll()
    setConfirmClear(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {count}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={onCopyToClipboard} className="gap-2">
            <Clipboard className="h-4 w-4" />
            Copiar Portfolio IDs
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialogOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar favoritos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleClearAll}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {confirmClear ? 'Confirmar borrado' : 'Vaciar favoritos'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FavoritesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        favorites={favorites}
        onRemove={onRemove}
        onClearAll={onClearAll}
      />
    </>
  )
}
