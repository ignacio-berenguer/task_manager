import { Layout } from '@/components/layout/Layout'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <Layout showFooter={false}>
      <div className="mx-auto w-full px-6 sm:px-8 xl:px-12 py-6">
        {/* Title */}
        <Skeleton className="h-8 w-48 mb-6" />

        {/* Filter bar placeholder */}
        <Skeleton className="h-10 w-full rounded-lg mb-6" />

        {/* KPI cards row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>

        {/* Chart pairs (2-col grid) */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>

        {/* Bottom list cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    </Layout>
  )
}
