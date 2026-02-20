import { useMutation } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SearchHook')

/**
 * Build search request from filters and pagination
 */
export function buildSearchRequest(filters, sortConfig, pageSize, currentPage) {
  const searchFilters = []

  // Portfolio ID filter
  if (filters.portfolioId) {
    const ids = filters.portfolioId.split(',').map((id) => id.trim()).filter(Boolean)
    if (ids.length === 1) {
      searchFilters.push({ field: 'portfolio_id', operator: 'eq', value: ids[0] })
    } else if (ids.length > 1) {
      searchFilters.push({ field: 'portfolio_id', operator: 'in', value: ids })
    }
  }

  // Nombre filter (wildcard search)
  if (filters.nombre) {
    searchFilters.push({ field: 'nombre', operator: 'ilike', value: `%${filters.nombre}%` })
  }

  // Multi-select filters
  const multiSelectFields = [
    { key: 'digitalFramework', field: 'digital_framework_level_1' },
    { key: 'unidad', field: 'unidad' },
    { key: 'estado', field: 'estado_de_la_iniciativa' },
    { key: 'estadoSm100', field: 'estado_sm100' },
    { key: 'estadoSm200', field: 'estado_sm200' },
    { key: 'iniciativaAprobada', field: 'iniciativa_aprobada' },
    { key: 'cluster', field: 'cluster' },
    { key: 'tipo', field: 'tipo' },
    { key: 'etiquetas', field: 'etiquetas' }, // Special filter handled by backend
    { key: 'cerradaEconomicamente', field: 'iniciativa_cerrada_economicamente' },
    { key: 'activoEjercicioActual', field: 'activo_ejercicio_actual' },
  ]

  multiSelectFields.forEach(({ key, field }) => {
    if (filters[key] && filters[key].length > 0) {
      // Skip 'ALL' values - they mean "no filter"
      const values = filters[key].filter((v) => v !== 'ALL')
      if (values.length > 0) {
        searchFilters.push({ field, operator: 'in', value: values })
      }
    }
  })

  // Exclude cancelled initiatives unless explicitly included
  // Both "Cancelada" and "Cancelado" values exist in the database
  if (!filters.includeCancelled) {
    searchFilters.push({
      field: 'estado_de_la_iniciativa',
      operator: 'not_in',
      value: ['Cancelada', 'Cancelado'],
    })
  }

  const request = {
    filters: searchFilters,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  }

  // Add sorting if configured
  if (sortConfig?.field) {
    request.order_by = sortConfig.field
    request.order_dir = sortConfig.direction || 'asc'
  }

  return request
}

/**
 * Hook for searching initiatives with pagination
 */
export function useSearchInitiatives() {
  return useMutation({
    mutationFn: async (searchRequest) => {
      logger.info('Searching initiatives', { filters: searchRequest.filters?.length || 0 })
      const response = await apiClient.post('/datos-relevantes/search', searchRequest)
      logger.info('Search completed', { total: response.data.total })
      return response.data
    },
    onError: (error) => {
      logger.error('Search failed', error)
    },
  })
}

/**
 * Hook for exporting all initiatives (no pagination limit)
 * Accepts { filters, order_by, order_dir } to match visible sort order
 */
export function useExportInitiatives() {
  return useMutation({
    mutationFn: async ({ filters, order_by, order_dir } = {}) => {
      logger.info('Exporting initiatives', { filters: filters?.length || 0, order_by })

      // Backend has max limit of 1000, so we need to paginate
      const allData = []
      let offset = 0
      const limit = 1000
      let total = 0

      do {
        const searchRequest = {
          filters: filters || [],
          limit,
          offset,
        }
        if (order_by) {
          searchRequest.order_by = order_by
          searchRequest.order_dir = order_dir || 'asc'
        }

        const response = await apiClient.post('/datos-relevantes/search', searchRequest)
        total = response.data.total
        allData.push(...response.data.data)
        offset += limit
        console.log(`[Export] Fetched ${allData.length} of ${total} records`)
      } while (allData.length < total)

      logger.info('Export data fetched', { total: allData.length })
      return { data: allData, total: allData.length }
    },
    onError: (error) => {
      logger.error('Export fetch failed', error)
    },
  })
}
