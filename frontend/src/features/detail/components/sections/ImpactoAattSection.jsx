import { KeyValueDisplay } from '../KeyValueDisplay'

const FIELDS = [
  { key: 'tiene_impacto_en_aatt', label: 'Tiene Impacto en AATT', type: 'text' },
  { key: 'afecta_a_ut_red_mt_bt', label: 'Afecta UT Red MT/BT', type: 'text' },
  { key: 'afecta_om_cc', label: 'Afecta OM CC', type: 'text' },
  { key: 'afecta_pm', label: 'Afecta PM', type: 'text' },
  { key: 'afecta_hseq', label: 'Afecta HSEQ', type: 'text' },
  { key: 'afecta_inspecciones', label: 'Afecta Inspecciones', type: 'text' },
  { key: 'afecta_at', label: 'Afecta AT', type: 'text' },
  { key: 'comentarios', label: 'Comentarios', type: 'text' },
]

export function ImpactoAattSection({ data }) {
  if (!data) return null

  return <KeyValueDisplay data={data} fields={FIELDS} columns={2} />
}
