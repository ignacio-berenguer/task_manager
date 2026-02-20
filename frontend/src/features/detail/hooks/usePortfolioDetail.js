import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PortfolioDetail')

/**
 * Hook to fetch all data for a single portfolio
 */
export function usePortfolioDetail(portfolioId) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      logger.info('Fetching portfolio detail', { portfolioId })

      const response = await apiClient.get(`/portfolio/${portfolioId}`)

      logger.info('Portfolio detail loaded', {
        portfolioId,
        tables: Object.keys(response.data).length,
      })

      return response.data
    },
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
