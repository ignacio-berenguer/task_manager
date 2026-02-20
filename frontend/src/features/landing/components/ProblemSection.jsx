import { AlertTriangle, Eye, Target, BarChart3 } from 'lucide-react'

const problems = [
  {
    icon: Eye,
    title: 'Vistas Fragmentadas',
    description: 'Datos dispersos en múltiples hojas de cálculo y sistemas',
  },
  {
    icon: Target,
    title: 'Evaluación Inconsistente',
    description: 'Sin criterios estandarizados para evaluar iniciativas',
  },
  {
    icon: BarChart3,
    title: 'Priorización Difícil',
    description: 'Difícil comparar y clasificar proyectos en competencia',
  },
  {
    icon: AlertTriangle,
    title: 'Visibilidad Limitada',
    description: 'Poca visibilidad del progreso, riesgos y entrega de valor',
  },
]

/**
 * Problem statement section
 */
export function ProblemSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold font-heading leading-7 text-primary">
            El Desafío
          </h2>
          <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Gestionar iniciativas digitales es complejo
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
            Las organizaciones luchan por gestionar las iniciativas digitales de manera efectiva
            debido a desafíos comunes que ralentizan los esfuerzos de transformación.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem) => (
              <div
                key={problem.title}
                className="relative rounded-2xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <problem.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold font-heading">{problem.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <p className="text-lg font-medium font-body">
              Esta plataforma resuelve estos desafios{' '}
              <span className="text-primary">
                centralizando el ciclo de vida del portfolio
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
