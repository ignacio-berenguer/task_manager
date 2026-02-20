import {
  LayoutGrid,
  ClipboardCheck,
  Scale,
  Wallet,
  Activity,
  Shield,
  MessageSquare,
  Plug,
} from 'lucide-react'

const features = [
  {
    name: 'Visualización del Portfolio',
    description: 'Mapas de calor, gráficos de burbujas, roadmaps para vistas claras del portfolio.',
    icon: LayoutGrid,
  },
  {
    name: 'Recepción y Evaluación',
    description: 'Formularios estandarizados, modelos de puntuación y plantillas de caso de negocio.',
    icon: ClipboardCheck,
  },
  {
    name: 'Motor de Priorización',
    description: 'Análisis de valor vs. esfuerzo, modelado de escenarios y puntuación de riesgo.',
    icon: Scale,
  },
  {
    name: 'Seguimiento Financiero',
    description: 'Presupuestos, previsiones, seguimiento de beneficios y valor acumulado.',
    icon: Wallet,
  },
  {
    name: 'Monitoreo de Ejecución',
    description: 'KPIs/OKRs, hitos y seguimiento de estado RAG.',
    icon: Activity,
  },
  {
    name: 'Herramientas de Gobernanza',
    description: 'Puertas de fase, aprobaciones y trazabilidad completa de auditoría.',
    icon: Shield,
  },
  {
    name: 'Colaboración',
    description: 'Comentarios, notificaciones y dashboards compartidos.',
    icon: MessageSquare,
  },
  {
    name: 'Integraciones',
    description: 'Conecte con Jira, Azure DevOps, Power BI, Teams y más.',
    icon: Plug,
  },
]

/**
 * Key features overview section
 */
export function FeaturesSection() {
  return (
    <section className="bg-muted/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold font-heading leading-7 text-primary">
            Solución Integral
          </h2>
          <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Todo lo que necesita para gestionar iniciativas
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
            Un conjunto completo de herramientas para la gestión de portfolio, desde la recepción hasta la
            realización de valor.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold font-heading">{feature.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
