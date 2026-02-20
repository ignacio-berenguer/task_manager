import { useCallback, useRef } from 'react'

export function useCommandHistory(maxSize = 50) {
  const historyRef = useRef([])
  const pointerRef = useRef(-1)
  const draftRef = useRef('')

  const push = useCallback((command) => {
    if (!command.trim()) return
    // Avoid duplicating the last entry
    if (historyRef.current.length > 0 && historyRef.current[historyRef.current.length - 1] === command) {
      pointerRef.current = -1
      return
    }
    historyRef.current.push(command)
    if (historyRef.current.length > maxSize) {
      historyRef.current.shift()
    }
    pointerRef.current = -1
  }, [maxSize])

  const navigateUp = useCallback((currentValue) => {
    if (historyRef.current.length === 0) return null
    if (pointerRef.current === -1) {
      draftRef.current = currentValue
      pointerRef.current = historyRef.current.length - 1
    } else if (pointerRef.current > 0) {
      pointerRef.current--
    } else {
      return null // Already at oldest
    }
    return historyRef.current[pointerRef.current]
  }, [])

  const navigateDown = useCallback(() => {
    if (pointerRef.current === -1) return null
    if (pointerRef.current < historyRef.current.length - 1) {
      pointerRef.current++
      return historyRef.current[pointerRef.current]
    } else {
      pointerRef.current = -1
      return draftRef.current
    }
  }, [])

  const reset = useCallback(() => {
    pointerRef.current = -1
  }, [])

  return { push, navigateUp, navigateDown, reset }
}
