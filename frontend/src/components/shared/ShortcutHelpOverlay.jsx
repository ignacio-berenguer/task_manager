import { useEffect, useRef, useMemo } from 'react'
import { useShortcutContext } from '@/providers/KeyboardShortcutProvider'
import { X } from 'lucide-react'

const CATEGORY_ORDER = ['Global', 'Búsqueda', 'Búsqueda (resultados)', 'Detalle', 'Chat']

export function ShortcutHelpOverlay() {
  const { isOverlayOpen, closeOverlay, getShortcuts } = useShortcutContext()
  const overlayRef = useRef(null)

  const grouped = useMemo(() => {
    if (!isOverlayOpen) return {}
    const shortcuts = getShortcuts()
    const groups = {}
    for (const s of shortcuts) {
      const cat = s.category || 'Global'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(s)
    }
    return groups
  }, [isOverlayOpen, getShortcuts])

  // Close on Escape
  useEffect(() => {
    if (!isOverlayOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeOverlay()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOverlayOpen, closeOverlay])

  // Close on click outside
  useEffect(() => {
    if (!isOverlayOpen) return
    function handleClick(e) {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        closeOverlay()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOverlayOpen, closeOverlay])

  // Lock body scroll
  useEffect(() => {
    if (isOverlayOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOverlayOpen])

  if (!isOverlayOpen) return null

  const sortedCategories = CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div
        ref={overlayRef}
        className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl animate-in fade-in-0 zoom-in-[0.97] duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Atajos de teclado</h2>
          <button
            onClick={closeOverlay}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcut grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {sortedCategories.map(category => (
            <div key={category}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {grouped[category].map(shortcut => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground/80">{shortcut.description}</span>
                    <kbd className="inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Presiona <kbd className="mx-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px]">F1</kbd> para abrir/cerrar este panel
        </div>
      </div>
    </div>
  )
}
