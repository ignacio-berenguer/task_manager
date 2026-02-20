import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'
import { sortEstados } from '@/lib/estadoOrder'

const logger = createLogger('FilterOptions')

// Hardcoded Digital Framework options
export const DIGITAL_FRAMEWORK_OPTIONS = [
  'MANDATORY',
  'BUSINESS IMPROVEMENT',
  'RPA/IA',
  'TLC',
  'DISTRIBUTED SERVICES',
  'OPEX CAPITALIZATION',
  'CYBERSECURITY',
]

/**
 * Hook to fetch filter options from the database
 * Extracts unique values for dropdown filters
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      logger.info('Fetching filter options')

      // Fetch datos_relevantes and etiquetas options in parallel
      const [searchResponse, etiquetasResponse] = await Promise.all([
        apiClient.post('/datos-relevantes/search', {
          filters: [],
          limit: 1000, // Backend max limit
          offset: 0,
        }),
        apiClient.get('/datos-relevantes/etiquetas-options').catch((err) => {
          console.error('[useFilterOptions] Failed to fetch etiquetas options:', err)
          return { data: [] }
        }),
      ])

      const data = searchResponse.data.data
      const etiquetasOptions = etiquetasResponse.data || []
      console.log('[useFilterOptions] Etiquetas options:', etiquetasOptions)

      if (!data || data.length === 0) {
        console.warn('[useFilterOptions] No data returned from API')
        return {
          digitalFramework: DIGITAL_FRAMEWORK_OPTIONS,
          unidades: [],
          estados: [],
          clusters: [],
          tipos: [],
          etiquetas: etiquetasOptions || [],
          portfolioOptions: [],
        }
      }

      // Extract unique values for each filter field
      const extractUnique = (field) => {
        const values = data.map((d) => d[field]).filter(Boolean)
        return [...new Set(values)].sort()
      }

      const options = {
        digitalFramework: DIGITAL_FRAMEWORK_OPTIONS,
        unidades: extractUnique('unidad'),
        estados: sortEstados(extractUnique('estado_de_la_iniciativa')),
        estadosSm100: extractUnique('estado_sm100'),
        estadosSm200: extractUnique('estado_sm200'),
        iniciativaAprobada: extractUnique('iniciativa_aprobada'),
        clusters: extractUnique('cluster'),
        tipos: extractUnique('tipo'),
        cerradaEconomicamente: extractUnique('iniciativa_cerrada_economicamente'),
        activoEjercicioActual: extractUnique('activo_ejercicio_actual'),
        etiquetas: etiquetasOptions || [],
        // Portfolio options for combobox (ID + Name)
        portfolioOptions: data.map((d) => ({
          value: d.portfolio_id,
          label: `${d.portfolio_id} - ${(d.nombre || 'Sin nombre').substring(0, 50)}`,
        })).sort((a, b) => a.value.localeCompare(b.value)),
      }

      logger.info('Filter options loaded', {
        unidades: options.unidades.length,
        estados: options.estados.length,
        clusters: options.clusters.length,
        tipos: options.tipos.length,
        etiquetas: options.etiquetas.length,
      })

      return options
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}
