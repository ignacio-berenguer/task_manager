import { SimpleTable } from '../SimpleTable'

export const COLUMNS = [
  { key: 'grupo', label: 'Grupo', type: 'text' },
  { key: 'concepto', label: 'Concepto', type: 'longtext' },
  { key: 'periodo', label: 'Periodo', type: 'text' },
  { key: 'importe', label: 'Importe', type: 'currency' },
  { key: 'valor', label: 'Valor', type: 'text' },
  { key: 'texto', label: 'Texto', type: 'longtext' },
]

export function BeneficiosSection({ data }) {
  // Sort by grupo, then concepto
  const sortedData = [...(data || [])].sort((a, b) => {
    const grupoCompare = (a.grupo || '').localeCompare(b.grupo || '')
    if (grupoCompare !== 0) return grupoCompare
    return (a.concepto || '').localeCompare(b.concepto || '')
  })

  return <SimpleTable data={sortedData} columns={COLUMNS} />
}
