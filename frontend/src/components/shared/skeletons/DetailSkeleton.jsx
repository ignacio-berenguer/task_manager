import { Layout } from '@/components/layout/Layout'
import { Skeleton } from '@/components/ui/skeleton'

export function DetailSkeleton() {
  return (
    <Layout showFooter={false}>
      <div className="mx-auto w-full px-6 sm:px-8 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-6">
          <Skeleton className="h-4 w-48 mb-3" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Content with sidebar space */}
        <div className="flex gap-6">
          {/* Sidebar placeholder (xl only) */}
          <div className="hidden xl:block w-44 shrink-0">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>

          {/* Main content - accordion sections */}
          <div className="flex-1 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border">
                <div className="flex items-center justify-between p-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
