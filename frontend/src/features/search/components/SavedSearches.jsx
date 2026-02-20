import { useState } from 'react'
import { Bookmark, ChevronDown, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useSavedSearches } from '../hooks/useSavedSearches'
import { toast } from 'sonner'

export function SavedSearches({ filters, onLoadSearch }) {
  const { savedSearches, saveSearch, deleteSearch, hasName, isFull } = useSavedSearches()
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [searchName, setSearchName] = useState('')

  const handleSave = () => {
    const name = searchName.trim()
    if (!name) return

    if (isFull && !hasName(name)) {
      toast.warning('Maximo de 20 busquedas guardadas alcanzado')
      return
    }

    if (hasName(name)) {
      if (!window.confirm('Ya existe una busqueda con este nombre. ¿Desea reemplazarla?')) {
        return
      }
    }

    const success = saveSearch(name, filters)
    if (success) {
      toast.success(`Busqueda "${name}" guardada`)
      setSearchName('')
      setShowSaveInput(false)
    }
  }

  const handleSaveKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setShowSaveInput(false)
      setSearchName('')
    }
  }

  const handleDelete = (e, id, name) => {
    e.stopPropagation()
    if (window.confirm('¿Eliminar esta busqueda guardada?')) {
      deleteSearch(id)
      toast.success(`Busqueda "${name}" eliminada`)
    }
  }

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Save button / inline input */}
      {showSaveInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value.slice(0, 50))}
            onKeyDown={handleSaveKeyDown}
            placeholder="Nombre de la busqueda..."
            className="h-8 w-44 text-xs"
            autoFocus
          />
          <Button size="sm" variant="default" className="h-8 px-2" onClick={handleSave} disabled={!searchName.trim()}>
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setShowSaveInput(false); setSearchName('') }}>
            ✕
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={() => setShowSaveInput(true)}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Guardar</span>
        </Button>
      )}

      {/* Load dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Busquedas</span>
            {savedSearches.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                {savedSearches.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
          <DropdownMenuLabel>Busquedas Guardadas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedSearches.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No hay busquedas guardadas
            </div>
          ) : (
            savedSearches.map((search) => (
              <DropdownMenuItem
                key={search.id}
                onSelect={() => onLoadSearch(search.filters)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{search.name}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDate(search.createdAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, search.id, search.name)}
                  className="shrink-0 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
