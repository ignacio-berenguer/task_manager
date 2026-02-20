import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import { Menu, X, Search, MessageSquare, CheckSquare } from 'lucide-react'
import { ModeToggle } from '@/components/theme/ModeToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Busqueda', href: '/search', icon: Search },
  { name: 'Asistente IA', href: '/chat', icon: MessageSquare },
]

/**
 * Main navigation bar component
 */
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (href) => location.pathname === href

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto w-full px-6 sm:px-8 xl:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="hidden font-semibold sm:inline-block">
              Task Manager
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
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
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
  )
}
