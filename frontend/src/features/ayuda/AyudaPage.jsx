import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import apiClient from '@/api/client'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Layout } from '@/components/layout/Layout'

function AyudaSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <div className="h-8 w-1/3 animate-shimmer rounded" />
      <div className="h-4 w-2/3 animate-shimmer rounded" />
      <div className="h-4 w-full animate-shimmer rounded" />
      <div className="h-4 w-5/6 animate-shimmer rounded" />
      <div className="h-4 w-full animate-shimmer rounded" />
      <div className="h-4 w-3/4 animate-shimmer rounded" />
    </div>
  )
}

export default function AyudaPage() {
  usePageTitle('Ayuda')

  const { data, isLoading, error } = useQuery({
    queryKey: ['readme'],
    queryFn: async () => {
      const res = await apiClient.get('/ayuda/readme')
      return res.data.content
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-8">
        {isLoading && <AyudaSkeleton />}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            No se pudo cargar la documentación.
          </div>
        )}
        {data && (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data}</ReactMarkdown>
          </article>
        )}
      </div>
    </Layout>
  )
}
