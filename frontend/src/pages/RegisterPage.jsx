import { FileEdit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

/**
 * Register page placeholder
 */
export function RegisterPage() {
  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileEdit className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Register Initiative</h1>
          <p className="mt-2 text-muted-foreground">
            Initiative registration functionality coming soon.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and submit new digital initiative proposals.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}
