import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

const PAGE_SIZE = 50

export function useActivityTimeline(portfolioId) {
  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState([])
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const query = useQuery({
    queryKey: ['portfolio-timeline', portfolioId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/portfolio/${portfolioId}/timeline`, {
        params: { limit: PAGE_SIZE, offset: 0 },
      })
      setAllItems(data.timeline)
      setOffset(data.timeline.length)
      return data
    },
    enabled: !!portfolioId,
    staleTime: 2 * 60 * 1000,
  })

  const total = query.data?.total || 0
  const hasMore = offset < total

  const fetchMore = useCallback(async () => {
    if (!hasMore || isFetchingMore) return
    setIsFetchingMore(true)
    try {
      const { data } = await apiClient.get(`/portfolio/${portfolioId}/timeline`, {
        params: { limit: PAGE_SIZE, offset },
      })
      setAllItems((prev) => [...prev, ...data.timeline])
      setOffset((prev) => prev + data.timeline.length)
    } finally {
      setIsFetchingMore(false)
    }
  }, [portfolioId, offset, hasMore, isFetchingMore])

  return {
    data: query.data ? { ...query.data, timeline: allItems } : query.data,
    isLoading: query.isLoading,
    error: query.error,
    hasMore,
    isFetchingMore,
    fetchMore,
  }
}
