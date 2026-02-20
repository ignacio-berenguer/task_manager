import { useState, useMemo } from 'react'
import { FolderOpen, Download, Code2, FileText } from 'lucide-react'
import { GenericReportPage } from './components/GenericReportPage'
import { toSharePointOnlineUrl } from '@/lib/sharepoint'
import { JsonViewerModal } from '@/components/shared/JsonViewerModal'
import { SummaryViewerModal } from '@/components/shared/SummaryViewerModal'

const ADDITIONAL_COLUMNS = [
  { id: 'estado_de_la_iniciativa', label: 'Estado Iniciativa', type: 'estado', category: 'Portfolio' },
  { id: 'enlace_documento', label: 'Enlace', type: 'text', category: 'Adicional' },
  { id: 'ruta_documento', label: 'Ruta', type: 'text', category: 'Adicional' },
  { id: 'resumen_documento', label: 'Resumen', type: 'longtext', category: 'Adicional' },
  { id: 'fecha_creacion', label: 'Fecha Creacion', type: 'date', category: 'Adicional' },
  { id: 'fecha_actualizacion', label: 'Fecha Actualizacion', type: 'date', category: 'Adicional' },
]

const DEFAULT_COLUMN_IDS = ['portfolio_id', 'nombre', 'tipo_documento', 'nombre_fichero', 'estado_proceso_documento', '_download', '_json', '_summary']

const DEFAULT_FILTERS = {
  portfolioId: '',
  nombre: '',
  tipoDocumento: [],
  estadoProcesoDocumento: [],
}

const FILTER_DEFS = [
  { key: 'portfolioId', label: 'Portfolio ID', type: 'text', placeholder: 'Ej: SPA_25_1' },
  { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Buscar por nombre...' },
  { key: 'tipoDocumento', label: 'Tipo Documento', type: 'multiselect', optionsKey: 'tipo_documento', placeholder: 'Todos los tipos' },
  { key: 'estadoProcesoDocumento', label: 'Estado Proceso', type: 'multiselect', optionsKey: 'estado_proceso_documento', placeholder: 'Todos los estados' },
]

const cleanFilter = (arr) => (!arr || arr.includes('ALL')) ? [] : arr

function buildRequestBody(filters, sortConfig, pageSize, page) {
  return {
    portfolio_id: filters.portfolioId || null,
    nombre: filters.nombre || null,
    tipo_documento: cleanFilter(filters.tipoDocumento),
    estado_proceso_documento: cleanFilter(filters.estadoProcesoDocumento),
    order_by: sortConfig.field || 'portfolio_id',
    order_dir: sortConfig.direction || 'asc',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }
}

export default function DocumentosReportPage() {
  const [jsonModal, setJsonModal] = useState(null)
  const [summaryModal, setSummaryModal] = useState(null)

  // Build report columns inside component so renderCell closures can access state setters
  const reportColumns = useMemo(() => [
    { id: 'portfolio_id', label: 'Portfolio ID', type: 'text', category: 'Documentos (por defecto)' },
    { id: 'nombre', label: 'Nombre Iniciativa', type: 'text', category: 'Documentos (por defecto)' },
    { id: 'tipo_documento', label: 'Tipo Documento', type: 'text', category: 'Documentos (por defecto)' },
    {
      id: 'nombre_fichero',
      label: 'Nombre Fichero',
      type: 'text',
      category: 'Documentos (por defecto)',
      renderCell: (value, row) => {
        if (row.enlace_documento && value) {
          return (
            <a
              href={toSharePointOnlineUrl(row.enlace_documento)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {value}
            </a>
          )
        }
        return (
          <span className="truncate block max-w-[300px]" title={String(value || '')}>
            {value || '-'}
          </span>
        )
      },
    },
    { id: 'estado_proceso_documento', label: 'Estado Proceso', type: 'estado', category: 'Documentos (por defecto)' },
    {
      id: '_download',
      label: '',
      type: 'custom',
      width: 40,
      category: 'Documentos (por defecto)',
      renderCell: (_value, row) => {
        if (!row.enlace_documento) return null
        return (
          <a
            href={row.enlace_documento}
            target="_blank"
            rel="noopener noreferrer"
            title="Descargar documento"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
        )
      },
    },
    {
      id: '_json',
      label: '',
      type: 'custom',
      width: 40,
      category: 'Documentos (por defecto)',
      renderCell: (_, row) => row.resumen_documento ? (
        <button
          onClick={() => setJsonModal(row)}
          title="Ver JSON"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Code2 className="h-4 w-4" />
        </button>
      ) : null,
    },
    {
      id: '_summary',
      label: '',
      type: 'custom',
      width: 40,
      category: 'Documentos (por defecto)',
      renderCell: (_, row) => row.resumen_documento ? (
        <button
          onClick={() => setSummaryModal(row)}
          title="Ver Resumen"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <FileText className="h-4 w-4" />
        </button>
      ) : null,
    },
  ], [])

  const config = useMemo(() => ({
    title: 'Documentos',
    subtitle: 'Consulte los documentos asociados a las iniciativas del portfolio',
    icon: FolderOpen,
    searchEndpoint: '/documentos/search-report-documentos',
    filterOptionsEndpoint: '/documentos/report-documentos-filter-options',
    filterOptionsQueryKey: 'report-documentos-filter-options',
    storagePrefix: 'documentos',
    defaultColumnIds: DEFAULT_COLUMN_IDS,
    reportColumns,
    additionalColumns: ADDITIONAL_COLUMNS,
    filterDefs: FILTER_DEFS,
    defaultFilters: DEFAULT_FILTERS,
    buildRequestBody,
    showDrawer: true,
    defaultSort: { field: 'portfolio_id', direction: 'asc' },
    emptyMessage: 'No se encontraron documentos. Intente ajustar los filtros.',
    collapsibleConfig: {
      mainColumnIds: ['portfolio_id', 'nombre', 'tipo_documento', 'nombre_fichero', 'estado_proceso_documento', '_download', '_json', '_summary'],
      detailColumnIds: ['enlace_documento', 'ruta_documento', 'fecha_creacion', 'fecha_actualizacion', 'estado_de_la_iniciativa'],
    },
    crossReportLinks: [
      { label: 'Hechos', route: '/informes/hechos' },
    ],
  }), [reportColumns])

  return (
    <>
      <GenericReportPage config={config} />

      <JsonViewerModal
        open={!!jsonModal}
        onOpenChange={() => setJsonModal(null)}
        title={jsonModal?.nombre_fichero}
        jsonString={jsonModal?.resumen_documento}
        sharePointUrl={jsonModal?.enlace_documento}
      />

      <SummaryViewerModal
        open={!!summaryModal}
        onOpenChange={() => setSummaryModal(null)}
        title={summaryModal?.nombre_fichero}
        jsonString={summaryModal?.resumen_documento}
        sharePointUrl={summaryModal?.enlace_documento}
      />
    </>
  )
}
