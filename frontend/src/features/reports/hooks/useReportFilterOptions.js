import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ReportFilterOptions')

/**
 * Hook to fetch filter options for a report from the backend
 * @param {string} endpoint - API endpoint path (e.g., '/hechos/report-hechos-filter-options')
 * @param {string} queryKey - Unique query key for caching (e.g., 'report-hechos-filter-options')
 */
export function useReportFilterOptions(endpoint, queryKey) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      logger.info(`Fetching report filter options: ${endpoint}`)

      const response = await apiClient.get(endpoint)
      const data = response.data

      const counts = Object.entries(data)
        .map(([k, v]) => `${k}=${v?.length || 0}`)
        .join(', ')
      logger.info(`Report filter options loaded: ${counts}`)

      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}
