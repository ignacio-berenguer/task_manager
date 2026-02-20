import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useExcelProcessStatus(enabled) {
  return useQuery({
    queryKey: ['excel-process-status'],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/transacciones-json/process-excel-status'
      )
      return data
    },
    enabled,
    refetchInterval: enabled ? 2000 : false,
  })
}
