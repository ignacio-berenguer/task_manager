import { useState, useMemo } from 'react'
import { ScrollText, Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import { CHANGELOG } from '@/lib/changelog'
import { VERSION_STRING } from '@/lib/version'

/**
 * Group changelog entries into ranges of 10 (e.g., 50-59, 40-49, etc.).
 * Returns groups sorted newest-first.
 */
function buildGroups(entries) {
  const groupMap = {}
  for (const entry of entries) {
    const decade = Math.floor(entry.feature / 10) * 10
    if (!groupMap[decade]) {
      groupMap[decade] = { start: decade, end: decade + 9, entries: [] }
    }
    groupMap[decade].entries.push(entry)
  }
  // Sort groups by start descending (newest first)
  return Object.values(groupMap).sort((a, b) => b.start - a.start)
}

/**
 * Format a group range label (e.g., "v1.000 – 1.009")
 */
function groupLabel(group) {
  const major = group.entries.length > 0
    ? group.entries[0].version.split('.')[0]
    : '1'
  const start = `${major}.${String(group.start).padStart(3, '0')}`
  const end = `${major}.${String(group.end).padStart(3, '0')}`
  return `v${start} – ${end}`
}

/**
 * Changelog section with search filter and collapsible version groups.
 */
export function ChangelogSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(null) // null = default behavior

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return CHANGELOG
    const q = searchQuery.toLowerCase()
    return CHANGELOG.filter(
      (e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const groups = useMemo(() => buildGroups(filteredEntries), [filteredEntries])

  // Determine which groups are expanded
  const isSearchActive = searchQuery.trim().length > 0

  function isGroupExpanded(group) {
    if (isSearchActive) return true // All groups expanded during search
    if (expandedGroups !== null) return expandedGroups.has(group.start)
    // Default: only the first (newest) group is expanded
    return groups.length > 0 && group.start === groups[0].start
  }

  function toggleGroup(group) {
    setExpandedGroups((prev) => {
      const next = new Set(prev ?? (groups.length > 0 ? [groups[0].start] : []))
      if (next.has(group.start)) {
        next.delete(group.start)
      } else {
        next.add(group.start)
      }
      return next
    })
  }

  return (
    <section className="bg-muted/50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-body">
            <ScrollText className="h-4 w-4 text-primary" />
            Change Log
          </div>
          <h2 className="text-2xl font-bold font-heading tracking-tighter sm:text-3xl">
            Historial de Versiones
          </h2>
          <p className="mt-3 text-lg font-body text-muted-foreground">
            Version actual:{' '}
            <span className="font-data font-semibold text-primary">v{VERSION_STRING}</span>
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el historial..."
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {filteredEntries.length} de {CHANGELOG.length} versiones
          </span>
        </div>

        {/* Grouped changelog entries */}
        <div className="space-y-2">
          {groups.map((group) => {
            const expanded = isGroupExpanded(group)

            return (
              <div key={group.start} className="rounded-lg border bg-background">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-heading text-sm font-semibold">
                    {groupLabel(group)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {group.entries.length} {group.entries.length === 1 ? 'version' : 'versiones'}
                  </span>
                </button>

                {/* Group entries */}
                {expanded && (
                  <div className="relative px-4 pb-4 space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[39px] top-0 bottom-4 w-px bg-border sm:left-[43px]" />

                    {group.entries.map((entry) => (
                      <div key={entry.feature} className="relative flex gap-4 py-4 sm:gap-6">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 rounded-full bg-primary ring-4 ring-background sm:h-4 sm:w-4" />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-data text-xs font-medium text-primary">
                              v{entry.version}
                            </span>
                            <h3 className="font-heading text-sm font-semibold sm:text-base">
                              {entry.title}
                            </h3>
                          </div>
                          <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                            {entry.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {filteredEntries.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron versiones que coincidan con la busqueda.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
