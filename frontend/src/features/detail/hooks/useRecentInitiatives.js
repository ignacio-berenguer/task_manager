import { useSyncExternalStore, useCallback } from 'react'
import { createStorage } from '@/lib/storage'

const recentStorage = createStorage('portfolio-recent')
const MAX_RECENTS = 10
const CHANGE_EVENT = 'recent-initiatives-change'

// Module-level cache so all subscribers see the same data
let cache = recentStorage.loadJSON('initiatives', [])

function getSnapshot() {
  return cache
}

function subscribe(callback) {
  const handler = () => {
    cache = recentStorage.loadJSON('initiatives', [])
    callback()
  }
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useRecentInitiatives() {
  const recents = useSyncExternalStore(subscribe, getSnapshot)

  const addRecent = useCallback((portfolio_id, nombre) => {
    const current = recentStorage.loadJSON('initiatives', [])
    const filtered = current.filter((r) => r.portfolio_id !== portfolio_id)
    const updated = [{ portfolio_id, nombre, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS)
    recentStorage.saveJSON('initiatives', updated)
    cache = updated
    notify()
  }, [])

  const clearRecents = useCallback(() => {
    recentStorage.saveJSON('initiatives', [])
    cache = []
    notify()
  }, [])

  return { recents, addRecent, clearRecents }
}
