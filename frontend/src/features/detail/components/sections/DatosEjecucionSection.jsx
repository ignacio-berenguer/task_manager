import { KeyValueDisplay } from '../KeyValueDisplay'
import { SimpleTable } from '../SimpleTable'

export const FIELDS = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'estado_de_la_iniciativa', label: 'Estado', type: 'text' },
  { key: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
  { key: 'fecha_uat', label: 'Fecha UAT', type: 'date' },
  { key: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
  { key: 'porcentaje_avance', label: '% Avance', type: 'number' },
  { key: 'porcentaje_facturacion', label: '% Facturación', type: 'number' },
  { key: 'importe_2025', label: 'Importe 2025', type: 'currency' },
  { key: 'importe_facturado_2025', label: 'Facturado 2025', type: 'currency' },
  { key: 'en_retraso', label: 'En Retraso', type: 'text' },
  { key: 'comentarios', label: 'Comentarios', type: 'text' },
]

export function DatosEjecucionSection({ data }) {
  // If array with multiple items, show as table
  if (Array.isArray(data) && data.length > 1) {
    const columns = FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
    }))
    return <SimpleTable data={data} columns={columns} />
  }

  // If single item, show as key-value
  const item = Array.isArray(data) ? data[0] : data
  if (!item) return null

  return <KeyValueDisplay data={item} fields={FIELDS} columns={3} />
}
