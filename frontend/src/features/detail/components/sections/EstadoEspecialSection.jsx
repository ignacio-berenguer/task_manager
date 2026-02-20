import { KeyValueDisplay } from '../KeyValueDisplay'

const FIELDS = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'estado_especial', label: 'Estado Especial', type: 'text' },
  { key: 'fecha_modificacion', label: 'Fecha Modificación', type: 'date' },
  { key: 'comentarios', label: 'Comentarios', type: 'text' },
]

export function EstadoEspecialSection({ data }) {
  if (!data) return null

  return <KeyValueDisplay data={data} fields={FIELDS} columns={2} />
}
