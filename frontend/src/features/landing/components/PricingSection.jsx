import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tiers = [
  {
    name: 'Básico',
    description: 'Para equipos pequeños que inician con la gestión de portfolio.',
    price: 'Contáctenos',
    features: [
      'Hasta 50 iniciativas',
      'Dashboards básicos',
      'Soporte por email',
      '5 usuarios',
    ],
    cta: 'Comenzar',
    highlighted: false,
  },
  {
    name: 'Profesional',
    description: 'Para organizaciones en crecimiento con necesidades avanzadas.',
    price: 'Contáctenos',
    features: [
      'Iniciativas ilimitadas',
      'Analítica avanzada',
      'Soporte prioritario',
      'Usuarios ilimitados',
      'Acceso API',
      'Integraciones personalizadas',
    ],
    cta: 'Comenzar',
    highlighted: true,
  },
  {
    name: 'Empresarial',
    description: 'Para grandes organizaciones con requisitos personalizados.',
    price: 'Personalizado',
    features: [
      'Todo lo del plan Profesional',
      'Soporte dedicado',
      'Desarrollo personalizado',
      'Despliegue on-premise',
      'Garantías de SLA',
      'Formación e incorporación',
    ],
    cta: 'Contactar Ventas',
    highlighted: false,
  },
]

/**
 * Pricing overview section
 */
export function PricingSection() {
  return (
    <section className="bg-muted/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold font-heading leading-7 text-primary">
            Precios
          </h2>
          <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Planes para cada organización
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
            Elija el plan que se ajuste a sus necesidades. Todos los planes incluyen funcionalidades principales
            sin costes ocultos.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border bg-card p-8 shadow-sm ${
                tier.highlighted
                  ? 'border-primary ring-2 ring-primary'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Mas Popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold font-heading">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-body">
                {tier.description}
              </p>

              <div className="mt-6">
                <span className="text-3xl font-bold font-data">{tier.price}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={tier.highlighted ? 'default' : 'outline'}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
