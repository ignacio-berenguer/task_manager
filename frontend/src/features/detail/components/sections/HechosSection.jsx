import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'partida_presupuestaria', label: 'Partida', type: 'text' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'estado', label: 'Estado', type: 'estado' },
  { key: 'notas', label: 'Notas', type: 'longtext' },
  { key: 'racional', label: 'Racional', type: 'longtext' },
]

const FORM_FIELDS = [
  { key: 'partida_presupuestaria', label: 'Partida Presupuestaria' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'estado', label: 'Estado', parametric: 'estado' },
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'importe_ri', label: 'Importe RI', type: 'currency' },
  { key: 'importe_re', label: 'Importe RE', type: 'currency' },
  { key: 'notas', label: 'Notas', type: 'longtext' },
  { key: 'racional', label: 'Racional', type: 'longtext' },
  { key: 'calidad_estimacion', label: 'Calidad Estimación' },
]

export function HechosSection({ data, portfolioId, onRefetch }) {
  const [editRecord, setEditRecord] = useState(null)

  const sortedData = [...(data || [])].sort((a, b) => (a.id_hecho || 0) - (b.id_hecho || 0))

  return (
    <>
      <SimpleTable
        data={sortedData}
        columns={COLUMNS}
        onRowEdit={portfolioId ? setEditRecord : undefined}
      />
      {editRecord && (
        <EntityFormModal
          open={!!editRecord}
          onOpenChange={(open) => { if (!open) setEditRecord(null) }}
          mode="edit"
          entityName="hechos"
          entityLabel="Hecho"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
