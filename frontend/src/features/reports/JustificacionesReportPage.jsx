import { useMemo } from 'react'
import { Scale } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Justificaciones (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Justificaciones (por defecto)' },
  { id: 'tipo_justificacion', label: 'Tipo', type: 'text', category: 'Justificaciones (por defecto)' },
  { id: 'valor', label: 'Valor', type: 'longtext', category: 'Justificaciones (por defecto)' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'Justificaciones (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
  { id: 'fecha_modificacion', label: 'Fecha Modificacion', type: 'date', category: 'Adicional' },
  { id: 'origen_registro', label: 'Origen Registro', type: 'text', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'tipo_justificacion', 'valor', 'comentarios']

const DEFAULT_FILTERS = {
  portfolioId: '',
  tipoJustificacion: [],
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: P001' },
  { key: 'tipoJustificacion', label: 'Tipo Justificacion', type: 'multiselect', optionsKey: 'tipo_justificacion', placeholder: 'Todos los tipos' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    tipo_justificacion: cleanFilter(filters.tipoJustificacion),
    order_by: sortConfig.field || 'portfolio_id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function JustificacionesReportPage() {
  const config = useMemo(() => ({
    title: 'Justificaciones',
    subtitle: 'Consulte las justificaciones asociadas a las iniciativas del portfolio',
    icon: Scale,
    searchEndpoint: '/justificaciones/search-report-justificaciones',
    filterOptionsEndpoint: '/justificaciones/report-justificaciones-filter-options',
    filterOptionsQueryKey: 'report-justificaciones-filter-options',
    storagePrefix: 'justificaciones',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'portfolio_id', direction: 'asc' },
    emptyMessage: 'No se encontraron justificaciones. Intente ajustar los filtros.',
    showDrawer: true,
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
