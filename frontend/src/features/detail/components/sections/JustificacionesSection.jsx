import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'tipo_justificacion', label: 'Tipo', type: 'text' },
  { key: 'valor', label: 'Valor', type: 'longtext' },
  { key: 'fecha_modificacion', label: 'Fecha', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const FORM_FIELDS = [
  { key: 'tipo_justificacion', label: 'Tipo Justificacion' },
  { key: 'valor', label: 'Valor', type: 'longtext' },
  { key: 'fecha_modificacion', label: 'Fecha Modificacion', type: 'datetime' },
  { key: 'origen_registro', label: 'Origen Registro' },
]

export function JustificacionesSection({ data, portfolioId, onRefetch }) {
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
          entityName="justificaciones"
          entityLabel="Justificacion"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
