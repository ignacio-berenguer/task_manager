import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CurrencyCell } from '@/components/shared/CurrencyCell'
import { KeyValuePair } from '../KeyValueDisplay'

// Column definitions for the importes table
const IMPORTE_COLUMNS = [
  { key: 'budget', label: 'Budget' },
  { key: 'sm200', label: 'SM200' },
  { key: 'aprobado', label: 'Aprobado' },
  { key: 'citetic', label: 'CITETIC' },
  { key: 'facturacion', label: 'Facturación' },
  { key: 'importe', label: 'Importe' },
  { key: 'cc_re', label: 'CC RE' },
]

// Field mappings by year
const YEAR_FIELD_MAP = {
  2024: {
    budget: 'budget_2024',
    sm200: 'importe_sm200_24',
    aprobado: 'importe_aprobado_2024',
    citetic: 'importe_citetic_24',
    facturacion: 'importe_facturacion_2024',
    importe: 'importe_2024',
  },
  2025: {
    budget: 'budget_2025',
    sm200: 'importe_sm200_2025',
    aprobado: 'importe_aprobado_2025',
    facturacion: 'importe_facturacion_2025',
    importe: 'importe_2025',
    cc_re: 'importe_2025_cc_re',
  },
  2026: {
    budget: 'budget_2026',
    sm200: 'importe_sm200_2026',
    aprobado: 'importe_aprobado_2026',
    facturacion: 'importe_facturacion_2026',
    importe: 'importe_2026',
  },
  2027: {
    budget: 'budget_2027',
    sm200: 'importe_sm200_2027',
    aprobado: 'importe_aprobado_2027',
    facturacion: 'importe_facturacion_2027',
    importe: 'importe_2027',
  },
  2028: {
    importe: 'importe_2028',
  },
}

const YEARS = [2024, 2025, 2026, 2027, 2028]

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-'
  const numValue = Number(value)
  if (isNaN(numValue)) return value
  const kValue = numValue / 1000
  return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`
}

export function ImportesSection({ data }) {
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Importes Table */}
      <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-2 text-left font-medium text-muted-foreground">Año</th>
              {IMPORTE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-right font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map((year, index) => {
              const fieldMap = YEAR_FIELD_MAP[year]
              return (
                <tr
                  key={year}
                  className={cn(
                    'border-b',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  )}
                >
                  <td className="p-2 font-medium">{year}</td>
                  {IMPORTE_COLUMNS.map((col) => {
                    const fieldKey = fieldMap[col.key]
                    const value = fieldKey ? data[fieldKey] : null
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'p-2 text-right tabular-nums',
                          value && Number(value) !== 0 ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <CurrencyCell value={value} formattedValue={formatCurrency(value)} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </TooltipProvider>

      {/* Additional fields */}
      <div className="border rounded-lg p-3">
        <h4 className="font-medium text-sm mb-3">Otros</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KeyValuePair label="En Presupuesto del Año" value={data.en_presupuesto_del_ano} />
          <KeyValuePair label="Calidad Valoración" value={data.calidad_valoracion} />
          <KeyValuePair label="Siguiente Acción" value={data.siguiente_accion} />
          <KeyValuePair label="En 20.6 M€ 2026" value={data.esta_en_los_206_me_de_2026} />
          <KeyValuePair label="Cerrada Económicamente" value={data.iniciativa_cerrada_economicamente} />
          <KeyValuePair label="Diferencia Apr-Eje" value={data.diferencia_apr_eje_exc_ept} type="currency" />
        </div>
      </div>

      {/* Date fields */}
      <div className="border rounded-lg p-3">
        <h4 className="font-medium text-sm mb-3">Fechas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KeyValuePair label="Fecha SM100" value={data.fecha_sm100} type="date" />
          <KeyValuePair label="Fecha Aprobada CCT" value={data.fecha_aprobada_con_cct} type="date" />
          <KeyValuePair label="Fecha en Ejecución" value={data.fecha_en_ejecucion} type="date" />
          <KeyValuePair label="Fecha Límite" value={data.fecha_limite} type="date" />
        </div>
      </div>
    </div>
  )
}
