import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useOverviewStats } from '../hooks/useOverviewStats'
import { formatNumber, formatImporte } from '@/lib/utils'

/**
 * Fallback stats shown while loading or on error
 */
const FALLBACK_STATS = [
  { value: '800+', label: 'Iniciativas Gestionadas' },
  { value: '€50M+', label: 'Presupuesto Controlado' },
  { value: '24', label: 'Tablas de Datos' },
  { value: '99.9%', label: 'Disponibilidad' },
]

/**
 * Build stats array from API data
 */
function buildStats(data) {
  return [
    { value: formatNumber(data.total_iniciativas), label: 'Iniciativas Gestionadas' },
    { value: formatImporte(data.presupuesto_total), label: 'Presupuesto Controlado' },
    { value: String(data.total_tablas), label: 'Tablas de Datos' },
    { value: '99.9%', label: 'Disponibilidad' },
  ]
}

/**
 * Hero section with value proposition and dynamic stats
 */
export function HeroSection() {
  const { data, isLoading, isError } = useOverviewStats()

  const stats = data && !isError ? buildStats(data) : FALLBACK_STATS

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_hsl(var(--color-primary)/0.08)_0%,_transparent_70%)] py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm font-body">
            <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Nuevo
            </span>
            Plataforma de Gestion de Portfolio Digital
          </div>

          {/* Main headline */}
          <h1 className="text-3xl font-bold font-heading tracking-tighter sm:text-4xl lg:text-5xl">
            Gestione, priorice y acelere sus{' '}
            <span className="text-primary">iniciativas digitales</span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg font-body leading-8 text-muted-foreground sm:text-xl">
            Una plataforma unica para visualizar la estrategia, seguir el progreso y maximizar
            la realización de valor. Transforme cómo su organización gestiona la
            transformación digital.
          </p>

          {/* CTA */}
          <div className="mt-8 flex justify-center gap-4">
            <SignedIn>
              <Button asChild size="lg">
                <Link to="/dashboard">Ir al Dashboard</Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <Button asChild size="lg">
                <Link to="/sign-in">Iniciar Sesión</Link>
              </Button>
            </SignedOut>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                {isLoading ? (
                  <div className="mx-auto h-9 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-3xl font-medium font-data text-primary">{stat.value}</div>
                )}
                <div className="mt-1 text-sm font-body text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-primary/30 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </section>
  )
}
