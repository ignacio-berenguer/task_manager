import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

/**
 * Jobs page placeholder
 */
export function JobsPage() {
  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Background Jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Job monitoring functionality coming soon.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and manage background data processing tasks.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}
