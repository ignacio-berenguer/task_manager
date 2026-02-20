import { useState, useCallback } from 'react'
import { loadSavedSearches, saveSavedSearches } from '../utils/searchStorage'

const MAX_SAVED_SEARCHES = 20

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState(() => loadSavedSearches())

  const persist = useCallback((updated) => {
    setSavedSearches(updated)
    saveSavedSearches(updated)
  }, [])

  const saveSearch = useCallback((name, filters) => {
    const trimmed = name.trim().slice(0, 50)
    if (!trimmed) return false

    const existing = savedSearches.find((s) => s.name === trimmed)
    if (existing) {
      // Overwrite existing
      const updated = savedSearches.map((s) =>
        s.id === existing.id ? { ...s, filters, createdAt: new Date().toISOString() } : s
      )
      persist(updated)
      return true
    }

    if (savedSearches.length >= MAX_SAVED_SEARCHES) {
      return false
    }

    const newEntry = {
      id: Date.now().toString(36),
      name: trimmed,
      filters,
      createdAt: new Date().toISOString(),
    }
    persist([newEntry, ...savedSearches])
    return true
  }, [savedSearches, persist])

  const deleteSearch = useCallback((id) => {
    persist(savedSearches.filter((s) => s.id !== id))
  }, [savedSearches, persist])

  const hasName = useCallback((name) => {
    return savedSearches.some((s) => s.name === name.trim())
  }, [savedSearches])

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    hasName,
    isFull: savedSearches.length >= MAX_SAVED_SEARCHES,
  }
}
