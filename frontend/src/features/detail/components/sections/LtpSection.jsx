import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'tarea', label: 'Tarea', type: 'longtext' },
  { key: 'responsable', label: 'Responsable', type: 'text' },
  { key: 'estado', label: 'Estado', type: 'text' },
  { key: 'siguiente_accion', label: 'Siguiente Acción', type: 'longtext' },
  { key: 'fecha_creacion', label: 'Fecha Creación', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const FORM_FIELDS = [
  { key: 'responsable', label: 'Responsable', parametric: 'responsable' },
  { key: 'tarea', label: 'Tarea', type: 'longtext' },
  { key: 'siguiente_accion', label: 'Siguiente Acción', type: 'longtext' },
  { key: 'estado', label: 'Estado', parametric: 'estado' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

export function LtpSection({ data, portfolioId, onRefetch }) {
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
          entityName="ltp"
          entityLabel="LTP"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
