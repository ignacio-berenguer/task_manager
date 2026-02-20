import { useMemo } from 'react'
import { Zap } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Acciones (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Acciones (por defecto)' },
  { id: 'siguiente_accion', label: 'Siguiente Acción', type: 'estado', category: 'Acciones (por defecto)' },
  { id: 'siguiente_accion_comentarios', label: 'Siguiente Acción Comentarios', type: 'longtext', category: 'Acciones (por defecto)' },
  { id: 'estado_de_la_iniciativa', label: 'Estado', type: 'estado', category: 'Acciones (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'Adicional' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Adicional' },
  { id: 'fecha_actualizacion', label: 'Fecha Actualizacion', type: 'date', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'siguiente_accion', 'siguiente_accion_comentarios', 'estado_de_la_iniciativa']

const DEFAULT_FILTERS = {
  siguienteAccionInicio: '',
  siguienteAccionFin: '',
  estadoIniciativa: [],
}

const FILTER_DEFS = [
  { key: 'siguienteAccionInicio', label: 'Siguiente Acción (desde)', type: 'date', dateRangeGroup: 'siguienteAccion' },
  { key: 'siguienteAccionFin', label: 'Siguiente Acción (hasta)', type: 'date', dateRangeGroup: 'siguienteAccion' },
  { key: 'estadoIniciativa', label: 'Estado de la Iniciativa', type: 'multiselect', optionsKey: 'estado_de_la_iniciativa', placeholder: 'Todos los estados', sortByEstado: true },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    siguiente_accion_inicio: filters.siguienteAccionInicio || null,
    siguiente_accion_fin: filters.siguienteAccionFin || null,
    estado_de_la_iniciativa: cleanFilter(filters.estadoIniciativa),
    order_by: sortConfig.field || 'siguiente_accion',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function AccionesReportPage() {
  const config = useMemo(() => ({
    title: 'Acciones',
    subtitle: 'Consulte las acciones pendientes y sus comentarios',
    icon: Zap,
    searchEndpoint: '/acciones/search-report-acciones',
    filterOptionsEndpoint: '/acciones/report-acciones-filter-options',
    filterOptionsQueryKey: 'report-acciones-filter-options',
    storagePrefix: 'acciones',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'siguiente_accion', direction: 'asc' },
    emptyMessage: 'No se encontraron acciones. Intente ajustar los filtros.',
    showDrawer: true,
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
      { label: 'LTPs', route: '/informes/ltps' },
      { label: 'Etiquetas', route: '/informes/etiquetas' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
