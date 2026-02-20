import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import { Menu, X, LayoutDashboard, Search, FileEdit, FileBarChart, ChevronDown, ClipboardList, ListTodo, Zap, Tags, ArrowLeftRight, FileJson, Settings, Scale, GitBranch, FileText, StickyNote, Star, FolderOpen, Briefcase, Play, FolderSearch, Clock, Trash2, MessageSquare } from 'lucide-react'
import { ModeToggle } from '@/components/theme/ModeToggle'
import { ColorThemeSelector } from '@/components/theme/ColorThemeSelector'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { ConsoleDialog } from '@/components/shared/ConsoleDialog'
import { useRecentInitiatives } from '@/features/detail/hooks/useRecentInitiatives'
import { cn } from '@/lib/utils'

const directNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Búsqueda', href: '/search', icon: Search },
  { name: 'Asistente IA', href: '/chat', icon: MessageSquare },
]

const informesItems = [
  { name: 'Hechos', href: '/informes/hechos', icon: ClipboardList },
  { name: 'LTPs', href: '/informes/ltps', icon: ListTodo },
  { name: 'Acciones', href: '/informes/acciones', icon: Zap },
  { name: 'Etiquetas', href: '/informes/etiquetas', icon: Tags },
  { name: 'Justificaciones', href: '/informes/justificaciones', icon: Scale },
  { name: 'Dependencias', href: '/informes/dependencias', icon: GitBranch },
  { name: 'Descripciones', href: '/informes/descripciones', icon: FileText },
  { name: 'Notas', href: '/informes/notas', icon: StickyNote },
  { name: 'Documentos', href: '/informes/documentos', icon: FolderOpen },
  { name: 'Transacciones', href: '/informes/transacciones', icon: ArrowLeftRight },
  { name: 'Transacciones JSON', href: '/informes/transacciones-json', icon: FileJson },
]

const trailingNavItems = [
  { name: 'Registro', href: '/register', icon: FileEdit },
]

const trabajosItems = [
  { name: 'Proceso completo', command: 'proceso-completo', icon: Play },
  { name: 'Escanear documentos', command: 'escanear-documentos', icon: FolderSearch },
  { name: 'Sumarizar documentos', command: 'sumarizar-documentos', icon: FileText },
]

const parametricasItems = [
  { name: 'Etiquetas Destacadas', href: '/parametricas/etiquetas-destacadas', icon: Star },
  { name: 'Parametricas', href: '/parametricas', icon: Settings },
]

/**
 * Main navigation bar component
 */
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const location = useLocation()
  const { recents, clearRecents } = useRecentInitiatives()

  const isActive = (href) => location.pathname === href
  const isInformesActive = location.pathname.startsWith('/informes')
  const isParametricasActive = location.pathname.startsWith('/parametricas')

  const navLinkClass = (href) =>
    cn(
      'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium font-body transition-colors',
      isActive(href)
        ? 'text-primary font-semibold border-b-2 border-b-primary rounded-b-none'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  const mobileNavLinkClass = (href) =>
    cn(
      'flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium font-body',
      isActive(href)
        ? 'bg-primary/15 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  const handleJobClick = (item) => {
    setActiveJob({
      title: item.name,
      endpoint: `/trabajos/${item.command}`,
    })
    setConsoleOpen(true)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto w-full px-6 sm:px-8 xl:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                <span className="text-lg font-bold font-heading">P</span>
              </div>
              <span className="hidden font-semibold font-heading sm:inline-block">
                Portfolio Digital
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <SignedIn>
                {/* Direct nav items (Dashboard, Busqueda) */}
                {directNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Recientes dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium font-body transition-colors',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      <span>Recientes</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    {recents.length === 0 ? (
                      <DropdownMenuItem disabled>
                        <span className="text-muted-foreground text-sm">Sin iniciativas recientes</span>
                      </DropdownMenuItem>
                    ) : (
                      <>
                        {recents.map((item) => (
                          <DropdownMenuItem key={item.portfolio_id} asChild>
                            <Link
                              to={`/detail/${item.portfolio_id}`}
                              state={{ from: { route: location.pathname, label: 'Recientes' } }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <span className="font-medium shrink-0">{item.portfolio_id}</span>
                              <span className="text-muted-foreground truncate text-xs">{item.nombre}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <div className="border-t my-1" />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            clearRecents()
                          }}
                        >
                          <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-xs">Limpiar historial</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Informes dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium font-body transition-colors',
                        isInformesActive
                          ? 'text-primary font-semibold border-b-2 border-b-primary rounded-b-none'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <FileBarChart className="h-4 w-4" />
                      <span>Informes</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {informesItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Trailing nav items (Registro) */}
                {trailingNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClass(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Trabajos dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium font-body transition-colors',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>Trabajos</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {trabajosItems.map((item) => (
                      <DropdownMenuItem
                        key={item.name}
                        onSelect={(e) => {
                          e.preventDefault()
                          handleJobClick(item)
                        }}
                      >
                        <div className="flex items-center gap-2 cursor-pointer">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Parametricas dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium font-body transition-colors',
                        isParametricasActive
                          ? 'text-primary font-semibold border-b-2 border-b-primary rounded-b-none'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Parametricas</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {parametricasItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SignedIn>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <SignedIn>
                <GlobalSearch />
              </SignedIn>
              <ColorThemeSelector />
              <ModeToggle />

              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
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
                  {/* Global Search button */}
                  <button
                    className={cn(
                      'flex w-full items-center space-x-2 rounded-md px-3 py-2 text-base font-medium font-body',
                      'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('open-global-search'))
                      }, 100)
                    }}
                  >
                    <Search className="h-5 w-5" />
                    <span>Buscar</span>
                  </button>

                  <div className="my-1 h-px bg-border" />

                  {/* Direct nav items */}
                  {directNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={mobileNavLinkClass(item.href)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {/* Informes section */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Informes
                  </div>
                  {informesItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(mobileNavLinkClass(item.href), 'pl-8')}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {/* Recientes section */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recientes
                  </div>
                  {recents.length === 0 ? (
                    <div className="pl-8 px-3 py-2 text-sm text-muted-foreground">
                      Sin iniciativas recientes
                    </div>
                  ) : (
                    recents.slice(0, 5).map((item) => (
                      <Link
                        key={item.portfolio_id}
                        to={`/detail/${item.portfolio_id}`}
                        state={{ from: { route: location.pathname, label: 'Recientes' } }}
                        className={cn(mobileNavLinkClass(''), 'pl-8')}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Clock className="h-5 w-5" />
                        <span className="truncate">{item.portfolio_id} — {item.nombre}</span>
                      </Link>
                    ))
                  )}

                  {/* Trailing nav items */}
                  {trailingNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={mobileNavLinkClass(item.href)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {/* Trabajos section */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trabajos
                  </div>
                  {trabajosItems.map((item) => (
                    <button
                      key={item.name}
                      className={cn(
                        'flex w-full items-center space-x-2 rounded-md px-3 py-2 pl-8 text-base font-medium font-body',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleJobClick(item)
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  ))}

                  {/* Parametricas section */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Parametricas
                  </div>
                  {parametricasItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(mobileNavLinkClass(item.href), 'pl-8')}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </SignedIn>
        </div>
      </nav>

      {/* Console Dialog — rendered outside nav to avoid z-index issues */}
      <ConsoleDialog
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        title={activeJob?.title}
        endpoint={activeJob?.endpoint}
      />
    </>
  )
}
