import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createStorage } from '@/lib/storage'

const storage = createStorage('search-favorites')

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => storage.loadJSON('list', []))

  const persist = (next) => {
    setFavorites(next)
    storage.saveJSON('list', next)
  }

  const isFavorite = useCallback(
    (portfolioId) => favorites.some((f) => f.portfolioId === portfolioId),
    [favorites]
  )

  const toggleFavorite = useCallback(
    (portfolioId, nombre) => {
      const exists = favorites.some((f) => f.portfolioId === portfolioId)
      if (exists) {
        persist(favorites.filter((f) => f.portfolioId !== portfolioId))
      } else {
        persist([...favorites, { portfolioId, nombre: nombre || portfolioId }])
      }
    },
    [favorites]
  )

  const removeFavorite = useCallback(
    (portfolioId) => {
      persist(favorites.filter((f) => f.portfolioId !== portfolioId))
    },
    [favorites]
  )

  const clearAll = useCallback(() => {
    persist([])
  }, [])

  const copyToClipboard = useCallback(async () => {
    if (favorites.length === 0) return false
    const text = favorites.map((f) => f.portfolioId).join(', ')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(
        `${favorites.length} Portfolio ID${favorites.length > 1 ? 's' : ''} copiado${favorites.length > 1 ? 's' : ''} al portapapeles`
      )
      return true
    } catch {
      toast.error('No se pudo copiar al portapapeles')
      return false
    }
  }, [favorites])

  return {
    favorites,
    count: favorites.length,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAll,
    copyToClipboard,
  }
}
