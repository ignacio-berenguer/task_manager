import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'descripcion_dependencia', label: 'Descripción Dependencia', type: 'longtext' },
  { key: 'fecha_dependencia', label: 'Fecha Dependencia', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const FORM_FIELDS = [
  { key: 'descripcion_dependencia', label: 'Descripción Dependencia', type: 'longtext' },
  { key: 'fecha_dependencia', label: 'Fecha Dependencia', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

export function DependenciasSection({ data, portfolioId, onRefetch }) {
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
          entityName="dependencias"
          entityLabel="Dependencia"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
