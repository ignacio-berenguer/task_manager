import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { SimpleTable } from '../SimpleTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityFormModal } from '../EntityFormModal'

const COMPONENTES_COLUMNS = [
  { key: 'portfolio_id_componente', label: 'Portfolio ID', type: 'link', linkPrefix: '/detail/' },
  { key: 'nombre_componente', label: 'Nombre', type: 'text' },
  { key: 'tipo_agrupacion_componente', label: 'Tipo Agrupación', type: 'text' },
  { key: 'importe_2025_componente', label: 'Importe 2025', type: 'currency' },
]

const FORM_FIELDS = [
  { key: 'portfolio_id_grupo', label: 'Portfolio ID Grupo' },
  { key: 'portfolio_id_componente', label: 'Portfolio ID Componente' },
  { key: 'nombre_grupo', label: 'Nombre Grupo' },
  { key: 'tipo_agrupacion_grupo', label: 'Tipo Agrupacion Grupo', parametric: 'tipo_agrupacion' },
  { key: 'tipo_agrupacion_componente', label: 'Tipo Agrupacion Componente', parametric: 'tipo_agrupacion' },
]

export function GruposIniciativasSection({ data, portfolioId, onRefetch }) {
  const { portfolio_id: currentPid } = useParams()
  const [editRecord, setEditRecord] = useState(null)

  const asGrupo = data?.as_grupo || []
  const asComponente = data?.as_componente || []

  const hasGrupoData = asGrupo.length > 0
  const hasComponenteData = asComponente.length > 0

  if (!hasGrupoData && !hasComponenteData) {
    return <p className="text-sm text-muted-foreground py-2">This initiative is not part of any group</p>
  }

  return (
    <>
      <div className="space-y-6">
        {hasComponenteData && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">Member of Group</Badge>
            </h4>
            <div className="border rounded-lg p-4 bg-muted/20">
              {asComponente.map((grupo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <div className="text-xs text-muted-foreground">Portfolio ID Grupo</div>
                        <Link
                          to={`/detail/${grupo.portfolio_id_grupo}`}
                          state={{ from: { route: `/detail/${currentPid}`, label: currentPid } }}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {grupo.portfolio_id_grupo}
                        </Link>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">Nombre Grupo</div>
                        <div className="text-sm">{grupo.nombre_grupo || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tipo Agrupación</div>
                        <div className="text-sm">{grupo.tipo_agrupacion_grupo || '-'}</div>
                      </div>
                    </div>
                    {portfolioId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-2"
                        onClick={() => setEditRecord(grupo)}
                        title="Editar grupo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasGrupoData && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">Group Components</Badge>
              <span className="text-muted-foreground">({asGrupo.length})</span>
            </h4>
            <SimpleTable
              data={asGrupo}
              columns={COMPONENTES_COLUMNS}
              onRowEdit={portfolioId ? setEditRecord : undefined}
            />
          </div>
        )}
      </div>

      {editRecord && (
        <EntityFormModal
          open={!!editRecord}
          onOpenChange={(open) => { if (!open) setEditRecord(null) }}
          mode="edit"
          entityName="grupos_iniciativas"
          entityLabel="Grupo Iniciativa"
          portfolioId={portfolioId}
          record={editRecord}
          fields={FORM_FIELDS}
          onSuccess={onRefetch}
        />
      )}
    </>
  )
}
