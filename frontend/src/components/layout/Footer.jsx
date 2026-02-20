import { Link } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'

const footerLinks = [
  { name: 'Contacto', href: '#' },
  { name: 'Documentacion', href: '#' },
  { name: 'Politica de Privacidad', href: '#' },
  { name: 'Terminos de Servicio', href: '#' },
]

/**
 * Footer component
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full px-6 py-8 sm:px-8 xl:px-12">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          {/* Copyright */}
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">
              {currentYear} Task Manager. Todos los derechos reservados.
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
