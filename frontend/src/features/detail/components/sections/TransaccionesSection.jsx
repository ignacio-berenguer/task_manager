import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  TIPO_CAMBIO_COLORS,
  ESTADO_CAMBIO_COLORS,
  TransactionBadge,
} from '@/lib/badgeColors'

function formatDate(val) {
  if (!val) return '—'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = val.split('-')
    return `${day}/${month}/${year}`
  }
  return val
}

function ExpandedDetail({ record }) {
  return (
    <div className="grid gap-3 p-4 text-sm bg-muted/30">
      {record.valor_nuevo && (
        <div>
          <span className="font-medium text-muted-foreground">Valor Nuevo:</span>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {record.valor_nuevo}
          </pre>
        </div>
      )}
      {record.valor_antes_del_cambio && (
        <div>
          <span className="font-medium text-muted-foreground">Valor Anterior:</span>
          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {record.valor_antes_del_cambio}
          </pre>
        </div>
      )}
    </div>
  )
}

function TransaccionRow({ record, isExpanded, onToggle }) {
  const hasDetails = record.valor_nuevo || record.valor_antes_del_cambio

  return (
    <>
      <tr
        className={`border-b hover:bg-muted/50 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="p-2 w-8">
          {hasDetails && (
            isExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </td>
        <td className="p-2 text-xs whitespace-nowrap">{formatDate(record.fecha_registro_cambio)}</td>
        <td className="p-2">{record.tabla}</td>
        <td className="p-2">{record.campo_tabla}</td>
        <td className="p-2">
          <TransactionBadge className={TIPO_CAMBIO_COLORS[record.tipo_cambio] || 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'}>
            {record.tipo_cambio || '—'}
          </TransactionBadge>
        </td>
        <td className="p-2">
          <TransactionBadge className={ESTADO_CAMBIO_COLORS[record.estado_cambio] || 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'}>
            {record.estado_cambio || '—'}
          </TransactionBadge>
        </td>
      </tr>
      {isExpanded && hasDetails && (
        <tr>
          <td colSpan={6}>
            <ExpandedDetail record={record} />
          </td>
        </tr>
      )}
    </>
  )
}

export function TransaccionesSection({ data }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground p-2">Sin transacciones.</p>
  }

  const sortedData = [...data].sort((a, b) => {
    if (!a.fecha_registro_cambio) return 1
    if (!b.fecha_registro_cambio) return -1
    return b.fecha_registro_cambio.localeCompare(a.fecha_registro_cambio)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-2 w-8"></th>
            <th className="p-2">Fecha Registro</th>
            <th className="p-2">Tabla</th>
            <th className="p-2">Campo</th>
            <th className="p-2">Tipo Cambio</th>
            <th className="p-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((record, index) => {
            const rowId = record.id || index
            return (
              <TransaccionRow
                key={rowId}
                record={record}
                isExpanded={expandedId === rowId}
                onToggle={() => setExpandedId(expandedId === rowId ? null : rowId)}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
