import { Layout } from '@/components/layout/Layout'
import { Skeleton, SkeletonTableRow } from '@/components/ui/skeleton'

export function ReportSkeleton() {
  return (
    <Layout showFooter={false}>
      <div className="mx-auto w-full px-6 sm:px-8 xl:px-12 py-6">
        {/* Title + subtitle */}
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />

        {/* Filter panel placeholder */}
        <Skeleton className="h-10 w-full rounded-lg mb-4" />

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-9 w-28" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} className="p-3">
                    <Skeleton className="h-4 w-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={7} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
