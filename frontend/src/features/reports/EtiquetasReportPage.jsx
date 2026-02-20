import { useMemo } from 'react'
import { Tags } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Etiquetas (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Etiquetas (por defecto)' },
  { id: 'etiqueta', label: 'Etiqueta', type: 'longtext', category: 'Etiquetas (por defecto)' },
  { id: 'valor', label: 'Valor', type: 'longtext', category: 'Etiquetas (por defecto)' },
  { id: 'origen_registro', label: 'Origen Registro', type: 'longtext', category: 'Etiquetas (por defecto)' },
  { id: 'comentarios', label: 'Comentario', type: 'longtext', category: 'Etiquetas (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'estado_de_la_iniciativa', label: 'Estado Iniciativa', type: 'estado', category: 'Portfolio' },
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
  { id: 'fecha_modificacion', label: 'Fecha Modificacion', type: 'date', category: 'Adicional' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Adicional' },
  { id: 'fecha_actualizacion', label: 'Fecha Actualizacion', type: 'date', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'etiqueta', 'valor', 'origen_registro', 'comentarios']

const DEFAULT_FILTERS = {
  portfolioId: '',
  nombre: '',
  etiqueta: [],
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: P001' },
  { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Buscar por nombre...' },
  { key: 'etiqueta', label: 'Etiqueta', type: 'multiselect', optionsKey: 'etiqueta', placeholder: 'Todas las etiquetas' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    nombre: filters.nombre || null,
    etiqueta: cleanFilter(filters.etiqueta),
    order_by: sortConfig.field || 'portfolio_id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function EtiquetasReportPage() {
  const config = useMemo(() => ({
    title: 'Etiquetas',
    subtitle: 'Consulte las etiquetas asignadas a las iniciativas del portfolio',
    icon: Tags,
    searchEndpoint: '/etiquetas/search-report-etiquetas',
    filterOptionsEndpoint: '/etiquetas/report-etiquetas-filter-options',
    filterOptionsQueryKey: 'report-etiquetas-filter-options',
    storagePrefix: 'etiquetas',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'portfolio_id', direction: 'asc' },
    emptyMessage: 'No se encontraron etiquetas. Intente ajustar los filtros.',
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
      { label: 'Acciones', route: '/informes/acciones' },
      { label: 'LTPs', route: '/informes/ltps' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
