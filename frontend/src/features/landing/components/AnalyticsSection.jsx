import { LineChart, Layers, Brain, TrendingUp, Users } from 'lucide-react'

const capabilities = [
  {
    icon: LineChart,
    title: 'Dashboards en Tiempo Real',
    description: 'Metricas del portfolio y KPIs en vivo al alcance de su mano.',
  },
  {
    icon: Layers,
    title: 'Modelado de Escenarios',
    description: 'Modele compensaciones y compare diferentes estrategias de portfolio.',
  },
  {
    icon: Brain,
    title: 'Analitica Predictiva',
    description: 'Insights impulsados por IA para anticipar riesgos y oportunidades.',
  },
  {
    icon: TrendingUp,
    title: 'Realización de Valor',
    description: 'Seguimiento de la entrega de beneficios contra los casos de negocio.',
  },
  {
    icon: Users,
    title: 'Insights de Recursos',
    description: 'Planificación de capacidad y visibilidad de utilización.',
  },
]

/**
 * Portfolio analytics section
 */
export function AnalyticsSection() {
  return (
    <section className="bg-muted/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-base font-semibold font-heading leading-7 text-primary">
              Analitica del Portfolio
            </h2>
            <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
              Decisiones basadas en datos
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
              Transforme datos en bruto en insights accionables. Nuestro motor de analítica
              le ayuda a comprender la salud del portfolio, identificar riesgos y optimizar
              la asignación de recursos.
            </p>

            <div className="mt-10 space-y-6">
              {capabilities.map((capability) => (
                <div key={capability.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <capability.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-heading">
                      {capability.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground font-body">
                      {capability.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual placeholder */}
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <div className="h-full w-full rounded-xl border bg-card/80 backdrop-blur p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg bg-muted/50 p-4">
                        <div className="h-3 w-1/2 rounded bg-muted mb-2" />
                        <div className="h-6 w-full rounded bg-primary/20" />
                      </div>
                    ))}
                  </div>
                  <div className="h-32 rounded-lg bg-muted/30" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-lg bg-muted/30" />
                    <div className="h-24 rounded-lg bg-muted/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
