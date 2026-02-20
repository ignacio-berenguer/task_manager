import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'
import { ESTADO_ORDER, getEstadoIndex } from '@/lib/estadoOrder'

const logger = createLogger('useDatosRelevantes')

// Re-export for backward compatibility
export { ESTADO_ORDER }

/**
 * Fetch all datos_relevantes (no server-side exclusion filters)
 */
async function fetchDatosRelevantes() {
  logger.info('Fetching datos_relevantes...')

  const response = await apiClient.post('/datos-relevantes/search', {
    filters: [],
    limit: 1000,
    offset: 0,
  })

  logger.info(`Loaded ${response.data.data?.length || 0} initiatives`)
  return response.data
}

/**
 * Hook for fetching datos_relevantes data
 */
export function useDatosRelevantes() {
  return useQuery({
    queryKey: ['datos-relevantes-dashboard'],
    queryFn: fetchDatosRelevantes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Extract unique filter options from data
 */
export function extractFilterOptions(data) {
  if (!data?.data) {
    return { unidad: [], cluster: [], estado: [] }
  }

  const items = data.data

  // Extract unique unidad values
  const unidadSet = new Set()
  items.forEach((item) => {
    if (item.unidad) unidadSet.add(item.unidad)
  })
  const unidad = [...unidadSet]
    .sort()
    .map((v) => ({ value: v, label: v }))

  // Extract unique cluster values
  const clusterSet = new Set()
  items.forEach((item) => {
    if (item.cluster) clusterSet.add(item.cluster)
  })
  const cluster = [...clusterSet]
    .sort()
    .map((v) => ({ value: v, label: v }))

  // Extract unique estado values
  const estadoSet = new Set()
  items.forEach((item) => {
    if (item.estado_de_la_iniciativa) estadoSet.add(item.estado_de_la_iniciativa)
  })
  const estado = [...estadoSet]
    .sort((a, b) => getEstadoIndex(a) - getEstadoIndex(b))
    .map((v) => ({ value: v, label: v }))

  return { unidad, cluster, estado }
}

/**
 * Filter data based on filter selections (all filtering is client-side)
 */
export function filterData(data, filters) {
  if (!data?.data) return []

  const items = data.data

  return items.filter((item) => {
    // Always exclude Grupo Iniciativas
    if (item.tipo_agrupacion === 'Grupo Iniciativas') {
      return false
    }

    // Excluir Canceladas toggle
    if (filters.excluirCanceladas) {
      if (item.estado_de_la_iniciativa === 'Cancelado') {
        return false
      }
    }

    // Excluir EPTs toggle
    if (filters.excluirEPTs) {
      if (item.tipo && item.tipo.toUpperCase().includes('EPT')) {
        return false
      }
    }

    // Cerrada Economicamente tri-state filter (Cerrado / No / Todos)
    if (filters.cerradaEconomicamente && filters.cerradaEconomicamente !== 'Todos') {
      const val = item.iniciativa_cerrada_economicamente || ''
      if (filters.cerradaEconomicamente === 'Cerrado') {
        if (!val.startsWith('Cerrado')) return false
      } else if (filters.cerradaEconomicamente === 'No') {
        if (val.startsWith('Cerrado')) return false
      }
    }

    // Previstas este ano tri-state filter (Sí / No / Todos)
    if (filters.previstasEsteAno && filters.previstasEsteAno !== 'Todos') {
      const val = item.en_presupuesto_del_ano || ''
      if (filters.previstasEsteAno === 'Sí') {
        if (val !== 'Si' && val !== 'Sí') return false
      } else if (filters.previstasEsteAno === 'No') {
        if (val !== 'No') return false
      }
    }

    // Digital Framework filter
    if (
      filters.digitalFramework.length > 0 &&
      !filters.digitalFramework.includes('ALL')
    ) {
      if (!filters.digitalFramework.includes(item.digital_framework_level_1)) {
        return false
      }
    }

    // Unidad filter
    if (filters.unidad.length > 0 && !filters.unidad.includes('ALL')) {
      if (!filters.unidad.includes(item.unidad)) {
        return false
      }
    }

    // Cluster filter
    if (filters.cluster.length > 0 && !filters.cluster.includes('ALL')) {
      if (!filters.cluster.includes(item.cluster)) {
        return false
      }
    }

    // Estado filter
    if (filters.estado && filters.estado.length > 0 && !filters.estado.includes('ALL')) {
      if (!filters.estado.includes(item.estado_de_la_iniciativa)) {
        return false
      }
    }

    return true
  })
}

/**
 * Get the importe column name for a given year
 */
export function getImporteColumn(year) {
  return `importe_${year}`
}

/**
 * Sum importe by a grouping field for a specific year
 */
export function sumImporteByField(items, groupField, year, { sortByName = false, sortByEstado = false } = {}) {
  if (!items || items.length === 0) return []

  const importeCol = getImporteColumn(year)
  const grouped = {}

  items.forEach((item) => {
    const key = item[groupField] || 'Sin especificar'
    const value = item[importeCol] || 0
    grouped[key] = (grouped[key] || 0) + value
  })

  const sortFn = sortByEstado
    ? (a, b) => getEstadoIndex(a.name) - getEstadoIndex(b.name)
    : sortByName
      ? (a, b) => a.name.localeCompare(b.name)
      : (a, b) => b.value - a.value

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort(sortFn)
}

/**
 * Group filtered items by a field (count)
 */
export function groupFilteredByField(items, field, { sortByName = false, sortByEstado = false } = {}) {
  if (!items || items.length === 0) return []

  const grouped = items.reduce((acc, item) => {
    const key = item[field] || 'Sin especificar'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const sortFn = sortByEstado
    ? (a, b) => getEstadoIndex(a.name) - getEstadoIndex(b.name)
    : sortByName
      ? (a, b) => a.name.localeCompare(b.name)
      : (a, b) => b.value - a.value

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort(sortFn)
}

/**
 * Calculate KPIs from datos_relevantes data
 */
export function calculateKPIs(data) {
  if (!data?.data || data.data.length === 0) {
    return {
      totalInitiatives: 0,
      totalBudget2025: 0,
      approvedInitiatives: 0,
      inExecution: 0,
    }
  }

  const items = data.data

  const totalInitiatives = items.length

  const totalBudget2025 = items.reduce((sum, item) => {
    return sum + (item.budget_2025 || 0)
  }, 0)

  const approvedInitiatives = items.filter(
    (item) => item.estado_aprobacion === 'Aprobada'
  ).length

  const inExecution = items.filter((item) => {
    const estado = item.estado_ejecucion || ''
    return estado.toLowerCase().includes('ejecuci')
  }).length

  return {
    totalInitiatives,
    totalBudget2025,
    approvedInitiatives,
    inExecution,
  }
}

/**
 * Group data by a field for charts
 */
export function groupByField(data, field) {
  if (!data?.data) return []

  const grouped = data.data.reduce((acc, item) => {
    const key = item[field] || 'Sin especificar'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Sum a field grouped by another field
 */
export function sumByField(data, groupField, sumField) {
  if (!data?.data) return []

  const grouped = data.data.reduce((acc, item) => {
    const key = item[groupField] || 'Sin especificar'
    acc[key] = (acc[key] || 0) + (item[sumField] || 0)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

/**
 * Get budget by year data
 */
export function getBudgetByYear(data) {
  if (!data?.data) return []

  const years = ['2024', '2025', '2026', '2027']
  return years.map((year) => ({
    name: year,
    value: data.data.reduce((sum, item) => {
      return sum + (item[`budget_${year}`] || 0)
    }, 0),
  }))
}
