import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import apiClient from '@/api/client'

/**
 * Fetch parametric dropdown options for all fields that have `parametric` property.
 *
 * @param {Array<{key: string, parametric?: string}>} fields - Field definitions
 * @returns {{ optionsMap: Record<string, string[]>, isLoading: boolean }}
 */
export function useParametricFields(fields) {
  // Collect unique parametric names (deduplicate for fields sharing same parameter)
  const parametricFields = useMemo(
    () => fields.filter((f) => f.parametric),
    [fields],
  )

  const queries = useQueries({
    queries: parametricFields.map((f) => ({
      queryKey: ['parametros', f.parametric],
      queryFn: () =>
        apiClient.get(`/parametros/${f.parametric}`).then((r) => r.data.valores),
      staleTime: 10 * 60 * 1000, // 10 minutes — values change rarely
    })),
  })

  const optionsMap = useMemo(() => {
    const map = {}
    parametricFields.forEach((f, i) => {
      const raw = queries[i].data || []
      // Support both string[] (legacy) and {valor, color}[] (new format)
      map[f.key] = raw.map((v) => (typeof v === 'string' ? v : v.valor))
    })
    return map
  }, [parametricFields, queries])

  const isLoading = queries.some((q) => q.isLoading)

  return { optionsMap, isLoading }
}
