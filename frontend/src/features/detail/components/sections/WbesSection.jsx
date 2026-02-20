import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'anio', label: 'Año', type: 'text' },
  { key: 'wbe_pyb', label: 'WBE PyB', type: 'text' },
  { key: 'descripcion_pyb', label: 'Descripción PyB', type: 'text' },
  { key: 'wbe_can', label: 'WBE CAN', type: 'text' },
  { key: 'descripcion_can', label: 'Descripción CAN', type: 'text' },
]

const FORM_FIELDS = [
  { key: 'anio', label: 'Año', parametric: 'anio' },
  { key: 'wbe_pyb', label: 'WBE PyB' },
  { key: 'descripcion_pyb', label: 'Descripción PyB' },
  { key: 'wbe_can', label: 'WBE CAN' },
  { key: 'descripcion_can', label: 'Descripción CAN' },
]

export function WbesSection({ data, portfolioId, onRefetch }) {
  const [editRecord, setEditRecord] = useState(null)

  return (
    <>
      <SimpleTable
        data={data}
        columns={COLUMNS}
        onRowEdit={portfolioId ? setEditRecord : undefined}
      />
      {editRecord && (
        <EntityFormModal
          open={!!editRecord}
          onOpenChange={(open) => { if (!open) setEditRecord(null) }}
          mode="edit"
          entityName="wbes"
          entityLabel="WBE"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
