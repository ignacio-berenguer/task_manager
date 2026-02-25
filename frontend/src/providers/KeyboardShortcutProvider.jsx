import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const KeyboardShortcutContext = createContext(null)

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isInputFocused() {
  const el = document.activeElement
  if (!el) return false
  if (INPUT_TAGS.has(el.tagName)) return true
  if (el.isContentEditable) return true
  return false
}

function matchesShortcut(e, shortcut) {
  const ctrl = !!shortcut.modifiers?.ctrl
  const shift = !!shortcut.modifiers?.shift
  const alt = !!shortcut.modifiers?.alt

  if (e.ctrlKey !== ctrl || e.metaKey !== ctrl) {
    if (!ctrl && !e.ctrlKey && !e.metaKey) { /* ok */ }
    else if (ctrl && (e.ctrlKey || e.metaKey)) { /* ok */ }
    else return false
  }
  if (e.shiftKey !== shift) return false
  if (e.altKey !== alt) return false

  return e.key === shortcut.key
}

export function KeyboardShortcutProvider({ children }) {
  const shortcutsRef = useRef(new Map())
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const pendingSequenceRef = useRef(null)
  const sequenceTimeoutRef = useRef(null)
  const [sequenceIndicator, setSequenceIndicator] = useState(null)

  const registerShortcut = useCallback((shortcut) => {
    shortcutsRef.current.set(shortcut.id, shortcut)
  }, [])

  const unregisterShortcut = useCallback((id) => {
    shortcutsRef.current.delete(id)
  }, [])

  const toggleOverlay = useCallback(() => {
    setIsOverlayOpen(prev => !prev)
  }, [])

  const openOverlay = useCallback(() => {
    setIsOverlayOpen(true)
  }, [])

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false)
  }, [])

  const getShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values())
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      const inputFocused = isInputFocused()

      // Handle sequence shortcuts (second key)
      if (pendingSequenceRef.current) {
        const prefix = pendingSequenceRef.current
        clearTimeout(sequenceTimeoutRef.current)
        pendingSequenceRef.current = null
        setSequenceIndicator(null)

        if (inputFocused) return

        for (const shortcut of shortcutsRef.current.values()) {
          if (!shortcut.enabled) continue
          if (shortcut.sequence !== prefix) continue
          if (e.key === shortcut.sequenceKey) {
            e.preventDefault()
            shortcut.action()
            return
          }
        }
        return
      }

      // Check for sequence starters (e.g., 'g')
      if (!inputFocused) {
        const isSequenceStarter = Array.from(shortcutsRef.current.values()).some(
          s => s.enabled && s.sequence && s.sequence === e.key && !s.modifiers?.ctrl && !s.modifiers?.shift && !s.modifiers?.alt
        )
        if (isSequenceStarter && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          pendingSequenceRef.current = e.key
          setSequenceIndicator(`${e.key}...`)
          sequenceTimeoutRef.current = setTimeout(() => {
            pendingSequenceRef.current = null
            setSequenceIndicator(null)
          }, 1000)
          return
        }
      }

      // Regular shortcuts
      for (const shortcut of shortcutsRef.current.values()) {
        if (!shortcut.enabled) continue
        if (shortcut.sequence) continue // skip sequence shortcuts here
        if (inputFocused && !shortcut.alwaysActive) continue
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault()
          shortcut.action()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cleanup sequence timeout on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current)
      }
    }
  }, [])

  const value = {
    registerShortcut,
    unregisterShortcut,
    isOverlayOpen,
    toggleOverlay,
    openOverlay,
    closeOverlay,
    getShortcuts,
    sequenceIndicator,
  }

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
      {sequenceIndicator && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] rounded-lg bg-popover border border-border px-3 py-1.5 text-sm font-mono text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          {sequenceIndicator}
        </div>
      )}
    </KeyboardShortcutContext.Provider>
  )
}

export function useShortcutContext() {
  const ctx = useContext(KeyboardShortcutContext)
  if (!ctx) {
    throw new Error('useShortcutContext must be used within KeyboardShortcutProvider')
  }
  return ctx
}
