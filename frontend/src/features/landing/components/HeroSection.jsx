import { useAuth } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { CheckSquare, ArrowRight } from 'lucide-react'

export function HeroSection() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <CheckSquare className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Task Manager
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
          Gestiona tus tareas y acciones de forma eficiente.
          Busca, filtra y haz seguimiento del progreso de tu equipo.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          {isSignedIn ? (
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Ir a Busqueda
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Iniciar Sesion
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
