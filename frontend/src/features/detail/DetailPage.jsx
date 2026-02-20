import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { AlertCircle, Plus, Pencil, ChevronsDown, ChevronsUp } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logger'
import { usePortfolioDetail } from './hooks/usePortfolioDetail'
import { DetailHeader } from './components/DetailHeader'
import { SectionAccordion } from './components/SectionAccordion'
import {
  DatosDescriptivosSection,
  HechosSection,
  InformacionEconomicaSection,
  ImportesSection,
  EtiquetasSection,
  AccionesSection,
  NotasSection,
  JustificacionesSection,
  DescripcionesSection,
  BeneficiosSection,
  LtpSection,
  FacturacionSection,
  DatosEjecucionSection,
  GruposIniciativasSection,
  EstadoEspecialSection,
  TransaccionesSection,
  WbesSection,
  DependenciasSection,
  DocumentosSection,
  ImpactoAattSection,
  TransaccionesJsonSection,
  RelatedInitiativesSection,
  ActivityTimelineSection,
} from './components/sections'
import { useTransaccionesJson } from './hooks/useTransaccionesJson'
import { useRelatedInitiatives } from './hooks/useRelatedInitiatives'
import { useActivityTimeline } from './hooks/useActivityTimeline'
import { NotaFormModal } from './components/NotaFormModal'
import { EntityFormModal } from './components/EntityFormModal'
import { SectionHistoryModal } from './components/SectionHistoryModal'
import { DetailNav } from './components/DetailNav'
import { MobileDetailNav } from './components/MobileDetailNav'
import { EmptySectionsPanel } from './components/EmptySectionsPanel'
import { useEtiquetasDestacadas } from '@/features/parametricas/hooks/useEtiquetasDestacadas'
import { useRecentInitiatives } from './hooks/useRecentInitiatives'
import { exportSectionCSV } from './utils/exportSection'
import { COLUMNS as HECHOS_COLUMNS } from './components/sections/HechosSection'
import { COLUMNS as ETIQUETAS_COLUMNS } from './components/sections/EtiquetasSection'
import { COLUMNS as ACCIONES_COLUMNS } from './components/sections/AccionesSection'
import { COLUMNS as LTP_COLUMNS } from './components/sections/LtpSection'
import { COLUMNS as DEPENDENCIAS_COLUMNS } from './components/sections/DependenciasSection'
import { COLUMNS as WBES_COLUMNS } from './components/sections/WbesSection'
import { COLUMNS as JUSTIFICACIONES_COLUMNS } from './components/sections/JustificacionesSection'
import { COLUMNS as BENEFICIOS_COLUMNS } from './components/sections/BeneficiosSection'
import { COLUMNS as FACTURACION_COLUMNS } from './components/sections/FacturacionSection'
import { FIELDS as DATOS_EJECUCION_COLUMNS } from './components/sections/DatosEjecucionSection'

const logger = createLogger('DetailPage')

// --- Form field definitions for create modals ---

const DATOS_DESCRIPTIVOS_FIELDS = [
  { key: 'portfolio_id', label: 'Portfolio ID', required: true, readOnlyOnEdit: true },
  { key: 'nombre', label: 'Nombre' },
  { key: 'unidad', label: 'Unidad', parametric: 'unidad' },
  { key: 'origen', label: 'Origen', parametric: 'origen' },
  { key: 'digital_framework_level_1', label: 'Digital Framework', parametric: 'digital_framework_level_1' },
  { key: 'tipo_proyecto', label: 'Tipo Proyecto', parametric: 'tipo_proyecto' },
  { key: 'prioridad_descriptiva_bi', label: 'Prioridad BI', parametric: 'prioridad_descriptiva_bi' },
  { key: 'priorizacion', label: 'Priorización', parametric: 'priorizacion' },
  { key: 'referente_bi', label: 'Referente BI', parametric: 'referente_bi' },
  { key: 'referente_b_unit', label: 'Referente B-Unit' },
  { key: 'referente_enabler_ict', label: 'Referente ICT' },
  { key: 'it_partner', label: 'IT Partner', parametric: 'it_partner' },
  { key: 'codigo_jira', label: 'Codigo Jira' },
  { key: 'tipo_agrupacion', label: 'Tipo Agrupacion', parametric: 'tipo_agrupacion' },
]

const INFO_ECONOMICA_FIELDS = [
  { key: 'cini', label: 'CINI' },
  { key: 'capex_opex', label: 'CAPEX/OPEX', parametric: 'capex_opex' },
  { key: 'fecha_prevista_pes', label: 'Fecha Prevista PES', type: 'date' },
  { key: 'cluster', label: 'Cluster', parametric: 'cluster' },
  { key: 'finalidad_budget', label: 'Finalidad Budget' },
  { key: 'proyecto_especial', label: 'Proyecto Especial' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'tlc', label: 'TLC' },
  { key: 'tipo_inversion', label: 'Tipo Inversion' },
  { key: 'observaciones', label: 'Observaciones', type: 'longtext' },
]

const JUSTIFICACIONES_FIELDS = [
  { key: 'tipo_justificacion', label: 'Tipo Justificación' },
  { key: 'valor', label: 'Valor', type: 'longtext' },
  { key: 'fecha_modificacion', label: 'Fecha Modificación', type: 'datetime' },
  { key: 'origen_registro', label: 'Origen Registro' },
]

const DESCRIPCIONES_FIELDS = [
  { key: 'tipo_descripcion', label: 'Tipo Descripción' },
  { key: 'descripcion', label: 'Descripción', type: 'longtext' },
  { key: 'origen_registro', label: 'Origen Registro' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const ETIQUETAS_FIELDS = [
  { key: 'etiqueta', label: 'Etiqueta' },
  { key: 'valor', label: 'Valor' },
  { key: 'origen_registro', label: 'Origen Registro' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const GRUPOS_FIELDS = [
  { key: 'portfolio_id_grupo', label: 'Portfolio ID Grupo' },
  { key: 'portfolio_id_componente', label: 'Portfolio ID Componente' },
  { key: 'nombre_grupo', label: 'Nombre Grupo' },
  { key: 'tipo_agrupacion_grupo', label: 'Tipo Agrupacion Grupo' },
  { key: 'tipo_agrupacion_componente', label: 'Tipo Agrupacion Componente' },
]

const WBES_FIELDS = [
  { key: 'anio', label: 'Año', type: 'number' },
  { key: 'wbe_pyb', label: 'WBE PyB' },
  { key: 'descripcion_pyb', label: 'Descripción PyB' },
  { key: 'wbe_can', label: 'WBE CAN' },
  { key: 'descripcion_can', label: 'Descripción CAN' },
]

const DEPENDENCIAS_FIELDS = [
  { key: 'descripcion_dependencia', label: 'Descripción Dependencia', type: 'longtext' },
  { key: 'fecha_dependencia', label: 'Fecha Dependencia', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const LTP_FIELDS = [
  { key: 'responsable', label: 'Responsable' },
  { key: 'tarea', label: 'Tarea', type: 'longtext' },
  { key: 'siguiente_accion', label: 'Siguiente Acción', type: 'longtext' },
  { key: 'estado', label: 'Estado' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const HECHOS_FIELDS = [
  { key: 'partida_presupuestaria', label: 'Partida Presupuestaria' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'importe_ri', label: 'Importe RI', type: 'currency' },
  { key: 'importe_re', label: 'Importe RE', type: 'currency' },
  { key: 'notas', label: 'Notas', type: 'longtext' },
  { key: 'racional', label: 'Racional', type: 'longtext' },
  { key: 'calidad_estimacion', label: 'Calidad Estimación' },
]

const ACCIONES_FIELDS = [
  { key: 'siguiente_accion_comentarios', label: 'Comentarios Siguiente Acción', type: 'longtext' },
]

const ESTADO_ESPECIAL_FIELDS = [
  { key: 'estado_especial', label: 'Estado Especial' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
  { key: 'fecha_modificacion', label: 'Fecha Modificación', type: 'date' },
]

const IMPACTO_AATT_FIELDS = [
  { key: 'tiene_impacto_en_aatt', label: 'Tiene Impacto en AATT' },
  { key: 'afecta_a_ut_red_mt_bt', label: 'Afecta UT Red MT/BT' },
  { key: 'afecta_om_cc', label: 'Afecta OM CC' },
  { key: 'afecta_pm', label: 'Afecta PM' },
  { key: 'afecta_hseq', label: 'Afecta HSEQ' },
  { key: 'afecta_inspecciones', label: 'Afecta Inspecciones' },
  { key: 'afecta_at', label: 'Afecta AT' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

// --- Section metadata ---
// Centralizes all section configuration for data presence, CRUD, default-open logic, and nav.

const SECTION_DEFS = [
  { id: 'datos-descriptivos', title: 'Datos Descriptivos', dataKey: 'datos_descriptivos', type: 'single', navLabel: 'Datos Desc.', crudAction: 'edit', defaultOpenWhenEmpty: false },
  { id: 'hechos', title: 'Hechos', dataKey: 'hechos', type: 'multi', navLabel: 'Hechos', crudAction: 'create' },
  { id: 'informacion-economica', title: 'Información Económica', dataKey: 'informacion_economica', type: 'single', navLabel: 'Info. Económica', crudAction: 'edit', defaultOpenWhenEmpty: false },
  { id: 'importes', title: 'Importes (Datos Relevantes)', dataKey: 'datos_relevantes', type: 'single', navLabel: 'Importes', crudAction: null },
  { id: 'etiquetas', title: 'Etiquetas', dataKey: 'etiquetas', type: 'multi', navLabel: 'Etiquetas', crudAction: 'create', forceClosedByDefault: true },
  { id: 'acciones', title: 'Acciones', dataKey: 'acciones', type: 'multi', navLabel: 'Acciones', crudAction: 'create' },
  { id: 'notas', title: 'Notas', dataKey: 'notas', type: 'multi', navLabel: 'Notas', crudAction: 'create' },
  { id: 'justificaciones', title: 'Justificaciones', dataKey: 'justificaciones', type: 'multi', navLabel: 'Justificaciones', crudAction: 'create' },
  { id: 'descripciones', title: 'Descripciones', dataKey: 'descripciones', type: 'multi', navLabel: 'Descripciones', crudAction: 'create' },
  { id: 'beneficios', title: 'Beneficios', dataKey: 'beneficios', type: 'multi', navLabel: 'Beneficios', crudAction: null, forceClosedByDefault: true },
  { id: 'ltp', title: 'LTP', dataKey: 'ltp', type: 'multi', navLabel: 'LTP', crudAction: 'create' },
  { id: 'facturacion', title: 'Facturación', dataKey: 'facturacion', type: 'multi', navLabel: 'Facturación', crudAction: null },
  { id: 'datos-ejecucion', title: 'Datos Ejecución', dataKey: 'datos_ejecucion', type: 'multi', navLabel: 'Datos Ejecución', crudAction: null },
  { id: 'grupos-iniciativas', title: 'Grupos Iniciativas', dataKey: 'grupos_iniciativas', type: 'multi', navLabel: 'Grupos', crudAction: 'create' },
  { id: 'estado-especial', title: 'Estado Especial', dataKey: 'estado_especial', type: 'single', navLabel: 'Estado Especial', crudAction: 'edit' },
  { id: 'impacto-aatt', title: 'Impacto AATT', dataKey: 'impacto_aatt', type: 'single', navLabel: 'Impacto AATT', crudAction: 'edit' },
  { id: 'wbes', title: 'WBEs', dataKey: 'wbes', type: 'multi', navLabel: 'WBEs', crudAction: 'create', forceClosedByDefault: true },
  { id: 'dependencias', title: 'Dependencias', dataKey: 'dependencias', type: 'multi', navLabel: 'Dependencias', crudAction: 'create' },
  { id: 'documentos', title: 'Documentos', dataKey: 'documentos', type: 'multi', navLabel: 'Documentos', crudAction: null },
  { id: 'related-initiatives', title: 'Iniciativas Relacionadas', dataKey: '_related', type: 'multi', navLabel: 'Relacionadas', crudAction: null, forceClosedByDefault: true },
  { id: 'activity-timeline', title: 'Actividad', dataKey: '_timeline', type: 'multi', navLabel: 'Actividad', crudAction: null, forceClosedByDefault: true },
  { id: 'transacciones', title: 'Transacciones', dataKey: 'transacciones', type: 'multi', navLabel: 'Transacciones', crudAction: null, forceClosedByDefault: true },
  { id: 'transacciones-json', title: 'Transacciones JSON', dataKey: 'transacciones_json', type: 'multi', navLabel: 'Trans. JSON', crudAction: null, forceClosedByDefault: true },
]

// --- Helper components ---

function DetailPageSkeleton() {
  return (
    <Layout>
      <div className="sticky top-0 z-10 bg-background border-b py-4">
        <div className="w-full mx-auto px-6 sm:px-8 xl:px-12">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-8 w-96" />
        </div>
      </div>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

function ErrorMessage({ error, portfolioId }) {
  return (
    <Layout>
      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error al Cargar la Iniciativa</h1>
          <p className="text-muted-foreground mb-4">
            {error?.response?.status === 404
              ? `La iniciativa con Portfolio ID "${portfolioId}" no fue encontrada.`
              : 'Ocurrió un error al cargar los detalles de la iniciativa.'}
          </p>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Por favor, inténtelo de nuevo más tarde.'}
          </p>
        </div>
      </div>
    </Layout>
  )
}

function getArrayLength(data) {
  if (!data) return 0
  if (Array.isArray(data)) return data.length
  return 1
}

function getFirstOrSelf(data) {
  if (!data) return null
  if (Array.isArray(data)) return data[0] || null
  return data
}

/** Plus button for section headerAction */
function AddButton({ onClick, title }) {
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick} title={title}>
      <Plus className="h-4 w-4" />
    </Button>
  )
}

/** Pencil button for 1:1 section headerAction (edit existing) */
function EditButton({ onClick, title }) {
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick} title={title}>
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  )
}

// --- Helpers for section data ---

function getSectionCount(def, data, transaccionesJson, extraCounts) {
  if (def.dataKey === 'transacciones_json') {
    return transaccionesJson?.length || 0
  }
  if (extraCounts && def.dataKey in extraCounts) {
    return extraCounts[def.dataKey]
  }
  if (def.dataKey === 'grupos_iniciativas') {
    const g = data.grupos_iniciativas
    return (g?.as_grupo?.length || 0) + (g?.as_componente?.length || 0)
  }
  if (def.type === 'single') {
    return getFirstOrSelf(data[def.dataKey]) ? 1 : 0
  }
  return getArrayLength(data[def.dataKey])
}

function shouldDefaultOpen(def, hasData) {
  if (!hasData) return false
  if (def.forceClosedByDefault) return false
  return true
}

// --- Main Component ---

export default function DetailPage() {
  const { portfolio_id } = useParams()
  usePageTitle(`Detalle ${portfolio_id}`)
  const { data, isLoading, error, refetch } = usePortfolioDetail(portfolio_id)
  const { data: transaccionesJson, refetch: refetchTxnJson } = useTransaccionesJson(portfolio_id)
  const { data: etiquetasDestacadas = [] } = useEtiquetasDestacadas()
  const { data: relatedData, isLoading: relatedLoading, error: relatedError } = useRelatedInitiatives(portfolio_id)
  const { data: timelineData, isLoading: timelineLoading, error: timelineError, fetchMore: timelineFetchMore, hasMore: timelineHasMore, isFetchingMore: timelineIsFetchingMore } = useActivityTimeline(portfolio_id)
  const { addRecent } = useRecentInitiatives()

  // Combined refetch: refreshes both portfolio data and transacciones_json
  const refetchAll = useCallback(() => {
    refetch()
    refetchTxnJson()
  }, [refetch, refetchTxnJson])

  // Modal states for create operations (1:N entities)
  const [addNotaOpen, setAddNotaOpen] = useState(false)
  const [addHechoOpen, setAddHechoOpen] = useState(false)
  const [addJustificacionOpen, setAddJustificacionOpen] = useState(false)
  const [addDescripcionOpen, setAddDescripcionOpen] = useState(false)
  const [addEtiquetaOpen, setAddEtiquetaOpen] = useState(false)
  const [addGrupoOpen, setAddGrupoOpen] = useState(false)
  const [addWbeOpen, setAddWbeOpen] = useState(false)
  const [addDependenciaOpen, setAddDependenciaOpen] = useState(false)
  const [addLtpOpen, setAddLtpOpen] = useState(false)
  const [addAccionOpen, setAddAccionOpen] = useState(false)

  // Modal states for 1:1 entities (create or edit)
  const [datosDescModal, setDatosDescModal] = useState({ open: false, mode: 'create', record: null })
  const [infoEconModal, setInfoEconModal] = useState({ open: false, mode: 'create', record: null })
  const [estadoEspModal, setEstadoEspModal] = useState({ open: false, mode: 'create', record: null })
  const [impactoAattModal, setImpactoAattModal] = useState({ open: false, mode: 'create', record: null })

  // History modal state (shared across all sections)
  const [historyModal, setHistoryModal] = useState({ open: false, entityName: '', entityLabel: '' })
  const openHistory = useCallback((entityName, entityLabel) => {
    setHistoryModal({ open: true, entityName, entityLabel })
  }, [])

  // Extra counts for independently-fetched sections (always show them)
  const extraSectionCounts = useMemo(() => ({
    _related: relatedData?.related?.length ?? 1, // show section even while loading
    _timeline: timelineData?.total ?? 1,
  }), [relatedData, timelineData])

  // Compute which sections have data
  const sectionHasData = useMemo(() => {
    if (!data) return {}
    const map = {}
    for (const def of SECTION_DEFS) {
      map[def.id] = getSectionCount(def, data, transaccionesJson, extraSectionCounts) > 0
    }
    return map
  }, [data, transaccionesJson, extraSectionCounts])

  // Record visit for recent initiatives (guarded to run once per portfolio_id)
  const lastRecordedPid = useRef(null)
  useEffect(() => {
    if (!data || lastRecordedPid.current === portfolio_id) return
    const dd = data.datos_descriptivos
    const dr = data.datos_relevantes
    const name = (Array.isArray(dd) ? dd[0] : dd)?.nombre || (Array.isArray(dr) ? dr[0] : dr)?.nombre
    if (name) {
      lastRecordedPid.current = portfolio_id
      addRecent(portfolio_id, name)
    }
  }, [data, portfolio_id, addRecent])

  // Accordion state: set of open section IDs
  const [openSections, setOpenSections] = useState(null) // null = not initialized yet

  // Initialize openSections once data is available
  const effectiveOpenSections = useMemo(() => {
    if (openSections !== null) return openSections
    if (!data) return new Set()
    const initial = new Set()
    for (const def of SECTION_DEFS) {
      const hasData = getSectionCount(def, data, transaccionesJson) > 0
      if (shouldDefaultOpen(def, hasData)) {
        initial.add(def.id)
      }
    }
    return initial
  }, [openSections, data, transaccionesJson])

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => {
      const base = prev ?? effectiveOpenSections
      const next = new Set(base)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [effectiveOpenSections])

  const expandAll = useCallback(() => {
    const all = new Set()
    for (const def of SECTION_DEFS) {
      if (sectionHasData[def.id]) all.add(def.id)
    }
    setOpenSections(all)
  }, [sectionHasData])

  const collapseAll = useCallback(() => {
    setOpenSections(new Set())
  }, [])

  // Active section for mobile nav
  const [activeSection, setActiveSection] = useState(null)

  // URL hash sync: update hash when active section changes
  const hashSyncEnabled = useRef(false)
  const handleActiveSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId)
    if (!hashSyncEnabled.current) return
    if (sectionId) {
      window.history.replaceState(null, '', `#${sectionId}`)
    }
  }, [])

  // Hash → scroll on mount: read URL hash and expand + scroll to section
  const location = useLocation()
  useEffect(() => {
    if (!data) return
    const hash = window.location.hash?.slice(1)
    if (!hash) {
      // Enable hash sync immediately if no hash to scroll to
      hashSyncEnabled.current = true
      return
    }
    const sectionDef = SECTION_DEFS.find((def) => def.id === hash)
    if (!sectionDef) {
      hashSyncEnabled.current = true
      return
    }
    // Expand the section
    setOpenSections((prev) => {
      const base = prev ?? effectiveOpenSections
      const next = new Set(base)
      next.add(hash)
      return next
    })
    // Scroll after a frame to let the accordion expand
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        // Enable hash sync after initial scroll completes
        setTimeout(() => { hashSyncEnabled.current = true }, 500)
      })
    })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Map section IDs to create-modal openers for the EmptySectionsPanel
  const handleCreateFromEmpty = useCallback((sectionId) => {
    const actions = {
      'datos-descriptivos': () => setDatosDescModal({ open: true, mode: 'create', record: null }),
      'hechos': () => setAddHechoOpen(true),
      'informacion-economica': () => setInfoEconModal({ open: true, mode: 'create', record: null }),
      'etiquetas': () => setAddEtiquetaOpen(true),
      'acciones': () => setAddAccionOpen(true),
      'notas': () => setAddNotaOpen(true),
      'justificaciones': () => setAddJustificacionOpen(true),
      'descripciones': () => setAddDescripcionOpen(true),
      'ltp': () => setAddLtpOpen(true),
      'grupos-iniciativas': () => setAddGrupoOpen(true),
      'estado-especial': () => setEstadoEspModal({ open: true, mode: 'create', record: null }),
      'impacto-aatt': () => setImpactoAattModal({ open: true, mode: 'create', record: null }),
      'wbes': () => setAddWbeOpen(true),
      'dependencias': () => setAddDependenciaOpen(true),
    }
    actions[sectionId]?.()
  }, [])

  if (isLoading) return <DetailPageSkeleton />
  if (error) {
    logger.error('Failed to load portfolio detail', { portfolioId: portfolio_id, error })
    return <ErrorMessage error={error} portfolioId={portfolio_id} />
  }
  if (!data) return <ErrorMessage portfolioId={portfolio_id} />

  // Extract data from response
  const datos_descriptivos = getFirstOrSelf(data.datos_descriptivos)
  const datos_relevantes = getFirstOrSelf(data.datos_relevantes)
  const informacion_economica = getFirstOrSelf(data.informacion_economica)
  const estado_especial = getFirstOrSelf(data.estado_especial)
  const impacto_aatt = getFirstOrSelf(data.impacto_aatt)

  const hechos = data.hechos
  const etiquetas = data.etiquetas
  const acciones = data.acciones
  const notas = data.notas
  const justificaciones = data.justificaciones
  const descripciones = data.descripciones
  const beneficios = data.beneficios
  const ltp = data.ltp
  const wbes = data.wbes
  const dependencias = data.dependencias
  const documentos = data.documentos
  const facturacion = data.facturacion
  const datos_ejecucion = data.datos_ejecucion
  const grupos_iniciativas = data.grupos_iniciativas
  const transacciones = data.transacciones

  const nombre = datos_descriptivos?.nombre || datos_relevantes?.nombre

  // Compute highlighted etiquetas (intersection of initiative etiquetas with etiquetas_destacadas, case-insensitive)
  const highlightedEtiquetas = (etiquetas || [])
    .filter((e) => etiquetasDestacadas.some((ed) => ed.etiqueta?.toLowerCase() === e.etiqueta?.toLowerCase()))
    .map((e) => {
      const match = etiquetasDestacadas.find((ed) => ed.etiqueta?.toLowerCase() === e.etiqueta?.toLowerCase())
      return { etiqueta: e.etiqueta, color: match?.color || 'blue' }
    })

  // Compute empty sections for the summary panel
  const emptySections = SECTION_DEFS.filter((def) => !sectionHasData[def.id])

  // Current open set for controlled accordions
  const currentOpen = effectiveOpenSections

  logger.info('Rendering detail page', { portfolioId: portfolio_id, nombre })

  // Helper: is a section open?
  const isSectionOpen = (id) => currentOpen.has(id)

  return (
    <Layout>
      <DetailHeader
        portfolioId={portfolio_id}
        nombre={nombre}
        highlightedEtiquetas={highlightedEtiquetas}
        estadoIniciativa={datos_descriptivos?.estado_de_la_iniciativa}
        estadoSm100={datos_descriptivos?.estado_sm100}
        estadoSm200={datos_descriptivos?.estado_sm200}
        iniciativaAprobada={datos_descriptivos?.iniciativa_aprobada}
      />

      <div className="w-full mx-auto px-6 sm:px-8 xl:px-12 py-6">
        <div className="flex gap-6">
          <DetailNav data={data} transaccionesJsonCount={transaccionesJson?.length} relatedCount={relatedData?.related?.length} timelineCount={timelineData?.total} sectionHasData={sectionHasData} onActiveSectionChange={handleActiveSectionChange} />

          <div className="min-w-0 flex-1">
            {/* Expand / Collapse All toolbar */}
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronsDown className="h-4 w-4 mr-1" />
                Expandir Todo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronsUp className="h-4 w-4 mr-1" />
                Contraer Todo
              </Button>
            </div>

        {/* Datos Descriptivos (1:1) */}
        {sectionHasData['datos-descriptivos'] && (
        <SectionAccordion
          id="datos-descriptivos"
          title="Datos Descriptivos"
          isOpen={isSectionOpen('datos-descriptivos')}
          onToggle={toggleSection}
          onHistory={() => openHistory('datos_descriptivos', 'Datos Descriptivos')}
          headerAction={
            datos_descriptivos
              ? <EditButton onClick={() => setDatosDescModal({ open: true, mode: 'edit', record: datos_descriptivos })} title="Editar Datos Descriptivos" />
              : <AddButton onClick={() => setDatosDescModal({ open: true, mode: 'create', record: null })} title="Añadir Datos Descriptivos" />
          }
        >
          <DatosDescriptivosSection data={datos_descriptivos} datosRelevantes={datos_relevantes} />
        </SectionAccordion>
        )}

        {/* Hechos (1:N) */}
        {sectionHasData['hechos'] && (
        <SectionAccordion
          id="hechos"
          title="Hechos"
          count={getArrayLength(hechos)}
          isOpen={isSectionOpen('hechos')}
          onToggle={toggleSection}
          onHistory={() => openHistory('hechos', 'Hechos')}
          onExport={() => exportSectionCSV(hechos, HECHOS_COLUMNS, `Hechos_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddHechoOpen(true)} title="Añadir Hecho" />}
        >
          <HechosSection data={hechos} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addHechoOpen}
            onOpenChange={setAddHechoOpen}
            mode="create"
            entityName="hechos"
            entityLabel="Hecho"
            portfolioId={portfolio_id}
            fields={HECHOS_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Informacion Economica (1:1) */}
        {sectionHasData['informacion-economica'] && (
        <SectionAccordion
          id="informacion-economica"
          title="Información Económica"
          isOpen={isSectionOpen('informacion-economica')}
          onToggle={toggleSection}
          onHistory={() => openHistory('informacion_economica', 'Información Económica')}
          headerAction={
            informacion_economica
              ? <EditButton onClick={() => setInfoEconModal({ open: true, mode: 'edit', record: informacion_economica })} title="Editar Información Económica" />
              : <AddButton onClick={() => setInfoEconModal({ open: true, mode: 'create', record: null })} title="Añadir Información Económica" />
          }
        >
          <InformacionEconomicaSection data={informacion_economica} />
        </SectionAccordion>
        )}

        {/* Importes (read-only computed) */}
        {sectionHasData['importes'] && (
        <SectionAccordion
          id="importes"
          title="Importes (Datos Relevantes)"
          isOpen={isSectionOpen('importes')}
          onToggle={toggleSection}
        >
          <ImportesSection data={datos_relevantes} />
        </SectionAccordion>
        )}

        {/* Etiquetas (1:N) */}
        {sectionHasData['etiquetas'] && (
        <SectionAccordion
          id="etiquetas"
          title="Etiquetas"
          count={getArrayLength(etiquetas)}
          isOpen={isSectionOpen('etiquetas')}
          onToggle={toggleSection}
          onHistory={() => openHistory('etiquetas', 'Etiquetas')}
          onExport={() => exportSectionCSV(etiquetas, ETIQUETAS_COLUMNS, `Etiquetas_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddEtiquetaOpen(true)} title="Añadir Etiqueta" />}
        >
          <EtiquetasSection data={etiquetas} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addEtiquetaOpen}
            onOpenChange={setAddEtiquetaOpen}
            mode="create"
            entityName="etiquetas"
            entityLabel="Etiqueta"
            portfolioId={portfolio_id}
            fields={ETIQUETAS_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Acciones (1:N) */}
        {sectionHasData['acciones'] && (
        <SectionAccordion
          id="acciones"
          title="Acciones"
          count={getArrayLength(acciones)}
          isOpen={isSectionOpen('acciones')}
          onToggle={toggleSection}
          onHistory={() => openHistory('acciones', 'Acciones')}
          onExport={() => exportSectionCSV(acciones, ACCIONES_COLUMNS, `Acciones_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddAccionOpen(true)} title="Añadir Accion" />}
        >
          <AccionesSection data={acciones} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addAccionOpen}
            onOpenChange={setAddAccionOpen}
            mode="create"
            entityName="acciones"
            entityLabel="Accion"
            portfolioId={portfolio_id}
            fields={ACCIONES_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Notas (1:N - existing from feature_029) */}
        {sectionHasData['notas'] && (
        <SectionAccordion
          id="notas"
          title="Notas"
          count={getArrayLength(notas)}
          isOpen={isSectionOpen('notas')}
          onToggle={toggleSection}
          onHistory={() => openHistory('notas', 'Notas')}
          headerAction={<AddButton onClick={() => setAddNotaOpen(true)} title="Añadir Nota" />}
        >
          <NotasSection data={notas} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <NotaFormModal
            open={addNotaOpen}
            onOpenChange={setAddNotaOpen}
            mode="create"
            portfolioId={portfolio_id}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Justificaciones (1:N) */}
        {sectionHasData['justificaciones'] && (
        <SectionAccordion
          id="justificaciones"
          title="Justificaciones"
          count={getArrayLength(justificaciones)}
          isOpen={isSectionOpen('justificaciones')}
          onToggle={toggleSection}
          onHistory={() => openHistory('justificaciones', 'Justificaciones')}
          onExport={() => exportSectionCSV(justificaciones, JUSTIFICACIONES_COLUMNS, `Justificaciones_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddJustificacionOpen(true)} title="Añadir Justificacion" />}
        >
          <JustificacionesSection data={justificaciones} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addJustificacionOpen}
            onOpenChange={setAddJustificacionOpen}
            mode="create"
            entityName="justificaciones"
            entityLabel="Justificacion"
            portfolioId={portfolio_id}
            fields={JUSTIFICACIONES_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Descripciones (1:N) */}
        {sectionHasData['descripciones'] && (
        <SectionAccordion
          id="descripciones"
          title="Descripciones"
          count={getArrayLength(descripciones)}
          isOpen={isSectionOpen('descripciones')}
          onToggle={toggleSection}
          onHistory={() => openHistory('descripciones', 'Descripciones')}
          headerAction={<AddButton onClick={() => setAddDescripcionOpen(true)} title="Añadir Descripción" />}
        >
          <DescripcionesSection data={descripciones} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addDescripcionOpen}
            onOpenChange={setAddDescripcionOpen}
            mode="create"
            entityName="descripciones"
            entityLabel="Descripción"
            portfolioId={portfolio_id}
            fields={DESCRIPCIONES_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Beneficios (read-only) */}
        {sectionHasData['beneficios'] && (
        <SectionAccordion
          id="beneficios"
          title="Beneficios"
          count={getArrayLength(beneficios)}
          isOpen={isSectionOpen('beneficios')}
          onToggle={toggleSection}
          onExport={() => exportSectionCSV(beneficios, BENEFICIOS_COLUMNS, `Beneficios_${portfolio_id}.csv`)}
        >
          <BeneficiosSection data={beneficios} />
        </SectionAccordion>
        )}

        {/* LTP (1:N) */}
        {sectionHasData['ltp'] && (
        <SectionAccordion
          id="ltp"
          title="LTP"
          count={getArrayLength(ltp)}
          isOpen={isSectionOpen('ltp')}
          onToggle={toggleSection}
          onHistory={() => openHistory('ltp', 'LTP')}
          onExport={() => exportSectionCSV(ltp, LTP_COLUMNS, `LTP_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddLtpOpen(true)} title="Añadir LTP" />}
        >
          <LtpSection data={ltp} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addLtpOpen}
            onOpenChange={setAddLtpOpen}
            mode="create"
            entityName="ltp"
            entityLabel="LTP"
            portfolioId={portfolio_id}
            fields={LTP_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Facturacion (read-only) */}
        {sectionHasData['facturacion'] && (
        <SectionAccordion
          id="facturacion"
          title="Facturación"
          count={getArrayLength(facturacion)}
          isOpen={isSectionOpen('facturacion')}
          onToggle={toggleSection}
          onExport={() => exportSectionCSV(facturacion, FACTURACION_COLUMNS, `Facturacion_${portfolio_id}.csv`)}
        >
          <FacturacionSection data={facturacion} />
        </SectionAccordion>
        )}

        {/* Datos Ejecucion (read-only) */}
        {sectionHasData['datos-ejecucion'] && (
        <SectionAccordion
          id="datos-ejecucion"
          title="Datos Ejecución"
          count={getArrayLength(datos_ejecucion)}
          isOpen={isSectionOpen('datos-ejecucion')}
          onToggle={toggleSection}
          onExport={() => exportSectionCSV(datos_ejecucion, DATOS_EJECUCION_COLUMNS, `DatosEjecucion_${portfolio_id}.csv`)}
        >
          <DatosEjecucionSection data={datos_ejecucion} />
        </SectionAccordion>
        )}

        {/* Grupos Iniciativas (1:N special) */}
        {sectionHasData['grupos-iniciativas'] && (
        <SectionAccordion
          id="grupos-iniciativas"
          title="Grupos Iniciativas"
          count={
            (grupos_iniciativas?.as_grupo?.length || 0) +
            (grupos_iniciativas?.as_componente?.length || 0)
          }
          isOpen={isSectionOpen('grupos-iniciativas')}
          onToggle={toggleSection}
          onHistory={() => openHistory('grupos_iniciativas', 'Grupos Iniciativas')}
          headerAction={<AddButton onClick={() => setAddGrupoOpen(true)} title="Añadir Grupo" />}
        >
          <GruposIniciativasSection data={grupos_iniciativas} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addGrupoOpen}
            onOpenChange={setAddGrupoOpen}
            mode="create"
            entityName="grupos_iniciativas"
            entityLabel="Grupo Iniciativa"
            portfolioId={portfolio_id}
            fields={GRUPOS_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Estado Especial (1:1) */}
        {sectionHasData['estado-especial'] && (
        <SectionAccordion
          id="estado-especial"
          title="Estado Especial"
          count={estado_especial ? 1 : 0}
          isOpen={isSectionOpen('estado-especial')}
          onToggle={toggleSection}
          onHistory={() => openHistory('estado_especial', 'Estado Especial')}
          headerAction={
            estado_especial
              ? <EditButton onClick={() => setEstadoEspModal({ open: true, mode: 'edit', record: estado_especial })} title="Editar Estado Especial" />
              : <AddButton onClick={() => setEstadoEspModal({ open: true, mode: 'create', record: null })} title="Añadir Estado Especial" />
          }
        >
          <EstadoEspecialSection data={estado_especial} />
        </SectionAccordion>
        )}

        {/* Impacto AATT (1:1) */}
        {sectionHasData['impacto-aatt'] && (
        <SectionAccordion
          id="impacto-aatt"
          title="Impacto AATT"
          count={impacto_aatt ? 1 : 0}
          isOpen={isSectionOpen('impacto-aatt')}
          onToggle={toggleSection}
          onHistory={() => openHistory('impacto_aatt', 'Impacto AATT')}
          headerAction={
            impacto_aatt
              ? <EditButton onClick={() => setImpactoAattModal({ open: true, mode: 'edit', record: impacto_aatt })} title="Editar Impacto AATT" />
              : <AddButton onClick={() => setImpactoAattModal({ open: true, mode: 'create', record: null })} title="Añadir Impacto AATT" />
          }
        >
          <ImpactoAattSection data={impacto_aatt} />
        </SectionAccordion>
        )}

        {/* WBEs (1:N) */}
        {sectionHasData['wbes'] && (
        <SectionAccordion
          id="wbes"
          title="WBEs"
          count={getArrayLength(wbes)}
          isOpen={isSectionOpen('wbes')}
          onToggle={toggleSection}
          onHistory={() => openHistory('wbes', 'WBEs')}
          onExport={() => exportSectionCSV(wbes, WBES_COLUMNS, `WBEs_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddWbeOpen(true)} title="Añadir WBE" />}
        >
          <WbesSection data={wbes} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addWbeOpen}
            onOpenChange={setAddWbeOpen}
            mode="create"
            entityName="wbes"
            entityLabel="WBE"
            portfolioId={portfolio_id}
            fields={WBES_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Dependencias (1:N) */}
        {sectionHasData['dependencias'] && (
        <SectionAccordion
          id="dependencias"
          title="Dependencias"
          count={getArrayLength(dependencias)}
          isOpen={isSectionOpen('dependencias')}
          onToggle={toggleSection}
          onHistory={() => openHistory('dependencias', 'Dependencias')}
          onExport={() => exportSectionCSV(dependencias, DEPENDENCIAS_COLUMNS, `Dependencias_${portfolio_id}.csv`)}
          headerAction={<AddButton onClick={() => setAddDependenciaOpen(true)} title="Añadir Dependencia" />}
        >
          <DependenciasSection data={dependencias} portfolioId={portfolio_id} onRefetch={refetchAll} />
          <EntityFormModal
            open={addDependenciaOpen}
            onOpenChange={setAddDependenciaOpen}
            mode="create"
            entityName="dependencias"
            entityLabel="Dependencia"
            portfolioId={portfolio_id}
            fields={DEPENDENCIAS_FIELDS}
            onSuccess={refetchAll}
          />
        </SectionAccordion>
        )}

        {/* Documentos (read-only) */}
        {sectionHasData['documentos'] && (
        <SectionAccordion
          id="documentos"
          title="Documentos"
          count={getArrayLength(documentos)}
          isOpen={isSectionOpen('documentos')}
          onToggle={toggleSection}
        >
          <DocumentosSection data={documentos} />
        </SectionAccordion>
        )}

        {/* Related Initiatives */}
        {sectionHasData['related-initiatives'] && (
        <SectionAccordion
          id="related-initiatives"
          title="Iniciativas Relacionadas"
          count={relatedData?.related?.length}
          isOpen={isSectionOpen('related-initiatives')}
          onToggle={toggleSection}
        >
          <RelatedInitiativesSection data={relatedData} isLoading={relatedLoading} error={relatedError} />
        </SectionAccordion>
        )}

        {/* Activity Timeline */}
        {sectionHasData['activity-timeline'] && (
        <SectionAccordion
          id="activity-timeline"
          title="Actividad"
          count={timelineData?.total}
          isOpen={isSectionOpen('activity-timeline')}
          onToggle={toggleSection}
        >
          <ActivityTimelineSection
            data={timelineData}
            isLoading={timelineLoading}
            error={timelineError}
            hasMore={timelineHasMore}
            isFetchingMore={timelineIsFetchingMore}
            onLoadMore={timelineFetchMore}
          />
        </SectionAccordion>
        )}

        {/* Transacciones (read-only) */}
        {sectionHasData['transacciones'] && (
        <SectionAccordion
          id="transacciones"
          title="Transacciones"
          count={getArrayLength(transacciones)}
          isOpen={isSectionOpen('transacciones')}
          onToggle={toggleSection}
        >
          <TransaccionesSection data={transacciones} />
        </SectionAccordion>
        )}

        {/* Transacciones JSON (with Excel sync) */}
        {sectionHasData['transacciones-json'] && (
        <SectionAccordion
          id="transacciones-json"
          title="Transacciones JSON"
          count={getArrayLength(transaccionesJson)}
          isOpen={isSectionOpen('transacciones-json')}
          onToggle={toggleSection}
        >
          <TransaccionesJsonSection data={transaccionesJson} onRefetch={refetchTxnJson} />
        </SectionAccordion>
        )}

        {/* Empty sections summary */}
        <EmptySectionsPanel
          emptySections={emptySections}
          onCreateAction={handleCreateFromEmpty}
        />
          </div>
        </div>
      </div>

      {/* Section History Modal (shared) */}
      <SectionHistoryModal
        open={historyModal.open}
        onOpenChange={(open) => setHistoryModal((prev) => ({ ...prev, open }))}
        portfolioId={portfolio_id}
        entityName={historyModal.entityName}
        entityLabel={historyModal.entityLabel}
      />

      {/* Mobile section navigation FAB + bottom sheet */}
      <MobileDetailNav
        items={SECTION_DEFS.filter((def) => sectionHasData[def.id]).map((def) => ({
          label: def.navLabel || def.title,
          anchor: def.id,
          badge: def.type === 'single'
            ? (getSectionCount(def, data, transaccionesJson, extraSectionCounts) > 0 ? 'exists' : undefined)
            : (getSectionCount(def, data, transaccionesJson, extraSectionCounts) || undefined),
        }))}
        activeSection={activeSection}
        onSectionClick={(anchor) => {
          // Expand section if collapsed
          setOpenSections((prev) => {
            const base = prev ?? effectiveOpenSections
            const next = new Set(base)
            next.add(anchor)
            return next
          })
        }}
      />

      {/* 1:1 Entity Modals */}
      <EntityFormModal
        open={datosDescModal.open}
        onOpenChange={(open) => setDatosDescModal((prev) => ({ ...prev, open }))}
        mode={datosDescModal.mode}
        entityName="datos_descriptivos"
        entityLabel="Datos Descriptivos"
        portfolioId={portfolio_id}
        record={datosDescModal.record}
        fields={DATOS_DESCRIPTIVOS_FIELDS}
        onSuccess={refetchAll}
        disableDelete
      />
      <EntityFormModal
        open={infoEconModal.open}
        onOpenChange={(open) => setInfoEconModal((prev) => ({ ...prev, open }))}
        mode={infoEconModal.mode}
        entityName="informacion_economica"
        entityLabel="Información Económica"
        portfolioId={portfolio_id}
        record={infoEconModal.record}
        fields={INFO_ECONOMICA_FIELDS}
        onSuccess={refetchAll}
      />
      <EntityFormModal
        open={estadoEspModal.open}
        onOpenChange={(open) => setEstadoEspModal((prev) => ({ ...prev, open }))}
        mode={estadoEspModal.mode}
        entityName="estado_especial"
        entityLabel="Estado Especial"
        portfolioId={portfolio_id}
        record={estadoEspModal.record}
        fields={ESTADO_ESPECIAL_FIELDS}
        onSuccess={refetchAll}
      />
      <EntityFormModal
        open={impactoAattModal.open}
        onOpenChange={(open) => setImpactoAattModal((prev) => ({ ...prev, open }))}
        mode={impactoAattModal.mode}
        entityName="impacto_aatt"
        entityLabel="Impacto AATT"
        portfolioId={portfolio_id}
        record={impactoAattModal.record}
        fields={IMPACTO_AATT_FIELDS}
        onSuccess={refetchAll}
      />
    </Layout>
  )
}
