import { useMutation } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ReportSearch')

/**
 * Hook for searching report data
 * @param {string} endpoint - API endpoint path (e.g., '/hechos/search-report-hechos')
 */
export function useReportSearch(endpoint) {
  return useMutation({
    mutationFn: async (requestBody) => {
      logger.info(`Searching report data: ${endpoint}`, {
        limit: requestBody.limit,
        offset: requestBody.offset,
      })

      const response = await apiClient.post(endpoint, requestBody)

      logger.info('Report search completed', { total: response.data.total })
      return response.data
    },
    onError: (error) => {
      logger.error('Report search failed', error)
    },
  })
}
