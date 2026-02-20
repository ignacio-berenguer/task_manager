import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'estado', label: 'Estado', type: 'text' },
  { key: 'siguiente_accion', label: 'Siguiente Acción', type: 'longtext' },
  { key: 'siguiente_accion_comentarios', label: 'Comentarios', type: 'longtext' },
  { key: 'importe_2025', label: 'Importe 2025', type: 'currency' },
  { key: 'importe_2026', label: 'Importe 2026', type: 'currency' },
]

const FORM_FIELDS = [
  { key: 'siguiente_accion_comentarios', label: 'Comentarios Siguiente Acción', type: 'longtext' },
]

export function AccionesSection({ data, portfolioId, onRefetch }) {
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
          entityName="acciones"
          entityLabel="Acción"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
