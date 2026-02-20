import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotaFormModal } from '../NotaFormModal'

function formatDate(value) {
  if (!value) return '-'
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}

export function NotasSection({ data, portfolioId, onRefetch }) {
  const [editNota, setEditNota] = useState(null)

  const hasData = data && data.length > 0

  // Sort by fecha descending
  const sortedData = hasData
    ? [...data].sort((a, b) => {
        if (!a.fecha) return 1
        if (!b.fecha) return -1
        return b.fecha.localeCompare(a.fecha)
      })
    : []

  return (
    <>
      {!hasData ? (
        <p className="text-sm text-muted-foreground py-2">Sin notas disponibles</p>
      ) : (
        <div className="space-y-3">
          {sortedData.map((nota, index) => (
            <div
              key={nota.id || index}
              className={cn(
                'border rounded-lg p-3',
                index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(nota.fecha)}</span>
                  {nota.registrado_por && <span>by {nota.registrado_por}</span>}
                </div>
                {portfolioId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditNota(nota)}
                    title="Editar nota"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{nota.nota || '-'}</p>
            </div>
          ))}
        </div>
      )}

      {editNota && (
        <NotaFormModal
          open={!!editNota}
          onOpenChange={(open) => { if (!open) setEditNota(null) }}
          mode="edit"
          portfolioId={portfolioId}
          nota={editNota}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
