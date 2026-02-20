import { useState } from 'react'
import { List, Search, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Normalize text for accent-insensitive matching.
 */
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Floating Action Button + Bottom Sheet for section navigation on mobile/tablet.
 * Hidden on xl+ screens where the sidebar is visible.
 *
 * @param {{ items: Array<{label: string, anchor: string, badge?: number|'exists'}>, activeSection: string|null, onSectionClick: (anchor: string) => void }} props
 */
export function MobileDetailNav({ items = [], activeSection, onSectionClick }) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const filteredItems = searchText.trim()
    ? items.filter((item) => normalize(item.label).includes(normalize(searchText.trim())))
    : items

  const handleSectionClick = (anchor) => {
    setOpen(false)
    setSearchText('')
    onSectionClick?.(anchor)

    // Scroll to section
    setTimeout(() => {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${anchor}`)
      }
    }, 150)
  }

  return (
    <>
      {/* FAB - hidden on xl where sidebar is visible */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg xl:hidden"
        onClick={() => setOpen(true)}
        aria-label="Navegar secciones"
      >
        <List className="h-5 w-5" />
      </Button>

      {/* Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          onClose={() => setOpen(false)}
          className="h-[70vh] w-full max-w-full rounded-t-xl border-t inset-x-0 bottom-0 top-auto"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>Secciones</SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="px-6 mb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar seccion..."
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Section list */}
          <div className="px-4 pb-6 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.anchor}
                type="button"
                onClick={() => handleSectionClick(item.anchor)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors',
                  activeSection === item.anchor
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.badge != null && item.badge !== 0 && (
                  item.badge === 'exists'
                    ? <span className="ml-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    : <span className="ml-2 min-w-[1.5rem] rounded-full bg-muted px-1.5 py-0.5 text-center text-xs font-mono text-muted-foreground shrink-0">{item.badge}</span>
                )}
              </button>
            ))}

            {filteredItems.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No se encontraron secciones
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
