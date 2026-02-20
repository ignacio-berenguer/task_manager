import { useMemo } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'
import { TIPO_CAMBIO_COLORS, ESTADO_CAMBIO_COLORS } from '@/lib/badgeColors'

const REPORT_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Transacciones' },
  { id: 'clave1', label: 'Clave1 (Portfolio ID)', type: 'text', category: 'Transacciones' },
  { id: 'clave2', label: 'Clave2', type: 'text', category: 'Transacciones' },
  { id: 'tabla', label: 'Tabla', type: 'text', category: 'Transacciones' },
  { id: 'campo_tabla', label: 'Campo Tabla', type: 'text', category: 'Transacciones' },
  { id: 'valor_nuevo', label: 'Valor Nuevo', type: 'longtext', category: 'Transacciones' },
  { id: 'tipo_cambio', label: 'Tipo Cambio', type: 'text', category: 'Transacciones' },
  { id: 'estado_cambio', label: 'Estado Cambio', type: 'text', category: 'Transacciones' },
  { id: 'fecha_registro_cambio', label: 'Fecha Registro Cambio', type: 'date', category: 'Transacciones' },
  { id: 'fecha_ejecucion_cambio', label: 'Fecha Ejecución Cambio', type: 'date', category: 'Transacciones' },
  { id: 'valor_antes_del_cambio', label: 'Valor Antes del Cambio', type: 'longtext', category: 'Transacciones' },
  { id: 'comentarios', label: 'Comentarios', type: 'longtext', category: 'Transacciones' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Transacciones' },
  { id: 'fecha_actualizacion', label: 'Fecha Actualizacion', type: 'date', category: 'Transacciones' },
]

const DEFAULT_COLUMN_IDS = REPORT_COLUMNS.map((c) => c.id)

const DEFAULT_FILTERS = {
  clave1: '',
  estadoCambio: [],
  fechaRegistroInicio: '',
  fechaRegistroFin: '',
  fechaEjecucionInicio: '',
  fechaEjecucionFin: '',
  idFilter: '',
}

const FILTER_DEFS = [
  { key: 'clave1', label: 'Portfolio ID (Clave1)', type: 'text', placeholder: 'Ej: P001' },
  { key: 'estadoCambio', label: 'Estado Cambio', type: 'multiselect', optionsKey: 'estado_cambio', placeholder: 'Todos los estados' },
  { key: 'fechaRegistroInicio', label: 'Fecha Registro (desde)', type: 'date' },
  { key: 'fechaRegistroFin', label: 'Fecha Registro (hasta)', type: 'date' },
  { key: 'fechaEjecucionInicio', label: 'Fecha Ejecución (desde)', type: 'date' },
  { key: 'fechaEjecucionFin', label: 'Fecha Ejecución (hasta)', type: 'date' },
  { key: 'idFilter', label: 'ID', type: 'number', placeholder: 'Buscar por ID' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    clave1: filters.clave1 || null,
    estado_cambio: cleanFilter(filters.estadoCambio),
    fecha_registro_cambio_inicio: filters.fechaRegistroInicio || null,
    fecha_registro_cambio_fin: filters.fechaRegistroFin || null,
    fecha_ejecucion_cambio_inicio: filters.fechaEjecucionInicio || null,
    fecha_ejecucion_cambio_fin: filters.fechaEjecucionFin || null,
    id_filter: filters.idFilter ? parseInt(filters.idFilter, 10) : null,
    order_by: sortConfig.field || 'id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function TransaccionesReportPage() {
  const config = useMemo(() => ({
    title: 'Transacciones',
    subtitle: 'Consulte el registro de transacciones y cambios del portfolio',
    icon: ArrowLeftRight,
    searchEndpoint: '/transacciones/search-report-transacciones',
    filterOptionsEndpoint: '/transacciones/report-transacciones-filter-options',
    filterOptionsQueryKey: 'report-transacciones-filter-options',
    storagePrefix: 'transacciones',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: [],
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'id', direction: 'asc' },
    emptyMessage: 'No se encontraron transacciones. Intente ajustar los filtros.',
    linkField: 'clave1',
    linkPrefix: '/detail/',
    collapsibleConfig: {
      mainColumnIds: ['id', 'clave1', 'tabla', 'campo_tabla', 'tipo_cambio', 'estado_cambio', 'fecha_registro_cambio'],
      badgeColumns: {
        tipo_cambio: TIPO_CAMBIO_COLORS,
        estado_cambio: ESTADO_CAMBIO_COLORS,
      },
      detailColumnIds: ['valor_nuevo', 'valor_antes_del_cambio', 'comentarios', 'fecha_ejecucion_cambio'],
    },
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
