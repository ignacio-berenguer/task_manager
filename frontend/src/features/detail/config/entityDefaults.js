/**
 * Centralized default values for entity CUD operations.
 *
 * Static values are stored as strings/numbers.
 * Dynamic values (e.g. current date) are stored as functions that return the value.
 *
 * To resolve defaults for a given entity:
 *   import { resolveDefaults } from './entityDefaults'
 *   const defaults = resolveDefaults('datos_descriptivos')
 */

export const ENTITY_DEFAULTS = {
  datos_descriptivos: {
    origen: 'Nuevo 26',
    prioridad_descriptiva_bi: 'SIN DEFINIR',
    priorizacion: '96 PENDIENTE PRIORIZAR',
    tipo_proyecto: 'DEV',
    referente_bi: 'SIN IDENTIFICAR',
    referente_b_unit: 'SIN IDENTIFICAR',
    it_partner: 'SIN IDENTIFICAR',
    tipo_agrupacion: 'Iniciativa Individual',
  },
  informacion_economica: {
    cini: 'PENDIENTE DEFINIR',
    capex_opex: 'PENDIENTE DEFINIR',
    cluster: 'PENDIENTE DEFINIR',
    finalidad_budget: 'PENDIENTE DEFINIR',
    proyecto_especial: 'PENDIENTE DEFINIR',
    clasificacion: 'PENDIENTE DEFINIR',
    tlc: 'PENDIENTE DEFINIR',
    tipo_inversion: 'PENDIENTE DEFINIR',
  },
  justificaciones: {
    fecha_modificacion: () => new Date().toISOString().slice(0, 19),
  },
  wbes: {
    anio: () => new Date().getFullYear(),
  },
  hechos: {
    fecha: () => new Date().toISOString().slice(0, 10),
  },
  estado_especial: {
    fecha_modificacion: () => new Date().toISOString().slice(0, 10),
  },
  ltp: {
    estado: 'Pendiente',
  },
}

/**
 * Resolve defaults for a given entity, calling any function values.
 * @param {string} entityName
 * @returns {object} resolved default values
 */
export function resolveDefaults(entityName) {
  const raw = ENTITY_DEFAULTS[entityName] || {}
  const resolved = {}
  for (const [key, value] of Object.entries(raw)) {
    resolved[key] = typeof value === 'function' ? value() : value
  }
  return resolved
}
