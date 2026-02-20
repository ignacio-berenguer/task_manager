import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

/**
 * Fetches color assignments for a parametro and returns a map: value -> colorKey.
 *
 * @param {string} nombreParametro - The parametro name (e.g. 'estado_de_la_iniciativa')
 * @returns {Record<string, string>} Map from valor to color key (e.g. { 'Aprobada': 'emerald' })
 */
export function useParametroColors(nombreParametro) {
  const { data } = useQuery({
    queryKey: ['parametros-colors', nombreParametro],
    queryFn: () => apiClient.get(`/parametros/${nombreParametro}`).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!nombreParametro,
  })

  return useMemo(() => {
    if (!data?.valores) return {}
    return Object.fromEntries(
      data.valores
        .filter((v) => v.color)
        .map((v) => [v.valor, v.color])
    )
  }, [data])
}
