import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Descripciones (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Descripciones (por defecto)' },
  { id: 'tipo_descripcion', label: 'Tipo', type: 'text', category: 'Descripciones (por defecto)' },
  { id: 'descripcion', label: 'Descripción', type: 'longtext', category: 'Descripciones (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
  { id: 'fecha_modificacion', label: 'Fecha Modificacion', type: 'date', category: 'Adicional' },
  { id: 'origen_registro', label: 'Origen Registro', type: 'text', category: 'Adicional' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'tipo_descripcion', 'descripcion']

const DEFAULT_FILTERS = {
  portfolioId: '',
  tipoDescripcion: [],
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: P001' },
  { key: 'tipoDescripcion', label: 'Tipo Descripción', type: 'multiselect', optionsKey: 'tipo_descripcion', placeholder: 'Todos los tipos' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    tipo_descripcion: cleanFilter(filters.tipoDescripcion),
    order_by: sortConfig.field || 'portfolio_id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function DescripcionesReportPage() {
  const config = useMemo(() => ({
    title: 'Descripciones',
    subtitle: 'Consulte las descripciones asociadas a las iniciativas del portfolio',
    icon: FileText,
    searchEndpoint: '/descripciones/search-report-descripciones',
    filterOptionsEndpoint: '/descripciones/report-descripciones-filter-options',
    filterOptionsQueryKey: 'report-descripciones-filter-options',
    storagePrefix: 'descripciones',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'portfolio_id', direction: 'asc' },
    emptyMessage: 'No se encontraron descripciones. Intente ajustar los filtros.',
    showDrawer: true,
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
