import { useMemo } from 'react'
import { SidebarNav } from '@/components/shared/SidebarNav'

const SECTIONS = [
  { label: 'Datos Desc.', anchor: 'datos-descriptivos', key: 'datos_descriptivos', type: 'single' },
  { label: 'Hechos', anchor: 'hechos', key: 'hechos', type: 'multi' },
  { label: 'Info. Económica', anchor: 'informacion-economica', key: 'informacion_economica', type: 'single' },
  { label: 'Importes', anchor: 'importes', key: 'datos_relevantes', type: 'single' },
  { label: 'Etiquetas', anchor: 'etiquetas', key: 'etiquetas', type: 'multi' },
  { label: 'Acciones', anchor: 'acciones', key: 'acciones', type: 'multi' },
  { label: 'Notas', anchor: 'notas', key: 'notas', type: 'multi' },
  { label: 'Justificaciones', anchor: 'justificaciones', key: 'justificaciones', type: 'multi' },
  { label: 'Descripciones', anchor: 'descripciones', key: 'descripciones', type: 'multi' },
  { label: 'Beneficios', anchor: 'beneficios', key: 'beneficios', type: 'multi' },
  { label: 'LTP', anchor: 'ltp', key: 'ltp', type: 'multi' },
  { label: 'Facturación', anchor: 'facturacion', key: 'facturacion', type: 'multi' },
  { label: 'Datos Ejecución', anchor: 'datos-ejecucion', key: 'datos_ejecucion', type: 'multi' },
  { label: 'Grupos', anchor: 'grupos-iniciativas', key: 'grupos_iniciativas', type: 'multi' },
  { label: 'Estado Especial', anchor: 'estado-especial', key: 'estado_especial', type: 'single' },
  { label: 'Impacto AATT', anchor: 'impacto-aatt', key: 'impacto_aatt', type: 'single' },
  { label: 'WBEs', anchor: 'wbes', key: 'wbes', type: 'multi' },
  { label: 'Dependencias', anchor: 'dependencias', key: 'dependencias', type: 'multi' },
  { label: 'Documentos', anchor: 'documentos', key: 'documentos', type: 'multi' },
  { label: 'Relacionadas', anchor: 'related-initiatives', key: '_related', type: 'multi' },
  { label: 'Actividad', anchor: 'activity-timeline', key: '_timeline', type: 'multi' },
  { label: 'Transacciones', anchor: 'transacciones', key: 'transacciones', type: 'multi' },
  { label: 'Trans. JSON', anchor: 'transacciones-json', key: 'transacciones_json', type: 'multi' },
]

function getCount(value) {
  if (!value) return 0
  if (Array.isArray(value)) return value.length
  return 1
}

export function DetailNav({ data, transaccionesJsonCount, relatedCount, timelineCount, sectionHasData, onActiveSectionChange }) {
  const items = useMemo(() => {
    if (!data) return SECTIONS.map(({ label, anchor }) => ({ label, anchor }))

    // Filter to only sections that have data
    const visibleSections = sectionHasData
      ? SECTIONS.filter(({ anchor }) => sectionHasData[anchor] !== false)
      : SECTIONS

    // External counts for independently-fetched sections
    const externalCounts = {
      transacciones_json: transaccionesJsonCount,
      _related: relatedCount,
      _timeline: timelineCount,
    }

    const result = visibleSections.map(({ label, anchor, key, type }) => {
      // Use externally-provided count for sections fetched separately
      const count = externalCounts[key] != null
        ? externalCounts[key]
        : getCount(data[key])
      let badge
      if (type === 'single') {
        badge = count > 0 ? 'exists' : undefined
      } else {
        badge = count > 0 ? count : undefined
      }
      return { label, anchor, badge }
    })

    // Add "Sin datos" link if there are empty sections
    if (sectionHasData) {
      const hasEmpty = SECTIONS.some(({ anchor }) => !sectionHasData[anchor])
      if (hasEmpty) {
        result.push({ label: 'Sin datos', anchor: 'secciones-sin-datos' })
      }
    }

    return result
  }, [data, transaccionesJsonCount, relatedCount, timelineCount, sectionHasData])

  return <SidebarNav items={items} onActiveSectionChange={onActiveSectionChange} />
}
