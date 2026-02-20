import { Shield, Lock, Key, FileCheck, UserCheck } from 'lucide-react'

const securityFeatures = [
  {
    icon: UserCheck,
    title: 'Control de Acceso por Roles',
    description: 'Permisos granulares para controlar quien ve y hace que.',
  },
  {
    icon: Lock,
    title: 'Cifrado de Datos',
    description: 'Todos los datos cifrados en transito y en reposo.',
  },
  {
    icon: Key,
    title: 'Inicio de Sesion Unico',
    description: 'Integración transparente con Azure AD y otros proveedores de identidad.',
  },
  {
    icon: FileCheck,
    title: 'Registro de Auditoria',
    description: 'Trazabilidad completa de todos los cambios y eventos de acceso.',
  },
]

const certifications = ['ISO 27001', 'SOC 2', 'GDPR']

/**
 * Security & compliance section
 */
export function SecuritySection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold font-heading tracking-tight sm:text-4xl">
            Seguridad de Nivel Empresarial
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground font-body">
            Sus datos estan protegidos por medidas de seguridad lideres en la industria y
            certificaciones de cumplimiento.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-2">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-xl border bg-card p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-heading">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-body">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground font-body mb-4">
              Soporte de cumplimiento para
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="rounded-full border bg-card px-6 py-2 text-sm font-medium"
                >
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
