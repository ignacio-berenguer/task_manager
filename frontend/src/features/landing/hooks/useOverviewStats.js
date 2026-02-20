import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

/**
 * Fetch overview stats for the landing page
 */
async function fetchOverviewStats() {
  const response = await apiClient.get('/stats/overview')
  return response.data
}

/**
 * Hook for fetching aggregated portfolio stats (landing page)
 */
export function useOverviewStats() {
  return useQuery({
    queryKey: ['stats-overview'],
    queryFn: fetchOverviewStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}
