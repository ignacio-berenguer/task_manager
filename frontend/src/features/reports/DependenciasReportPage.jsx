import { useMemo } from 'react'
import { GitBranch } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Dependencias (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Dependencias (por defecto)' },
  { id: 'descripcion_dependencia', label: 'Dependencia', type: 'longtext', category: 'Dependencias (por defecto)' },
  { id: 'fecha_dependencia', label: 'Fecha', type: 'date', category: 'Dependencias (por defecto)' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'Dependencias (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'descripcion_dependencia', 'fecha_dependencia', 'comentarios']

const DEFAULT_FILTERS = {
  portfolioId: '',
  descripcionDependencia: '',
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: P001' },
  { key: 'descripcionDependencia', label: 'Dependencia', type: 'text', placeholder: 'Buscar por dependencia...' },
]

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    descripcion_dependencia: filters.descripcionDependencia || null,
    order_by: sortConfig.field || 'portfolio_id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function DependenciasReportPage() {
  const config = useMemo(() => ({
    title: 'Dependencias',
    subtitle: 'Consulte las dependencias entre iniciativas del portfolio',
    icon: GitBranch,
    searchEndpoint: '/dependencias/search-report-dependencias',
    filterOptionsEndpoint: '/dependencias/report-dependencias-filter-options',
    filterOptionsQueryKey: 'report-dependencias-filter-options',
    storagePrefix: 'dependencias',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'portfolio_id', direction: 'asc' },
    emptyMessage: 'No se encontraron dependencias. Intente ajustar los filtros.',
    showDrawer: true,
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
