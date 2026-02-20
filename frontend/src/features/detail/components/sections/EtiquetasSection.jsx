import { useState } from 'react'
import { SimpleTable } from '../SimpleTable'
import { EntityFormModal } from '../EntityFormModal'

export const COLUMNS = [
  { key: 'etiqueta', label: 'Etiqueta', type: 'text' },
  { key: 'valor', label: 'Valor', type: 'text' },
  { key: 'fecha_modificacion', label: 'Fecha Modificación', type: 'date' },
  { key: 'origen_registro', label: 'Origen', type: 'longtext' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

const FORM_FIELDS = [
  { key: 'etiqueta', label: 'Etiqueta' },
  { key: 'valor', label: 'Valor' },
  { key: 'origen_registro', label: 'Origen Registro' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

export function EtiquetasSection({ data, portfolioId, onRefetch }) {
  const [editRecord, setEditRecord] = useState(null)

  const sortedData = [...(data || [])].sort((a, b) =>
    (a.etiqueta || '').localeCompare(b.etiqueta || '')
  )

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
          entityName="etiquetas"
          entityLabel="Etiqueta"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
