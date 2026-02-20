import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Normalize text for accent-insensitive matching
 */
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Reusable sticky sidebar navigation with IntersectionObserver.
 * Only visible on xl screens.
 *
 * @param {{ items: Array<{label: string, anchor: string, badge?: number|'exists'}>, onActiveSectionChange?: (sectionId: string|null) => void }} props
 *   badge: number shows count, 'exists' shows a dot indicator, undefined/0 shows nothing
 *   onActiveSectionChange: called when the active section changes (via scroll or click)
 */
export function SidebarNav({ items, onActiveSectionChange }) {
  const [activeId, setActiveId] = useState(items[0]?.anchor)
  const [searchText, setSearchText] = useState('')
  const observerRef = useRef(null)
  const onChangeRef = useRef(onActiveSectionChange)
  onChangeRef.current = onActiveSectionChange

  // Reset search when items change (e.g., navigating to a different initiative)
  const itemsKey = items.map((i) => i.anchor).join(',')
  useEffect(() => {
    setSearchText('')
  }, [itemsKey])

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items
    const query = normalize(searchText.trim())
    return items.filter((item) => normalize(item.label).includes(query))
  }, [items, searchText])

  useEffect(() => {
    const visibleSections = new Map()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleSections.set(entry.target.id, entry.intersectionRatio)
        })

        // Pick the section with the highest visibility ratio
        let maxRatio = 0
        let maxId = null
        visibleSections.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxRatio = ratio
            maxId = id
          }
        })

        if (maxId) {
          setActiveId(maxId)
          onChangeRef.current?.(maxId)
        }
      },
      {
        rootMargin: '-140px 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    items.forEach(({ anchor }) => {
      const el = document.getElementById(anchor)
      if (el) observerRef.current.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [items])

  const handleClick = (e, anchor) => {
    e.preventDefault()
    const el = document.getElementById(anchor)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(anchor)
      onChangeRef.current?.(anchor)
    }
  }

  return (
    <nav className="hidden xl:block sticky top-44 h-fit w-44 shrink-0">
      <div className="border-l border-border bg-muted/20 rounded-lg py-2">
        {/* Search input */}
        <div className="px-2 mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar..."
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 pl-6 pr-6 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Section links */}
        <ul className="space-y-1">
          {filteredItems.length === 0 && searchText.trim() ? (
            <li className="px-3 py-1.5 text-xs text-muted-foreground italic">
              Sin coincidencias
            </li>
          ) : (
            filteredItems.map(({ label, anchor, badge }) => (
              <li key={anchor}>
                <a
                  href={`#${anchor}`}
                  onClick={(e) => handleClick(e, anchor)}
                  className={`flex items-center justify-between py-1.5 pl-3 pr-2 text-xs font-heading font-semibold uppercase tracking-wider transition-colors ${
                    activeId === anchor
                      ? 'border-l-2 border-l-primary -ml-px text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{label}</span>
                  {badge === 'exists' && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  {typeof badge === 'number' && badge > 0 && (
                    <span className="text-[10px] leading-none bg-muted rounded-full px-1.5 py-0.5 font-mono tabular-nums">
                      {badge}
                    </span>
                  )}
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </nav>
  )
}
