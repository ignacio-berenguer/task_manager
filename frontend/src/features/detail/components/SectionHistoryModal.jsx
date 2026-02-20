import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPERATION_STYLES = {
  INSERT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  UPSERT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_STYLES = {
  EJECUTADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const SOURCE_STYLES = {
  app: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  excel: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parseJSON(str) {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

function JsonKeyValue({ data }) {
  if (!data || typeof data !== 'object') return null
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-muted-foreground text-xs">vacío</span>
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <span className="text-xs font-medium text-muted-foreground">{key}</span>
          <span className="text-xs break-all">{value === null ? <em className="text-muted-foreground">null</em> : String(value)}</span>
        </div>
      ))}
    </div>
  )
}

function HistoryRow({ item }) {
  const [expanded, setExpanded] = useState(false)
  const cambios = parseJSON(item.cambios)
  const clavePrimaria = parseJSON(item.clave_primaria)

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 hover:bg-muted/30 transition-colors flex items-start gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <div className="flex-1 min-w-0 grid grid-cols-[130px_50px_1fr_70px_75px_1fr] gap-2 items-center text-sm">
          <span className="text-xs text-muted-foreground">{formatDate(item.fecha_creacion)}</span>
          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium w-fit', SOURCE_STYLES[item.source] || '')}>
            {item.source === 'app' ? 'App' : 'Excel'}
          </span>
          <span className="truncate">{item.usuario || '—'}</span>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit', OPERATION_STYLES[item.tipo_operacion] || '')}>
            {item.tipo_operacion}
          </span>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit', STATUS_STYLES[item.estado_db] || '')}>
            {item.estado_db}
          </span>
          <span className="truncate text-xs text-muted-foreground">{item.mensaje_commit || '—'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-9 space-y-2">
          {clavePrimaria && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Clave Primaria</p>
              <div className="bg-muted/40 rounded p-2">
                <JsonKeyValue data={clavePrimaria} />
              </div>
            </div>
          )}
          {cambios && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cambios</p>
              <div className="bg-muted/40 rounded p-2">
                <JsonKeyValue data={cambios} />
              </div>
            </div>
          )}
          {!clavePrimaria && !cambios && (
            <p className="text-xs text-muted-foreground italic">Sin detalles disponibles</p>
          )}
        </div>
      )}
    </div>
  )
}

export function SectionHistoryModal({ open, onOpenChange, portfolioId, entityName, entityLabel }) {
  const { data, isLoading } = useQuery({
    queryKey: ['section-history', portfolioId, entityName],
    queryFn: async () => {
      const { data } = await apiClient.get(`/portfolio/${portfolioId}/history`, {
        params: { entity: entityName },
      })
      return data
    },
    enabled: open && !!portfolioId && !!entityName,
  })

  const history = data?.history || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} size="lg">
        <DialogHeader>
          <DialogTitle>Historial — {entityLabel}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando historial...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay cambios registrados para esta sección
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
            {/* Header */}
            <div className="sticky top-0 bg-muted/60 backdrop-blur-sm px-3 py-2 grid grid-cols-[20px_130px_50px_1fr_70px_75px_1fr] gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
              <span />
              <span>Fecha</span>
              <span>Origen</span>
              <span>Usuario</span>
              <span>Operación</span>
              <span>Estado</span>
              <span>Mensaje</span>
            </div>
            {history.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
