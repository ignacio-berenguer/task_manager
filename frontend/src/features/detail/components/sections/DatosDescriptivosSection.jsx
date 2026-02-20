import { KeyValueDisplay } from '../KeyValueDisplay'

const FIELDS = [
  { key: 'portfolio_id', label: 'Portfolio ID', type: 'text' },
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'unidad', label: 'Unidad', type: 'text' },
  { key: 'origen', label: 'Origen', type: 'text' },
  { key: 'digital_framework_level_1', label: 'Digital Framework', type: 'text' },
  { key: 'prioridad_descriptiva_bi', label: 'Prioridad BI', type: 'text' },
  { key: 'priorizacion', label: 'Priorización', type: 'text' },
  { key: 'tipo_proyecto', label: 'Tipo Proyecto', type: 'text' },
  { key: 'cluster', label: 'Cluster 2025', type: 'text' },
  { key: 'tipo_agrupacion', label: 'Tipo Agrupación', type: 'text' },
  { key: 'estado_de_la_iniciativa', label: 'Estado Iniciativa', type: 'estado' },
  { key: 'estado_sm100', label: 'Estado SM100', type: 'text' },
  { key: 'estado_sm200', label: 'Estado SM200', type: 'text' },
  { key: 'iniciativa_aprobada', label: 'Iniciativa Aprobada', type: 'text' },
  { key: 'referente_bi', label: 'Referente BI', type: 'text' },
  { key: 'referente_b_unit', label: 'Referente B-Unit', type: 'text' },
  { key: 'referente_enabler_ict', label: 'Referente ICT', type: 'text' },
  { key: 'it_partner', label: 'IT Partner', type: 'text' },
  { key: 'codigo_jira', label: 'Código Jira', type: 'text' },
  { key: 'justificacion_regulatoria', label: 'Justificación Regulatoria', type: 'text' },
  { key: 'falta_justificacion_regulatoria', label: 'Falta Justificación', type: 'boolean' },
  { key: 'activo_ejercicio_actual', label: 'Activo Ejercicio Actual', type: 'text', source: 'datosRelevantes' },
]

export function DatosDescriptivosSection({ data, datosRelevantes }) {
  if (!data) return null

  // Merge datos_descriptivos with datos_relevantes fields
  const mergedData = { ...data }
  if (datosRelevantes) {
    FIELDS.forEach((f) => {
      if (f.source === 'datosRelevantes' && datosRelevantes[f.key] !== undefined) {
        mergedData[f.key] = datosRelevantes[f.key]
      }
    })
  }

  return <KeyValueDisplay data={mergedData} fields={FIELDS} columns={3} />
}
