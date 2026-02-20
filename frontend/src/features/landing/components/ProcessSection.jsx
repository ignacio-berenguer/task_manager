import { Lightbulb, FileSearch, ArrowUpDown, Rocket } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Capturar',
    description: 'Recoja ideas y casos de negocio mediante formularios estandarizados.',
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'Evaluar',
    description: 'Puntue impacto, coste y riesgo con criterios estructurados.',
    icon: FileSearch,
  },
  {
    number: '03',
    title: 'Priorizar',
    description: 'Compare escenarios y alinee con objetivos estratégicos.',
    icon: ArrowUpDown,
  },
  {
    number: '04',
    title: 'Ejecutar',
    description: 'Monitoree la entrega, riesgos y realización de valor en tiempo real.',
    icon: Rocket,
  },
]

/**
 * Process overview section (How It Works)
 */
export function ProcessSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold font-heading leading-7 text-primary">
            Cómo Funciona
          </h2>
          <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Cuatro simples pasos hacia el éxito del portfolio
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
            Un proceso optimizado que le lleva desde la idea hasta la entrega de valor.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-border lg:block" />

            <div className="grid gap-8 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="relative text-center">
                  {/* Step indicator */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg">
                    <step.icon className="h-7 w-7" />
                  </div>

                  {/* Step number */}
                  <div className="mt-4 text-sm font-medium font-data text-primary">
                    Paso {step.number}
                  </div>

                  {/* Content */}
                  <h3 className="mt-2 text-xl font-semibold font-heading">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">
                    {step.description}
                  </p>

                  {/* Arrow for mobile/tablet */}
                  {index < steps.length - 1 && (
                    <div className="mt-6 flex justify-center lg:hidden">
                      <svg
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
