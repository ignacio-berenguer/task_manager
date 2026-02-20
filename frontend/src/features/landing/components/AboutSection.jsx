import { Target, Zap, Heart } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: 'Orientados por la Misión',
    description: 'Ayudamos a las organizaciones a lograr el éxito en la transformación digital.',
  },
  {
    icon: Zap,
    title: 'Innovación Primero',
    description: 'Mejora continua basada en los comentarios de los usuarios y las necesidades del mercado.',
  },
  {
    icon: Heart,
    title: 'Enfoque en el Cliente',
    description: 'Su éxito es nuestro éxito. Somos socios en su camino.',
  },
]

/**
 * About us / mission section
 */
export function AboutSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-base font-semibold font-heading leading-7 text-primary">
            Sobre Nosotros
          </h2>
          <p className="mt-2 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Nuestra Misión
          </p>
          <p className="mt-6 text-xl leading-8 text-muted-foreground font-body">
            Ayudamos a las organizaciones a ejecutar con éxito la transformación digital
            proporcionando una plataforma que unifica la toma de decisiones, la gobernanza y
            el seguimiento de valor en todo el ciclo de vida de las iniciativas digitales.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold font-heading">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground font-body">
            Listo para transformar la gestión de su portfolio?
          </p>
          <p className="mt-2 text-2xl font-bold font-heading text-primary">
            Hablemos.
          </p>
        </div>
      </div>
    </section>
  )
}
