import { KeyValueDisplay } from '../KeyValueDisplay'

const FIELDS = [
  { key: 'cini', label: 'CINI', type: 'text' },
  { key: 'capex_opex', label: 'CAPEX/OPEX', type: 'text' },
  { key: 'wbe', label: 'WBE', type: 'text' },
  { key: 'cluster', label: 'Cluster', type: 'text' },
  { key: 'finalidad_budget', label: 'Finalidad Budget', type: 'text' },
  { key: 'proyecto_especial', label: 'Proyecto Especial', type: 'text' },
  { key: 'clasificacion', label: 'Clasificación', type: 'text' },
  { key: 'tlc', label: 'TLC', type: 'text' },
  { key: 'tipo_inversion', label: 'Tipo Inversión', type: 'text' },
  { key: 'budget_2026', label: 'Budget 2026', type: 'currency' },
  { key: 'importe_2025', label: 'Importe 2025', type: 'currency' },
  { key: 'importe_2026', label: 'Importe 2026', type: 'currency' },
  { key: 'fecha_prevista_pes', label: 'Fecha Prevista PES', type: 'date' },
  { key: 'observaciones', label: 'Observaciones', type: 'text' },
]

export function InformacionEconomicaSection({ data }) {
  if (!data) return null

  return <KeyValueDisplay data={data} fields={FIELDS} columns={3} />
}
