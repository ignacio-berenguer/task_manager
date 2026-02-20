import { SimpleTable } from '../SimpleTable'

export const COLUMNS = [
  { key: 'ano', label: 'Año', type: 'number' },
  { key: 'mes', label: 'Mes', type: 'text' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'concepto_factura', label: 'Concepto', type: 'text' },
  { key: 'descripcion', label: 'Descripción', type: 'text' },
]

export function FacturacionSection({ data }) {
  // Sort by ano desc, then mes desc
  const sortedData = [...(data || [])].sort((a, b) => {
    const yearCompare = (b.ano || 0) - (a.ano || 0)
    if (yearCompare !== 0) return yearCompare
    return (b.mes || '').localeCompare(a.mes || '')
  })

  return <SimpleTable data={sortedData} columns={COLUMNS} />
}
