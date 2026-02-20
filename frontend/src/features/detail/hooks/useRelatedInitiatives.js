import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useRelatedInitiatives(portfolioId) {
  return useQuery({
    queryKey: ['portfolio-related', portfolioId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/portfolio/${portfolioId}/related`)
      return data
    },
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
  })
}
