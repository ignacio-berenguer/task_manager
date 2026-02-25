import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ShortcutHelpOverlay } from '@/components/shared/ShortcutHelpOverlay'
import { useShortcutContext } from '@/providers/KeyboardShortcutProvider'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

/**
 * Main layout wrapper with navbar and footer
 */
export function Layout({ children, showFooter = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn } = useAuth()
  const { toggleOverlay, isOverlayOpen, closeOverlay } = useShortcutContext()

  const handleGoSearch = useCallback(() => {
    if (location.pathname === '/search') {
      // Focus the search input if already on search page
      const input = document.querySelector('[data-search-input]')
      if (input) input.focus()
    } else if (isSignedIn) {
      navigate('/search')
    }
  }, [location.pathname, isSignedIn, navigate])

  const handleEscape = useCallback(() => {
    if (isOverlayOpen) {
      closeOverlay()
    }
  }, [isOverlayOpen, closeOverlay])

  useKeyboardShortcuts([
    {
      id: 'global.help',
      keys: 'F1',
      key: 'F1',
      description: 'Mostrar atajos de teclado',
      category: 'Global',
      action: toggleOverlay,
      alwaysActive: true,
    },
    {
      id: 'global.escape',
      keys: 'Esc',
      key: 'Escape',
      description: 'Cerrar panel / Volver',
      category: 'Global',
      action: handleEscape,
      alwaysActive: true,
    },
    {
      id: 'global.search',
      keys: '/',
      key: '/',
      description: 'Ir a búsqueda',
      category: 'Global',
      action: handleGoSearch,
    },
    // Sequence shortcuts: g → s, g → c, g → h
    {
      id: 'global.goto.search',
      keys: 'g → s',
      key: 'g',
      sequence: 'g',
      sequenceKey: 's',
      description: 'Ir a Búsqueda',
      category: 'Global',
      action: () => isSignedIn && navigate('/search'),
    },
    {
      id: 'global.goto.chat',
      keys: 'g → c',
      key: 'g',
      sequence: 'g',
      sequenceKey: 'c',
      description: 'Ir a Chat',
      category: 'Global',
      action: () => isSignedIn && navigate('/chat'),
    },
    {
      id: 'global.goto.home',
      keys: 'g → h',
      key: 'g',
      sequence: 'g',
      sequenceKey: 'h',
      description: 'Ir a Inicio',
      category: 'Global',
      action: () => navigate('/'),
    },
  ], [toggleOverlay, handleEscape, handleGoSearch, isSignedIn, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      {showFooter && <Footer />}
      <ShortcutHelpOverlay />
    </div>
  )
}
