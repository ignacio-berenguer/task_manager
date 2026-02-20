import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEME_IDS, DEFAULT_THEME_ID } from '@/lib/themes'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ColorTheme')

const STORAGE_KEY = 'portfolio-color-theme'

const ColorThemeContext = createContext({
  colorTheme: DEFAULT_THEME_ID,
  setColorTheme: () => {},
})

function applyThemeToDOM(themeId) {
  const root = document.documentElement
  if (themeId === DEFAULT_THEME_ID) {
    root.removeAttribute('data-color-theme')
  } else {
    root.setAttribute('data-color-theme', themeId)
  }
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && THEME_IDS.includes(stored)) return stored
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_THEME_ID
}

export function ColorThemeProvider({ children }) {
  const [colorTheme, setColorThemeState] = useState(() => {
    const initial = getStoredTheme()
    applyThemeToDOM(initial)
    return initial
  })

  const setColorTheme = useCallback((themeId) => {
    if (!THEME_IDS.includes(themeId)) {
      logger.warn('Invalid theme ID, falling back to default', { themeId })
      themeId = DEFAULT_THEME_ID
    }
    logger.info('Color theme changed', { themeId })
    setColorThemeState(themeId)
    applyThemeToDOM(themeId)
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  // Sync on mount in case SSR/hydration mismatch
  useEffect(() => {
    applyThemeToDOM(colorTheme)
  }, [colorTheme])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  return useContext(ColorThemeContext)
}
