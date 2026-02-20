import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import apiClient from '@/api/client'
import { useExcelProcessStatus } from '../../hooks/useExcelProcessStatus'
import {
  TIPO_OPERACION_COLORS,
  ESTADO_DB_COLORS,
  TransactionBadge as Badge,
} from '@/lib/badgeColors'

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return val
  }
}

function formatJson(val) {
  if (!val) return null
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return JSON.stringify(parsed, null, 2)
  } catch {
    return val
  }
}

function ExpandedDetail({ record }) {
  return (
    <div className="grid gap-3 p-4 text-sm bg-muted/30">
      <div>
        <span className="font-medium text-muted-foreground">Clave Primaria (DB):</span>
        <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
          {formatJson(record.clave_primaria) || '—'}
        </pre>
      </div>
      {record.clave_primaria_excel && (
        <div>
          <span className="font-medium text-muted-foreground">Clave Primaria Excel:</span>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
            {formatJson(record.clave_primaria_excel)}
          </pre>
        </div>
      )}
      {record.cambios && (
        <div>
          <span className="font-medium text-muted-foreground">Cambios:</span>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
            {formatJson(record.cambios)}
          </pre>
        </div>
      )}
      {record.valores_previos_excel && (
        <div>
          <span className="font-medium text-muted-foreground">Valores Previos Excel:</span>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
            {formatJson(record.valores_previos_excel)}
          </pre>
        </div>
      )}
      {record.fecha_ejecucion_db && (
        <div>
          <span className="font-medium text-muted-foreground">Fecha Ejecución DB:</span>
          <span className="ml-2 text-xs">{formatDate(record.fecha_ejecucion_db)}</span>
        </div>
      )}
      {record.fecha_ejecucion_excel && (
        <div>
          <span className="font-medium text-muted-foreground">Fecha Ejecución Excel:</span>
          <span className="ml-2 text-xs">{formatDate(record.fecha_ejecucion_excel)}</span>
        </div>
      )}
      {record.error_detalle && (
        <div>
          <span className="font-medium text-destructive">Error:</span>
          <pre className="mt-1 p-2 bg-destructive/10 text-destructive rounded text-xs overflow-x-auto">
            {record.error_detalle}
          </pre>
        </div>
      )}
    </div>
  )
}

export function TransaccionesJsonSection({ data, onRefetch }) {
  const [expandedId, setExpandedId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: processStatus } = useExcelProcessStatus(isProcessing)

  const pendingCount = (data || []).filter(
    (r) => r.estado_excel === 'PENDIENTE'
  ).length

  // Watch for processing completion
  useEffect(() => {
    if (!isProcessing || !processStatus) return

    if (processStatus.status === 'completed') {
      setIsProcessing(false)
      const { success = 0, errors = 0 } = processStatus
      if (errors === 0) {
        toast.success(`Excel sincronizado: ${success} operaciones correctas`)
      } else if (success > 0) {
        toast.warning(`Excel sincronizado: ${success} correctas, ${errors} errores`)
      } else {
        toast.error(`Error al sincronizar con Excel: ${errors} errores`)
      }
      onRefetch?.()
    }
  }, [processStatus, isProcessing, onRefetch])

  const handleProcessExcel = useCallback(async () => {
    try {
      setIsProcessing(true)
      toast.info(`Sincronizando con Excel... (${pendingCount} pendientes)`)
      await apiClient.post('/transacciones-json/process-excel')
    } catch (err) {
      setIsProcessing(false)
      toast.error('Error al iniciar sincronización con Excel')
    }
  }, [pendingCount])

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!a.fecha_creacion) return 1
    if (!b.fecha_creacion) return -1
    return b.fecha_creacion.localeCompare(a.fecha_creacion)
  })

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground p-2">Sin transacciones JSON.</p>
  }

  return (
    <div className="space-y-2">
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessExcel}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Sincronizando...' : `Sincronizar Excel (${pendingCount})`}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-2 w-8"></th>
              <th className="p-2">ID</th>
              <th className="p-2">Entidad</th>
              <th className="p-2">Operación</th>
              <th className="p-2">Estado DB</th>
              <th className="p-2">Estado Excel</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Usuario</th>
              <th className="p-2 max-w-[200px]">Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((record) => (
              <TransactionRow
                key={record.id}
                record={record}
                isExpanded={expandedId === record.id}
                onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionRow({ record, isExpanded, onToggle }) {
  return (
    <>
      <tr
        className="border-b hover:bg-muted/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-2">
          {isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </td>
        <td className="p-2 font-mono text-xs">{record.id}</td>
        <td className="p-2">{record.entidad}</td>
        <td className="p-2">
          <Badge className={TIPO_OPERACION_COLORS[record.tipo_operacion] || ''}>
            {record.tipo_operacion}
          </Badge>
        </td>
        <td className="p-2">
          <Badge className={ESTADO_DB_COLORS[record.estado_db] || ''}>
            {record.estado_db}
          </Badge>
        </td>
        <td className="p-2">
          <Badge className={ESTADO_DB_COLORS[record.estado_excel] || ''}>
            {record.estado_excel}
          </Badge>
        </td>
        <td className="p-2 text-xs whitespace-nowrap">{formatDate(record.fecha_creacion)}</td>
        <td className="p-2 text-xs truncate max-w-[120px]">{record.usuario || '—'}</td>
        <td className="p-2 text-xs truncate max-w-[200px]">{record.mensaje_commit || '—'}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9}>
            <ExpandedDetail record={record} />
          </td>
        </tr>
      )}
    </>
  )
}
