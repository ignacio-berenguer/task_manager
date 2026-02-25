import { useEffect, useRef } from 'react'
import { useShortcutContext } from '@/providers/KeyboardShortcutProvider'

/**
 * Hook to register keyboard shortcuts for a component.
 * Shortcuts are registered on mount and unregistered on unmount.
 *
 * @param {Array} shortcuts - Array of shortcut definitions:
 *   {
 *     id: string,            // unique identifier
 *     keys: string,          // display string (e.g. "Ctrl+Enter", "?", "g → s")
 *     key: string,           // KeyboardEvent.key value
 *     modifiers?: { ctrl?, shift?, alt? },
 *     description: string,   // human-readable description
 *     category: string,      // grouping: "Global", "Búsqueda", "Detalle", "Chat"
 *     action: () => void,
 *     enabled?: boolean,     // default true
 *     alwaysActive?: boolean,// fires even when input is focused
 *     sequence?: string,     // prefix key for sequence shortcuts (e.g. "g")
 *     sequenceKey?: string,  // second key in sequence (e.g. "s")
 *   }
 * @param {Array} deps - dependency array to trigger re-registration
 */
export function useKeyboardShortcuts(shortcuts, deps = []) {
  const { registerShortcut, unregisterShortcut } = useShortcutContext()
  const prevIdsRef = useRef([])

  useEffect(() => {
    // Unregister previous shortcuts
    for (const id of prevIdsRef.current) {
      unregisterShortcut(id)
    }

    // Register new shortcuts
    const ids = []
    for (const shortcut of shortcuts) {
      const s = { ...shortcut, enabled: shortcut.enabled !== false }
      registerShortcut(s)
      ids.push(s.id)
    }
    prevIdsRef.current = ids

    return () => {
      for (const id of ids) {
        unregisterShortcut(id)
      }
      prevIdsRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
