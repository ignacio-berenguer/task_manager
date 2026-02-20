import { useMemo } from 'react'
import { ListTodo } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'LTP (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'longtext', category: 'LTP (por defecto)' },
  { id: 'tarea', label: 'Tarea', type: 'longtext', category: 'LTP (por defecto)' },
  { id: 'siguiente_accion', label: 'Siguiente Acción', type: 'date', category: 'LTP (por defecto)' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'LTP (por defecto)' },
  { id: 'estado', label: 'Estado', type: 'estado', category: 'LTP (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
  { id: 'responsable', label: 'Responsable', type: 'text', category: 'Adicional' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Adicional' },
  { id: 'fecha_actualizacion', label: 'Fecha Actualizacion', type: 'date', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'tarea', 'siguiente_accion', 'comentarios', 'estado']

const DEFAULT_FILTERS = {
  responsable: [],
  estado: ['Pendiente'],
}

const FILTER_DEFS = [
  { key: 'responsable', label: 'Responsable', type: 'multiselect', optionsKey: 'responsable', placeholder: 'Todos los responsables' },
  { key: 'estado', label: 'Estado', type: 'multiselect', optionsKey: 'estado', placeholder: 'Todos los estados' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    responsable: cleanFilter(filters.responsable),
    estado: cleanFilter(filters.estado),
    order_by: sortConfig.field || 'siguiente_accion',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function LTPsReportPage() {
  const config = useMemo(() => ({
    title: 'LTPs',
    subtitle: 'Linea de Tareas Pendientes - consulte las tareas asignadas y su estado',
    icon: ListTodo,
    searchEndpoint: '/ltp/search-report-ltps',
    filterOptionsEndpoint: '/ltp/report-ltps-filter-options',
    filterOptionsQueryKey: 'report-ltps-filter-options',
    storagePrefix: 'ltps',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'siguiente_accion', direction: 'asc' },
    emptyMessage: 'No se encontraron LTPs. Intente ajustar los filtros.',
    showDrawer: true,
    collapsibleConfig: {
      mainColumnIds: ['portfolio_id', 'nombre', 'tarea', 'siguiente_accion', 'estado'],
      badgeColumns: {},
      detailColumnIds: ['comentarios', 'responsable'],
    },
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
      { label: 'Acciones', route: '/informes/acciones' },
      { label: 'Etiquetas', route: '/informes/etiquetas' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
