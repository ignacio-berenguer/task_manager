import { useMemo } from 'react'
import { FileJson } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'
import { TIPO_OPERACION_COLORS, ESTADO_DB_COLORS } from '@/lib/badgeColors'

const REPORT_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Transacciones JSON' },
  { id: 'entidad', label: 'Entidad', type: 'text', category: 'Transacciones JSON' },
  { id: 'tipo_operacion', label: 'Tipo Operacion', type: 'text', category: 'Transacciones JSON' },
  { id: 'clave_primaria', label: 'Clave Primaria', type: 'longtext', category: 'Transacciones JSON' },
  { id: 'cambios', label: 'Cambios', type: 'longtext', category: 'Transacciones JSON' },
  { id: 'usuario', label: 'Usuario', type: 'text', category: 'Transacciones JSON' },
  { id: 'mensaje_commit', label: 'Mensaje Commit', type: 'longtext', category: 'Transacciones JSON' },
  { id: 'estado_db', label: 'Estado DB', type: 'text', category: 'Transacciones JSON' },
  { id: 'estado_excel', label: 'Estado Excel', type: 'text', category: 'Transacciones JSON' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Transacciones JSON' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'fecha_ejecucion_db', label: 'Fecha Ejecución DB', type: 'date', category: 'Transacciones JSON' },
  { id: 'fecha_ejecucion_excel', label: 'Fecha Ejecución Excel', type: 'date', category: 'Transacciones JSON' },
  { id: 'error_detalle', label: 'Error Detalle', type: 'longtext', category: 'Transacciones JSON' },
]

const DEFAULT_COLUMN_IDS = REPORT_COLUMNS.map((c) => c.id)

const DEFAULT_FILTERS = {
  entidad: [],
  tipoOperacion: [],
  estadoDb: [],
  estadoExcel: [],
  usuario: '',
  fechaCreacionInicio: '',
  fechaCreacionFin: '',
}

const FILTER_DEFS = [
  { key: 'entidad', label: 'Entidad', type: 'multiselect', optionsKey: 'entidad', placeholder: 'Todas las entidades' },
  { key: 'tipoOperacion', label: 'Tipo Operacion', type: 'multiselect', optionsKey: 'tipo_operacion', placeholder: 'Todos los tipos' },
  { key: 'estadoDb', label: 'Estado DB', type: 'multiselect', optionsKey: 'estado_db', placeholder: 'Todos los estados' },
  { key: 'estadoExcel', label: 'Estado Excel', type: 'multiselect', optionsKey: 'estado_excel', placeholder: 'Todos los estados' },
  { key: 'usuario', label: 'Usuario', type: 'text', placeholder: 'Buscar por usuario' },
  { key: 'fechaCreacionInicio', label: 'Fecha Creacion (desde)', type: 'date' },
  { key: 'fechaCreacionFin', label: 'Fecha Creacion (hasta)', type: 'date' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    entidad: cleanFilter(filters.entidad),
    tipo_operacion: cleanFilter(filters.tipoOperacion),
    estado_db: cleanFilter(filters.estadoDb),
    estado_excel: cleanFilter(filters.estadoExcel),
    usuario: filters.usuario || null,
    fecha_creacion_inicio: filters.fechaCreacionInicio || null,
    fecha_creacion_fin: filters.fechaCreacionFin || null,
    order_by: sortConfig.field || 'fecha_creacion',
    order_dir: sortConfig.direction || 'desc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function TransaccionesJsonReportPage() {
  const config = useMemo(() => ({
    title: 'Transacciones JSON',
    subtitle: 'Consulte los diffs JSON de transacciones pendientes, ejecutadas y con errores',
    icon: FileJson,
    searchEndpoint: '/transacciones-json/search-report',
    filterOptionsEndpoint: '/transacciones-json/report-filter-options',
    filterOptionsQueryKey: 'report-transacciones-json-filter-options',
    storagePrefix: 'transacciones-json',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'fecha_creacion', direction: 'desc' },
    emptyMessage: 'No se encontraron transacciones JSON. Intente ajustar los filtros.',
    linkField: null,
    collapsibleConfig: {
      mainColumnIds: ['id', 'entidad', 'tipo_operacion', 'estado_db', 'estado_excel', 'fecha_creacion', 'usuario'],
      badgeColumns: {
        tipo_operacion: TIPO_OPERACION_COLORS,
        estado_db: ESTADO_DB_COLORS,
        estado_excel: ESTADO_DB_COLORS,
      },
      detailColumnIds: ['clave_primaria', 'cambios', 'mensaje_commit', 'error_detalle'],
    },
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
