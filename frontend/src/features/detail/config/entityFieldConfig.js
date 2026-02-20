/**
 * Centralized field configuration for entity CUD operations.
 *
 * LONG_TEXT_FIELDS: fields rendered as <textarea> instead of <Input>
 * MONETARY_FIELDS: fields rendered with CurrencyInput (2-decimal euro mask)
 * SELECT_OPTIONS: fields rendered as <select> with predefined options
 * READ_ONLY_FIELDS: fields displayed but not editable
 * AUTO_DATE_FIELDS: fields auto-set to current date on insert/update (included in cambios but not shown as editable)
 */

/** Fields rendered as multi-line textarea */
export const LONG_TEXT_FIELDS = {
  datos_descriptivos: [],
  informacion_economica: ['observaciones'],
  justificaciones: ['valor'],
  descripciones: ['descripcion', 'comentarios'],
  etiquetas: ['comentarios'],
  grupos_iniciativas: [],
  wbes: [],
  dependencias: ['descripcion_dependencia', 'comentarios'],
  ltp: ['tarea', 'siguiente_accion', 'comentarios'],
  hechos: ['notas', 'racional'],
  acciones: ['siguiente_accion_comentarios'],
  estado_especial: ['comentarios'],
  impacto_aatt: ['comentarios'],
}

/** Fields rendered with CurrencyInput (euro, 2 decimals) */
export const MONETARY_FIELDS = {
  hechos: ['importe', 'importe_ri', 'importe_re'],
}

/** Fields rendered as <select> with predefined options (fallback for non-parametric fields) */
export const SELECT_OPTIONS = {
  // capex_opex moved to parametric tables (Feature 037)
}

/**
 * Fields auto-set to current date/datetime on insert and update.
 * These are included in the cambios payload automatically but shown as read-only.
 * Format: { entityName: { fieldName: 'date' | 'datetime' } }
 */
export const AUTO_DATE_FIELDS = {
  etiquetas: { fecha_modificacion: 'date' },
  estado_especial: { fecha_modificacion: 'date' },
}

/**
 * Check if a field is a long-text field for a given entity.
 */
export function isLongTextField(entityName, fieldKey) {
  return (LONG_TEXT_FIELDS[entityName] || []).includes(fieldKey)
}

/**
 * Check if a field is a monetary field for a given entity.
 */
export function isMonetaryField(entityName, fieldKey) {
  return (MONETARY_FIELDS[entityName] || []).includes(fieldKey)
}

/**
 * Get select options for a field, or null if not a select field.
 */
export function getSelectOptions(entityName, fieldKey) {
  return SELECT_OPTIONS[entityName]?.[fieldKey] || null
}

/**
 * Get auto-date fields for an entity.
 */
export function getAutoDateFields(entityName) {
  return AUTO_DATE_FIELDS[entityName] || {}
}
