import React, { useState } from 'react'
import { Download, Code2, FileText, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toSharePointOnlineUrl } from '@/lib/sharepoint'
import { EstadoTag } from '@/components/shared/EstadoTag'
import { JsonViewerModal } from '@/components/shared/JsonViewerModal'
import { SummaryViewerModal } from '@/components/shared/SummaryViewerModal'

function DetailField({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}:</span>
      <span className="text-xs break-all">{value}</span>
    </div>
  )
}

export function DocumentosSection({ data }) {
  const [jsonModal, setJsonModal] = useState(null)
  const [summaryModal, setSummaryModal] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleRow = (index) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No data available</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-2 w-8" />
              <th className="p-2 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo Documento</th>
              <th className="p-2 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Fichero</th>
              <th className="p-2 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado Proceso</th>
              <th className="p-2 w-8" />
              <th className="p-2 w-8" />
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isExpanded = expandedRows.has(index)
              const hasDetails = row.ruta_documento || row.enlace_documento || row.fecha_creacion || row.fecha_actualizacion || row.tokens_input || row.tokens_output

              return (
                <React.Fragment key={row.nombre_fichero || index}>
                  <tr
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-accent/50 bg-background',
                      hasDetails && 'cursor-pointer'
                    )}
                    onClick={() => hasDetails && toggleRow(index)}
                  >
                    <td className="p-2 w-8">
                      {hasDetails && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="p-2">
                      <span className="block truncate max-w-[300px]" title={row.tipo_documento || ''}>
                        {row.tipo_documento || '-'}
                      </span>
                    </td>
                    <td className="p-2">
                      {row.enlace_documento ? (
                        <a
                          href={toSharePointOnlineUrl(row.enlace_documento)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.nombre_fichero}
                        </a>
                      ) : (
                        row.nombre_fichero || '-'
                      )}
                    </td>
                    <td className="p-2">
                      <EstadoTag value={row.estado_proceso_documento} />
                    </td>
                    <td className="p-2 w-8" onClick={(e) => e.stopPropagation()}>
                      {row.enlace_documento && (
                        <a
                          href={row.enlace_documento}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Descargar documento"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                    <td className="p-2 w-8" onClick={(e) => e.stopPropagation()}>
                      {row.resumen_documento && (
                        <button
                          onClick={() => setJsonModal(row)}
                          title="Ver JSON"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Code2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                    <td className="p-2 w-8" onClick={(e) => e.stopPropagation()}>
                      {row.resumen_documento && (
                        <button
                          onClick={() => setSummaryModal(row)}
                          title="Ver Resumen"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={7} className="px-10 py-3">
                        <div className="flex flex-col gap-1.5">
                          <DetailField label="Ruta Documento" value={row.ruta_documento} />
                          <DetailField label="Enlace" value={row.enlace_documento} />
                          <DetailField label="Fecha Creacion" value={row.fecha_creacion} />
                          <DetailField label="Fecha Actualizacion" value={row.fecha_actualizacion} />
                          <DetailField label="Tokens Input" value={row.tokens_input} />
                          <DetailField label="Tokens Output" value={row.tokens_output} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

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
