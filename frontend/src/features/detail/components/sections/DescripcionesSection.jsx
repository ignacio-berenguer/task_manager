import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EntityFormModal } from '../EntityFormModal'

const FORM_FIELDS = [
  { key: 'tipo_descripcion', label: 'Tipo Descripción' },
  { key: 'descripcion', label: 'Descripción', type: 'longtext' },
  { key: 'origen_registro', label: 'Origen Registro' },
  { key: 'comentarios', label: 'Comentarios', type: 'longtext' },
]

export function DescripcionesSection({ data, portfolioId, onRefetch }) {
  const [editRecord, setEditRecord] = useState(null)

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No descriptions available</p>
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((desc, index) => (
          <div
            key={desc.id || index}
            className={cn(
              'border rounded-lg p-3',
              index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-muted-foreground">
                {desc.tipo_descripcion || 'General'}
              </div>
              {portfolioId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditRecord(desc)}
                  title="Editar descripcion"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{desc.descripcion || '-'}</p>
          </div>
        ))}
      </div>

      {editRecord && (
        <EntityFormModal
          open={!!editRecord}
          onOpenChange={(open) => { if (!open) setEditRecord(null) }}
          mode="edit"
          entityName="descripciones"
          entityLabel="Descripción"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
