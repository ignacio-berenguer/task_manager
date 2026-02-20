import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Euro, CheckCircle, Play, TrendingUp } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { KPICard } from './components/KPICard'
import { BarChartCard } from './components/BarChartCard'
import { TopValueCard } from './components/TopValueCard'
import { RecentChangesCard } from './components/RecentChangesCard'
import { CollapsibleFilterBar } from './components/CollapsibleFilterBar'
import { DashboardNav } from './components/DashboardNav'
import {
  useDatosRelevantes,
  extractFilterOptions,
  filterData,
  groupFilteredByField,
  sumImporteByField,
} from './hooks/useDatosRelevantes'
import {
  initializeFilters,
  saveFilters,
  getDefaultFilters,
} from './utils/filterStorage'
import { formatNumber, formatImporte } from '@/lib/utils'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Dashboard')

const DEFAULT_TOP_VALUE_THRESHOLD = Number(import.meta.env.VITE_DASHBOARD_TOP_VALUE_THRESHOLD) || 1000000
const RECENT_DAYS = Number(import.meta.env.VITE_DASHBOARD_RECENT_DAYS) || 7

/**
 * Calculate percentage trend between current and previous values.
 * Returns null if previous data is zero/absent (no meaningful comparison).
 */
function calcTrend(current, previous, prevYear) {
  if (!previous || previous === 0) {
    return current > 0 ? null : null
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return { value: Math.round(pct * 10) / 10, label: `vs ${prevYear}` }
}

/**
 * Calculate KPIs from filtered data, including previous-year values for trends
 */
function calculateFilteredKPIs(items, year) {
  if (!items || items.length === 0) {
    return {
      totalInitiatives: 0,
      totalBudget: 0,
      totalImporte: 0,
      prevTotalBudget: 0,
      prevTotalImporte: 0,
      approvedInitiatives: 0,
      inExecution: 0,
    }
  }

  const prevYear = year - 1
  const budgetField = `budget_${year}`
  const prevBudgetField = `budget_${prevYear}`
  const importeField = `importe_${year}`
  const prevImporteField = `importe_${prevYear}`

  const totalInitiatives = items.length

  const totalBudget = items.reduce((sum, item) => {
    return sum + (item[budgetField] || 0)
  }, 0)

  const prevTotalBudget = items.reduce((sum, item) => {
    return sum + (item[prevBudgetField] || 0)
  }, 0)

  const totalImporte = items.reduce((sum, item) => {
    return sum + (item[importeField] || 0)
  }, 0)

  const prevTotalImporte = items.reduce((sum, item) => {
    return sum + (item[prevImporteField] || 0)
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
    totalBudget,
    totalImporte,
    prevTotalBudget,
    prevTotalImporte,
    approvedInitiatives,
    inExecution,
  }
}

/**
 * Dashboard page with KPIs, filters, and charts
 */
export function DashboardPage() {
  usePageTitle('Dashboard')
  const navigate = useNavigate()

  // Initialize filters from localStorage or defaults
  const [filters, setFilters] = useState(() => initializeFilters())
  const [topValueThreshold, setTopValueThreshold] = useState(DEFAULT_TOP_VALUE_THRESHOLD)

  // Fetch raw data (no server-side exclusion filters)
  const { data: rawData, isLoading, error } = useDatosRelevantes()

  // Save filters to localStorage on change
  useEffect(() => {
    saveFilters(filters)
    logger.debug('Filters updated', filters)
  }, [filters])

  // Extract filter options from data
  const filterOptions = useMemo(() => {
    if (!rawData) return { unidad: [], cluster: [], estado: [] }
    return extractFilterOptions(rawData)
  }, [rawData])

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!rawData) return []
    const filtered = filterData(rawData, filters)
    logger.debug(`Filtered ${filtered.length} items from ${rawData.data?.length || 0}`)
    return filtered
  }, [rawData, filters])

  // Calculate KPIs from filtered data
  const kpis = useMemo(() => {
    return calculateFilteredKPIs(filteredData, filters.year)
  }, [filteredData, filters.year])

  // Calculate trends for financial KPIs
  const importeTrend = useMemo(() => {
    return calcTrend(kpis.totalImporte, kpis.prevTotalImporte, filters.year - 1)
  }, [kpis.totalImporte, kpis.prevTotalImporte, filters.year])

  const budgetTrend = useMemo(() => {
    return calcTrend(kpis.totalBudget, kpis.prevTotalBudget, filters.year - 1)
  }, [kpis.totalBudget, kpis.prevTotalBudget, filters.year])

  // Calculate chart data (5 pairs)
  const chartData = useMemo(() => {
    const year = filters.year
    const sumValues = (arr) => arr.reduce((s, item) => s + item.value, 0)

    // Pair 1: Priority (alphabetical)
    const priorityCount = groupFilteredByField(filteredData, 'priorizacion', { sortByName: true })
    const priorityImporte = sumImporteByField(filteredData, 'priorizacion', year, { sortByName: true })

    // Pair 2: Unidad
    const unidadCount = groupFilteredByField(filteredData, 'unidad')
    const unidadImporte = sumImporteByField(filteredData, 'unidad', year)

    // Pair 3: Framework
    const frameworkCount = groupFilteredByField(filteredData, 'digital_framework_level_1')
    const frameworkImporte = sumImporteByField(filteredData, 'digital_framework_level_1', year)

    // Pair 4: Cluster (alphabetical)
    const clusterCount = groupFilteredByField(filteredData, 'cluster', { sortByName: true })
    const clusterImporte = sumImporteByField(filteredData, 'cluster', year, { sortByName: true })

    // Pair 5: Estado (workflow order)
    const statusCount = groupFilteredByField(filteredData, 'estado_de_la_iniciativa', { sortByEstado: true })
    const statusImporte = sumImporteByField(filteredData, 'estado_de_la_iniciativa', year, { sortByEstado: true })

    return {
      priorityCount,
      priorityImporte,
      priorityCountTotal: sumValues(priorityCount),
      priorityImporteTotal: sumValues(priorityImporte),
      unidadCount,
      unidadImporte,
      unidadCountTotal: sumValues(unidadCount),
      unidadImporteTotal: sumValues(unidadImporte),
      frameworkCount,
      frameworkImporte,
      frameworkCountTotal: sumValues(frameworkCount),
      frameworkImporteTotal: sumValues(frameworkImporte),
      clusterCount,
      clusterImporte,
      clusterCountTotal: sumValues(clusterCount),
      clusterImporteTotal: sumValues(clusterImporte),
      statusCount,
      statusImporte,
      statusCountTotal: sumValues(statusCount),
      statusImporteTotal: sumValues(statusImporte),
    }
  }, [filteredData, filters.year])

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  // Handle filter reset
  const handleReset = () => {
    const defaults = getDefaultFilters()
    setFilters(defaults)
    logger.info('Filters reset to defaults')
  }

  // Handle chart bar double-click → navigate to Search
  const handleBarDoubleClick = useCallback(({ name, field }) => {
    const matchingItems = filteredData.filter((item) => {
      const itemValue = item[field] || 'Sin especificar'
      return itemValue === name
    })

    const portfolioIds = matchingItems.map((item) => item.portfolio_id).join(',')
    logger.info('Chart double-click navigation', { field, name, count: matchingItems.length })

    navigate('/search', {
      state: {
        filters: { portfolioId: portfolioIds },
      },
    })
  }, [filteredData, navigate])

  // Handle navigation to Informe Hechos from RecentChangesCard
  const handleNavigateToHechos = useCallback(() => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RECENT_DAYS)
    const fechaInicio = cutoffDate.toISOString().split('T')[0]
    const fechaFin = new Date().toISOString().split('T')[0]

    const hechosFilters = {
      fechaInicio,
      fechaFin,
    }

    // Map dashboard dimension filters that have Hechos equivalents
    if (filters.digitalFramework?.length > 0 && !filters.digitalFramework.includes('ALL')) {
      hechosFilters.digitalFramework = filters.digitalFramework
    }
    if (filters.unidad?.length > 0 && !filters.unidad.includes('ALL')) {
      hechosFilters.unidad = filters.unidad
    }
    if (filters.cluster?.length > 0 && !filters.cluster.includes('ALL')) {
      hechosFilters.cluster = filters.cluster
    }

    logger.info('Navigating to Informe Hechos', { fechaInicio, fechaFin })
    navigate('/informes/hechos', { state: { filters: hechosFilters } })
  }, [filters, navigate])

  if (error) {
    logger.error('Failed to load dashboard data', error)
  }

  logger.info('Dashboard rendered', {
    itemCount: filteredData.length,
    year: filters.year,
  })

  return (
    <Layout showFooter={false}>
      <div className="mx-auto w-full px-6 py-8 sm:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8 bg-muted/40 rounded-lg px-4 py-4 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground font-body">
            Vista general del portfolio y métricas clave
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-8 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error al cargar los datos. Por favor, verifique la conexión con la API.
            </p>
          </div>
        )}

        {/* Filter Bar */}
        <div id="filters" className="scroll-mt-20">
          <CollapsibleFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            unidadOptions={filterOptions.unidad}
            clusterOptions={filterOptions.cluster}
            estadoOptions={filterOptions.estado}
          />
        </div>

        {/* Flex layout: sidebar nav + main content */}
        <div className="flex gap-6">
          <DashboardNav />

          <div className="min-w-0 flex-1">
            {/* KPI Cards */}
            <div id="kpis" className="scroll-mt-20 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KPICard
                title="Total Iniciativas"
                value={formatNumber(kpis.totalInitiatives)}
                icon={Briefcase}
                description="Iniciativas activas"
              />
              <KPICard
                title={`Importe Total ${filters.year}`}
                value={formatImporte(kpis.totalImporte)}
                icon={TrendingUp}
                trend={importeTrend}
                description="Importe total del periodo"
              />
              <KPICard
                title={`Budget ${filters.year}`}
                value={formatImporte(kpis.totalBudget)}
                icon={Euro}
                trend={budgetTrend}
                description="Presupuesto total asignado"
              />
              <KPICard
                title="Aprobadas"
                value={formatNumber(kpis.approvedInitiatives)}
                icon={CheckCircle}
                description="Iniciativas aprobadas"
              />
              <KPICard
                title="En Ejecución"
                value={formatNumber(kpis.inExecution)}
                icon={Play}
                description="Actualmente en ejecución"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6">
              {/* Pair 1: Priority */}
              <div id="chart-priority" className="scroll-mt-20 grid gap-6 lg:grid-cols-2">
                <BarChartCard
                  data={chartData.priorityCount}
                  isLoading={isLoading}
                  title="Iniciativas por Priorización (número)"
                  color="hsl(24.6, 95%, 53.1%)"
                  field="priorizacion"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.priorityCountTotal}
                />
                <BarChartCard
                  data={chartData.priorityImporte}
                  isLoading={isLoading}
                  title="Iniciativas por Priorización (importe)"
                  color="hsl(24.6, 95%, 53.1%)"
                  isImporte
                  field="priorizacion"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.priorityImporteTotal}
                />
              </div>

              {/* Pair 2: Unidad */}
              <div id="chart-unidad" className="scroll-mt-20 grid gap-6 lg:grid-cols-2">
                <BarChartCard
                  data={chartData.unidadCount}
                  isLoading={isLoading}
                  title="Iniciativas por Unidad (número)"
                  color="hsl(142.1, 76.2%, 36.3%)"
                  field="unidad"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.unidadCountTotal}
                />
                <BarChartCard
                  data={chartData.unidadImporte}
                  isLoading={isLoading}
                  title="Iniciativas por Unidad (importe)"
                  color="hsl(142.1, 76.2%, 36.3%)"
                  isImporte
                  field="unidad"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.unidadImporteTotal}
                />
              </div>

              {/* Pair 3: Framework */}
              <div id="chart-framework" className="scroll-mt-20 grid gap-6 lg:grid-cols-2">
                <BarChartCard
                  data={chartData.frameworkCount}
                  isLoading={isLoading}
                  title="Iniciativas por Framework (número)"
                  color="hsl(330, 80%, 55%)"
                  field="digital_framework_level_1"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.frameworkCountTotal}
                />
                <BarChartCard
                  data={chartData.frameworkImporte}
                  isLoading={isLoading}
                  title="Iniciativas por Framework (importe)"
                  color="hsl(330, 80%, 55%)"
                  isImporte
                  field="digital_framework_level_1"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.frameworkImporteTotal}
                />
              </div>

              {/* Pair 4: Cluster */}
              <div id="chart-cluster" className="scroll-mt-20 grid gap-6 lg:grid-cols-2">
                <BarChartCard
                  data={chartData.clusterCount}
                  isLoading={isLoading}
                  title="Iniciativas por Cluster (número)"
                  color="hsl(262.1, 83.3%, 57.8%)"
                  field="cluster"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.clusterCountTotal}
                />
                <BarChartCard
                  data={chartData.clusterImporte}
                  isLoading={isLoading}
                  title="Iniciativas por Cluster (importe)"
                  color="hsl(262.1, 83.3%, 57.8%)"
                  isImporte
                  field="cluster"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.clusterImporteTotal}
                />
              </div>

              {/* Pair 5: Estado */}
              <div id="chart-estado" className="scroll-mt-20 grid gap-6 lg:grid-cols-2">
                <BarChartCard
                  data={chartData.statusCount}
                  isLoading={isLoading}
                  title="Iniciativas por Estado (número)"
                  color="hsl(0, 84.2%, 60.2%)"
                  field="estado_de_la_iniciativa"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.statusCountTotal}
                />
                <BarChartCard
                  data={chartData.statusImporte}
                  isLoading={isLoading}
                  title="Iniciativas por Estado (importe)"
                  color="hsl(0, 84.2%, 60.2%)"
                  isImporte
                  field="estado_de_la_iniciativa"
                  onBarDoubleClick={handleBarDoubleClick}
                  total={chartData.statusImporteTotal}
                />
              </div>
            </div>

            {/* Initiative List Cards */}
            <div className="mt-6 grid gap-6">
              <div id="top-value" className="scroll-mt-20">
                <TopValueCard
                  items={filteredData}
                  year={filters.year}
                  threshold={topValueThreshold}
                  onThresholdChange={setTopValueThreshold}
                  isLoading={isLoading}
                />
              </div>
              <div id="recent-changes" className="scroll-mt-20">
                <RecentChangesCard
                  items={filteredData}
                  recentDays={RECENT_DAYS}
                  onNavigateToHechos={handleNavigateToHechos}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
