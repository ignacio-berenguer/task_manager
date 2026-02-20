/**
 * Route metadata for breadcrumb navigation.
 * Maps route patterns to their breadcrumb labels and parent routes.
 */
export const ROUTE_META = {
  '/dashboard':                         { label: 'Dashboard',            parent: null },
  '/search':                            { label: 'Busqueda',            parent: '/dashboard' },
  '/detail/:portfolio_id':              { label: ':portfolio_id',        parent: '/search',   dynamic: true },
  '/informes/hechos':                   { label: 'Hechos',              parent: '/dashboard' },
  '/informes/ltps':                     { label: 'LTPs',                parent: '/dashboard' },
  '/informes/acciones':                 { label: 'Acciones',            parent: '/dashboard' },
  '/informes/etiquetas':                { label: 'Etiquetas',           parent: '/dashboard' },
  '/informes/justificaciones':          { label: 'Justificaciones',     parent: '/dashboard' },
  '/informes/dependencias':             { label: 'Dependencias',        parent: '/dashboard' },
  '/informes/descripciones':            { label: 'Descripciones',       parent: '/dashboard' },
  '/informes/notas':                    { label: 'Notas',               parent: '/dashboard' },
  '/informes/documentos':               { label: 'Documentos',          parent: '/dashboard' },
  '/informes/transacciones':            { label: 'Transacciones',       parent: '/dashboard' },
  '/informes/transacciones-json':       { label: 'Transacciones JSON',  parent: '/dashboard' },
  '/register':                          { label: 'Registro',            parent: '/dashboard' },
  '/jobs':                              { label: 'Trabajos',            parent: '/dashboard' },
  '/parametricas':                      { label: 'Parametricas',        parent: '/dashboard' },
  '/parametricas/etiquetas-destacadas': { label: 'Etiquetas Destacadas', parent: '/parametricas' },
}

/**
 * Match a pathname against the ROUTE_META map.
 * Handles dynamic segments like :portfolio_id.
 * Returns { meta, params } or null if no match.
 */
function matchRoute(pathname) {
  // Try exact match first
  if (ROUTE_META[pathname]) {
    return { pattern: pathname, meta: ROUTE_META[pathname], params: {} }
  }
  // Try dynamic patterns
  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    if (!meta.dynamic) continue
    const patternParts = pattern.split('/')
    const pathParts = pathname.split('/')
    if (patternParts.length !== pathParts.length) continue
    const params = {}
    let match = true
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        match = false
        break
      }
    }
    if (match) return { pattern, meta, params }
  }
  return null
}

/**
 * Build a breadcrumb trail for a given pathname.
 * Returns array of { label, path } from root to current.
 *
 * @param {string} pathname - Current URL pathname
 * @param {object} [locationState] - React Router location.state (for contextual parent override)
 */
export function buildBreadcrumbs(pathname, locationState) {
  const matched = matchRoute(pathname)
  if (!matched) return []

  const crumbs = []
  let currentPattern = matched.pattern
  let currentMeta = matched.meta
  let currentParams = matched.params
  let usedFromState = false

  // Build trail from current to root
  while (currentPattern) {
    let label = currentMeta.label
    // Replace dynamic segments in label
    if (label.startsWith(':')) {
      const paramName = label.slice(1)
      label = currentParams[paramName] || label
    }

    crumbs.unshift({ label, path: currentPattern === matched.pattern ? pathname : currentPattern })

    // For the first dynamic page only, use location.state.from as parent if available
    if (!usedFromState && currentMeta.dynamic && locationState?.from?.route) {
      usedFromState = true
      const fromRoute = locationState.from.route
      const parentMatch = matchRoute(fromRoute)
      if (parentMatch && !parentMatch.meta.dynamic) {
        // Use from-state parent only if it's a static route (not another detail page)
        currentPattern = parentMatch.pattern
        currentMeta = parentMatch.meta
        currentParams = parentMatch.params
        continue
      }
      // If from-state is also a dynamic route (detail→detail), fall through to default parent
    }

    // Walk up the parent chain
    const parentPath = currentMeta.parent
    if (!parentPath) break
    const parentMatch = matchRoute(parentPath)
    if (!parentMatch) {
      // Parent is a simple static route
      if (ROUTE_META[parentPath]) {
        currentPattern = parentPath
        currentMeta = ROUTE_META[parentPath]
        currentParams = {}
      } else {
        break
      }
    } else {
      currentPattern = parentMatch.pattern
      currentMeta = parentMatch.meta
      currentParams = parentMatch.params
    }
  }

  return crumbs
}
