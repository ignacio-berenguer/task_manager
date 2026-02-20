import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Página no encontrada')
  return (
    <Layout>
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          La página que busca no existe o ha sido movida.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Volver al Dashboard
        </Link>
      </div>
    </Layout>
  )
}
