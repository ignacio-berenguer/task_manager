import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useEtiquetasDestacadas() {
  return useQuery({
    queryKey: ['etiquetas-destacadas-all'],
    queryFn: async () => {
      const res = await apiClient.get('/etiquetas-destacadas/')
      return res.data.data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}
