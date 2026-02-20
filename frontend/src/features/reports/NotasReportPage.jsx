import { useMemo } from 'react'
import { StickyNote } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'

const REPORT_COLUMNS = [
  { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Notas (por defecto)' },
  { id: 'nombre', label: 'Nombre', type: 'text', category: 'Notas (por defecto)' },
  { id: 'registrado_por', label: 'Autor', type: 'text', category: 'Notas (por defecto)' },
  { id: 'fecha', label: 'Fecha', type: 'date', category: 'Notas (por defecto)' },
  { id: 'nota', label: 'Nota', type: 'longtext', category: 'Notas (por defecto)' },
]

const ADDITIONAL_COLUMNS = [
  { id: 'id', label: 'ID', type: 'number', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'registrado_por', 'fecha', 'nota']

const DEFAULT_FILTERS = {
  portfolioId: '',
  registradoPor: [],
  fechaInicio: '',
  fechaFin: '',
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: P001' },
  { key: 'registradoPor', label: 'Autor', type: 'multiselect', optionsKey: 'registrado_por', placeholder: 'Todos los autores' },
  { key: 'fechaInicio', label: 'Fecha (desde)', type: 'date' },
  { key: 'fechaFin', label: 'Fecha (hasta)', type: 'date' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    registrado_por: cleanFilter(filters.registradoPor),
    fecha_inicio: filters.fechaInicio || null,
    fecha_fin: filters.fechaFin || null,
    order_by: sortConfig.field || 'fecha',
    order_dir: sortConfig.direction || 'desc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function NotasReportPage() {
  const config = useMemo(() => ({
    title: 'Notas',
    subtitle: 'Consulte las notas registradas para las iniciativas del portfolio',
    icon: StickyNote,
    searchEndpoint: '/notas/search-report-notas',
    filterOptionsEndpoint: '/notas/report-notas-filter-options',
    filterOptionsQueryKey: 'report-notas-filter-options',
    storagePrefix: 'notas',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns: REPORT_COLUMNS,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    defaultSort: { field: 'fecha', direction: 'desc' },
    emptyMessage: 'No se encontraron notas. Intente ajustar los filtros.',
    showDrawer: true,
    dateFilterKeys: ['fechaInicio', 'fechaFin'],
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [])

  return <GenericReportPage config={config} />
}
