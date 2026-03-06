import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import { Menu, X, Search, MessageSquare, Settings, Download, ChevronDown, Loader2, HelpCircle, Keyboard, TableProperties, FileText } from 'lucide-react'
import { ModeToggle } from '@/components/theme/ModeToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { exportDatabase } from '@/api/admin'
import { useShortcutContext } from '@/providers/KeyboardShortcutProvider'
import { createLogger } from '@/lib/logger'
import { VERSION_STRING } from '@/lib/version'

const logger = createLogger('Navbar')

const navItems = [
  { name: 'Busqueda', href: '/search', icon: Search },
  { name: 'Asistente IA', href: '/chat', icon: MessageSquare },
]

/**
 * Main navigation bar component
 */
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isAdminMobileOpen, setIsAdminMobileOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isHelpMobileOpen, setIsHelpMobileOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const location = useLocation()
  const adminRef = useRef(null)
  const helpRef = useRef(null)
  const { openOverlay } = useShortcutContext()

  const isActive = (href) => location.pathname === href

  // Close admin dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setIsAdminOpen(false)
      }
    }
    if (isAdminOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAdminOpen])

  // Close admin dropdown on Escape
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') setIsAdminOpen(false)
    }
    if (isAdminOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isAdminOpen])

  // Close help dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setIsHelpOpen(false)
      }
    }
    if (isHelpOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isHelpOpen])

  // Close help dropdown on Escape
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') setIsHelpOpen(false)
    }
    if (isHelpOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isHelpOpen])

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      await exportDatabase()
    } catch (err) {
      logger.error('Error al exportar la base de datos', err)
    } finally {
      setIsExporting(false)
      setIsAdminOpen(false)
      setIsAdminMobileOpen(false)
    }
  }

  const handleOpenShortcuts = () => {
    setIsHelpOpen(false)
    setIsHelpMobileOpen(false)
    setIsMobileMenuOpen(false)
    openOverlay()
  }

  const navLinkClass = (href) =>
    cn(
      'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive(href)
        ? 'text-primary font-semibold border-b-2 border-b-primary rounded-b-none'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  const mobileNavLinkClass = (href) =>
    cn(
      'flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium',
      isActive(href)
        ? 'bg-primary/15 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl" aria-label="Navegación principal">
      <div className="mx-auto w-full px-6 sm:px-8 xl:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc2626]">
              <span className="text-lg font-bold leading-none text-white">T</span>
            </div>
            <span className="hidden font-semibold sm:inline-block">
              Task Manager
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline-block">
              v{VERSION_STRING}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <SignedIn>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClass(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Admin dropdown */}
              <div className="relative" ref={adminRef}>
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  aria-expanded={isAdminOpen}
                  aria-haspopup="true"
                  className={cn(
                    'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Administrador</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', isAdminOpen && 'rotate-180')} />
                </button>

                {isAdminOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md" role="menu">
                    <Link
                      to="/admin"
                      role="menuitem"
                      className="flex w-full items-center space-x-2 rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      <TableProperties className="h-4 w-4" />
                      <span>Tablas parametricas</span>
                    </Link>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      role="menuitem"
                      className="flex w-full items-center space-x-2 rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>{isExporting ? 'Exportando...' : 'Exportar base de datos'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Help dropdown */}
              <div className="relative" ref={helpRef}>
                <button
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  aria-expanded={isHelpOpen}
                  aria-haspopup="true"
                  className={cn(
                    'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Ayuda</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', isHelpOpen && 'rotate-180')} />
                </button>

                {isHelpOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md" role="menu">
                    <button
                      onClick={handleOpenShortcuts}
                      role="menuitem"
                      className="flex w-full items-center space-x-2 rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Keyboard className="h-4 w-4" />
                      <span>Atajos de teclado</span>
                      <kbd className="ml-auto rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">F1</kbd>
                    </button>
                    <Link
                      to="/ayuda"
                      role="menuitem"
                      className="flex w-full items-center space-x-2 rounded-sm px-2 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsHelpOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Documentación</span>
                    </Link>
                  </div>
                )}
              </div>
            </SignedIn>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <ModeToggle />

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Iniciar Sesion
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Registrarse</Button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </SignedIn>

            {/* Mobile menu button */}
            <SignedIn>
              <button
                className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Menú de navegación"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </SignedIn>
          </div>
        </div>

        {/* Mobile Navigation */}
        <SignedIn>
          {isMobileMenuOpen && (
            <div className="border-t md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={mobileNavLinkClass(item.href)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Admin accordion */}
                <button
                  onClick={() => setIsAdminMobileOpen(!isAdminMobileOpen)}
                  aria-expanded={isAdminMobileOpen}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Administrador</span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', isAdminMobileOpen && 'rotate-180')} />
                </button>

                {isAdminMobileOpen && (
                  <>
                    <Link
                      to="/admin"
                      className="flex w-full items-center space-x-2 rounded-md px-3 py-2 pl-10 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <TableProperties className="h-5 w-5" />
                      <span>Tablas parametricas</span>
                    </Link>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex w-full items-center space-x-2 rounded-md px-3 py-2 pl-10 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      <span>{isExporting ? 'Exportando...' : 'Exportar base de datos'}</span>
                    </button>
                  </>
                )}

                {/* Help accordion */}
                <button
                  onClick={() => setIsHelpMobileOpen(!isHelpMobileOpen)}
                  aria-expanded={isHelpMobileOpen}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5" />
                    <span>Ayuda</span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', isHelpMobileOpen && 'rotate-180')} />
                </button>

                {isHelpMobileOpen && (
                  <>
                    <button
                      onClick={handleOpenShortcuts}
                      className="flex w-full items-center space-x-2 rounded-md px-3 py-2 pl-10 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Keyboard className="h-5 w-5" />
                      <span>Atajos de teclado</span>
                    </button>
                    <Link
                      to="/ayuda"
                      className="flex w-full items-center space-x-2 rounded-md px-3 py-2 pl-10 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="h-5 w-5" />
                      <span>Documentación</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </SignedIn>
      </div>
    </nav>
  )
}
