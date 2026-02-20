import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { formatCurrencyFull } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { getBadgeColorClass } from '@/lib/badgeColors'
import { useEtiquetasDestacadas } from '@/features/parametricas/hooks/useEtiquetasDestacadas'
import { useParametroColors } from '@/hooks/useParametroColors'
import apiClient from '@/api/client'

// Helper to determine SM status badge properties
// Returns: { text, color: 'green' | 'red' | 'amber' }
function getSmBadgeProps(value, label) {
  if (!value) {
    return { text: `Sin ${label}`, color: 'red' }
  }
  const lowerValue = value.toLowerCase()
  if (lowerValue.includes('cancelada') || lowerValue.includes('cancelado')) {
    return { text: 'Cancelada', color: 'red' }
  }
  if (lowerValue.includes('pendiente')) {
    return { text: `${label} Pendiente`, color: 'amber' }
  }
  return { text: `Tiene ${label}`, color: 'green' }
}

// Badge color classes
const BADGE_COLORS = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

// Simple badge component for status display
function SmBadge({ text, color = 'green' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[color]}`}
    >
      {text}
    </span>
  )
}

function formatDate(val) {
  if (!val) return '-'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = val.split('-')
    return `${day}/${month}/${year}`
  }
  return val
}

function formatCurrencyK(value) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return value
  const k = num / 1000
  return `${k.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k\u20AC`
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Reusable compact table section for the drawer.
 * Only renders the table when data.length > 0; shows empty message otherwise.
 */
function DrawerSection({ title, data, columns, renderRow, emptyLabel }) {
  return (
    <div>
      <h3 className="text-sm font-semibold font-heading mb-2">
        {title} ({data.length})
      </h3>
      {data.length === 0 ? (
        <EmptyState compact title={`Sin ${emptyLabel || title.toLowerCase()}`} />
      ) : (
        <div className="rounded-lg border overflow-x-auto max-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`p-2 text-left text-xs font-semibold text-muted-foreground ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{data.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function InitiativeDrawer({ isOpen, onClose, rowData }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { data: etiquetasDestacadas = [] } = useEtiquetasDestacadas()
  const estadoColorMap = useParametroColors('estado_de_la_iniciativa')

  const portfolioId = rowData?.portfolio_id

  useEffect(() => {
    if (!isOpen || !portfolioId) {
      setPortfolioData(null)
      return
    }

    let cancelled = false
    setLoading(true)

    apiClient
      .get(`/portfolio/${portfolioId}`)
      .then((res) => {
        if (!cancelled) setPortfolioData(res.data)
      })
      .catch(() => {
        if (!cancelled) setPortfolioData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [isOpen, portfolioId])

  // Compute highlighted etiquetas (must be before early return to respect Rules of Hooks)
  const etiquetasRaw = portfolioData?.etiquetas || []
  const highlightedEtiquetas = useMemo(() => {
    return etiquetasRaw
      .filter((e) => etiquetasDestacadas.some((ed) => ed.etiqueta?.toLowerCase() === e.etiqueta?.toLowerCase()))
      .map((e) => {
        const match = etiquetasDestacadas.find((ed) => ed.etiqueta?.toLowerCase() === e.etiqueta?.toLowerCase())
        return { etiqueta: e.etiqueta, color: match?.color || 'blue' }
      })
  }, [etiquetasRaw, etiquetasDestacadas])

  if (!rowData) return null

  // Use portfolioData as fallback for fields that may be missing from report results
  const datosDesc = portfolioData?.datos_descriptivos?.[0] || {}
  const iniciativa = portfolioData?.iniciativas?.[0] || {}

  // Status badge values
  const estadoIniciativa = rowData?.estado_de_la_iniciativa || iniciativa.estado_de_la_iniciativa
  const estadoSm100 = datosDesc.estado_sm100
  const estadoSm200 = datosDesc.estado_sm200
  const iniciativaAprobada = datosDesc.iniciativa_aprobada

  const sm100Badge = getSmBadgeProps(estadoSm100, 'SM100')
  const sm200Badge = getSmBadgeProps(estadoSm200, 'SM200')

  const importeField = `importe_${CURRENT_YEAR}`
  const importeValue = rowData[importeField] ?? datosDesc[importeField]

  const displayNombre = rowData.nombre || datosDesc.nombre || '-'

  const fields = [
    { label: 'Origen', value: rowData.origen || datosDesc.origen },
    { label: 'Digital Framework', value: rowData.digital_framework_level_1 || datosDesc.digital_framework_level_1 },
    { label: 'Estado', value: rowData.estado_de_la_iniciativa || iniciativa.estado_de_la_iniciativa, isEstado: true },
    { label: 'Priorización', value: rowData.priorizacion || iniciativa.prioridad_descriptiva },
    { label: 'Cluster', value: rowData.cluster || datosDesc.cluster },
    { label: 'Fecha Estado', value: formatDate(rowData.fecha_de_estado_de_la_iniciativa || iniciativa.fecha_de_ultimo_estado) },
  ]

  // Extract data arrays from portfolio response
  const hechos = portfolioData?.hechos || []
  const notas = portfolioData?.notas || []
  const justificaciones = portfolioData?.justificaciones || []
  const descripciones = portfolioData?.descripciones || []
  const dependencias = portfolioData?.dependencias || []

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent onClose={onClose}>
        <SheetHeader>
          <p className="text-sm font-mono text-muted-foreground">{portfolioId}</p>
          <h2 className="text-lg font-bold font-heading leading-tight mt-1">
            {displayNombre}
          </h2>
          {highlightedEtiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {highlightedEtiquetas.map((et) => (
                <span
                  key={et.etiqueta}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeColorClass(et.color)}`}
                >
                  {et.etiqueta}
                </span>
              ))}
            </div>
          )}
          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {estadoIniciativa && (
              <EstadoTag value={estadoIniciativa} colorMap={estadoColorMap} />
            )}
            <SmBadge text={sm100Badge.text} color={sm100Badge.color} />
            <SmBadge text={sm200Badge.text} color={sm200Badge.color} />
            <SmBadge
              text={iniciativaAprobada === 'Sí' ? 'Aprobada' : 'No Aprobada'}
              color={iniciativaAprobada === 'Sí' ? 'green' : 'red'}
            />
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Key-value fields */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map(({ label, value, isEstado }) => (
              <div key={label} className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-xs text-muted-foreground truncate">{label}</span>
                {isEstado ? (
                  <EstadoTag value={value} />
                ) : (
                  <span className="text-sm font-medium break-all">{value || '-'}</span>
                )}
              </div>
            ))}
          </div>

          {/* Importe current year */}
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Importe {CURRENT_YEAR}</span>
              <span className="text-sm font-medium">
                {importeValue != null && importeValue !== '' ? (
                  <CurrencyCell
                    value={importeValue}
                    formattedValue={formatCurrencyK(importeValue)}
                  />
                ) : (
                  '-'
                )}
              </span>
            </div>
          </TooltipProvider>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Data sections — only render when not loading */}
          {!loading && (
            <TooltipProvider delayDuration={200}>
              {/* Hechos */}
              <DrawerSection
                title="Hechos"
                data={hechos}
                emptyLabel="hechos registrados"
                columns={[
                  { key: 'estado', label: 'Estado' },
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'importe', label: 'Importe', className: 'text-right' },
                ]}
                renderRow={(h, i) => (
                  <tr key={h.id_hecho || i} className="border-b border-border/50">
                    <td className="p-2 text-sm"><EstadoTag value={h.estado} /></td>
                    <td className="p-2 text-sm whitespace-nowrap">{formatDate(h.fecha)}</td>
                    <td className="p-2 text-sm text-right">
                      {h.importe != null && h.importe !== '' ? (
                        <CurrencyCell
                          value={h.importe}
                          formattedValue={formatCurrencyK(h.importe)}
                        />
                      ) : '-'}
                    </td>
                  </tr>
                )}
              />

              {/* Notas */}
              <DrawerSection
                title="Notas"
                data={notas}
                emptyLabel="notas registradas"
                columns={[
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'registrado_por', label: 'Autor' },
                  { key: 'nota', label: 'Nota' },
                ]}
                renderRow={(n, i) => (
                  <tr key={`nota-${i}`} className="border-b border-border/50">
                    <td className="p-2 text-sm whitespace-nowrap">{formatDate(n.fecha)}</td>
                    <td className="p-2 text-sm whitespace-nowrap">{n.registrado_por || '-'}</td>
                    <td className="p-2 text-sm whitespace-pre-wrap max-w-[250px]">{n.nota || '-'}</td>
                  </tr>
                )}
              />

              {/* Justificaciones */}
              <DrawerSection
                title="Justificaciones"
                data={justificaciones}
                emptyLabel="justificaciones registradas"
                columns={[
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'valor', label: 'Valor' },
                  { key: 'comentarios', label: 'Comentarios' },
                ]}
                renderRow={(j, i) => (
                  <tr key={`just-${i}`} className="border-b border-border/50">
                    <td className="p-2 text-sm whitespace-nowrap">{j.tipo_justificacion || '-'}</td>
                    <td className="p-2 text-sm">{j.valor || '-'}</td>
                    <td className="p-2 text-sm whitespace-pre-wrap max-w-[200px]">{j.comentarios || '-'}</td>
                  </tr>
                )}
              />

              {/* Descripciones */}
              <DrawerSection
                title="Descripciones"
                data={descripciones}
                emptyLabel="descripciones registradas"
                columns={[
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'descripcion', label: 'Descripción' },
                ]}
                renderRow={(d, i) => (
                  <tr key={`desc-${i}`} className="border-b border-border/50">
                    <td className="p-2 text-sm whitespace-nowrap">{d.tipo_descripcion || '-'}</td>
                    <td className="p-2 text-sm whitespace-pre-wrap max-w-[300px]">{d.descripcion || '-'}</td>
                  </tr>
                )}
              />

              {/* Dependencias */}
              <DrawerSection
                title="Dependencias"
                data={dependencias}
                emptyLabel="dependencias registradas"
                columns={[
                  { key: 'descripcion', label: 'Descripción' },
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'comentarios', label: 'Comentarios' },
                ]}
                renderRow={(dep, i) => (
                  <tr key={`dep-${i}`} className="border-b border-border/50">
                    <td className="p-2 text-sm whitespace-pre-wrap max-w-[200px]">{dep.descripcion_dependencia || '-'}</td>
                    <td className="p-2 text-sm whitespace-nowrap">{formatDate(dep.fecha_dependencia)}</td>
                    <td className="p-2 text-sm whitespace-pre-wrap max-w-[200px]">{dep.comentarios || '-'}</td>
                  </tr>
                )}
              />
            </TooltipProvider>
          )}

        </div>
        {/* Go to Initiative button — sticky footer */}
        <div className="border-t bg-background px-6 py-3 shrink-0">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onClose()
              navigate(`/detail/${portfolioId}`, { state: { from: { route: location.pathname, label: 'Vista Rapida' } } })
            }}
          >
            Ir a la iniciativa
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
