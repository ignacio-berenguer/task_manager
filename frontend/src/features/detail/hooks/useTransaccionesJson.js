import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useTransaccionesJson(portfolioId) {
  return useQuery({
    queryKey: ['transacciones-json-portfolio', portfolioId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/transacciones-json/by-portfolio/${portfolioId}`
      )
      return data
    },
    enabled: !!portfolioId,
  })
}
