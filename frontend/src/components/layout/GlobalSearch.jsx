import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import apiClient from '@/api/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('GlobalSearch')

/**
 * Global search overlay for quickly finding initiatives by portfolio_id or nombre.
 * Activated by clicking the search icon or pressing Ctrl+Shift+F.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const overlayRef = useRef(null)

  // Global keyboard shortcut: Ctrl+Shift+F
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Allow external open via custom event (used by mobile menu)
  useEffect(() => {
    function handleOpenEvent() {
      setIsOpen(true)
    }
    document.addEventListener('open-global-search', handleOpenEvent)
    return () => document.removeEventListener('open-global-search', handleOpenEvent)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e) {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Debounced search
  const executeSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [byId, byName] = await Promise.all([
        apiClient.post('/datos-relevantes/search', {
          filters: [{ field: 'portfolio_id', operator: 'ilike', value: `%${searchQuery}%` }],
          limit: 10,
          offset: 0,
        }),
        apiClient.post('/datos-relevantes/search', {
          filters: [{ field: 'nombre', operator: 'ilike', value: `%${searchQuery}%` }],
          limit: 10,
          offset: 0,
        }),
      ])

      // Track which portfolio_ids matched by ID search
      const idMatchSet = new Set((byId.data?.data || []).map((item) => item.portfolio_id))

      // Merge and deduplicate, tagging match source
      const seen = new Set()
      const merged = []
      for (const item of [...(byId.data?.data || []), ...(byName.data?.data || [])]) {
        if (!seen.has(item.portfolio_id)) {
          seen.add(item.portfolio_id)
          merged.push({ ...item, _matchedById: idMatchSet.has(item.portfolio_id) })
        }
      }
      setResults(merged.slice(0, 15))
      setSelectedIndex(0)
      logger.info(`Global search: "${searchQuery}" → ${merged.length} results`)
    } catch (err) {
      logger.error('Global search failed', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => executeSearch(val), 300)
  }

  function selectResult(portfolioId) {
    setIsOpen(false)
    navigate(`/detail/${portfolioId}`, { state: { from: { route: location.pathname, label: 'Busqueda Global' } } })
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      selectResult(results[selectedIndex].portfolio_id)
    }
  }

  if (!isOpen) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Buscar iniciativa (Ctrl+Shift+F)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm">
      <div
        ref={overlayRef}
        className="w-full max-w-lg bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por Portfolio ID (parcial) o Nombre..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[300px] overflow-y-auto py-1">
            {results.map((item, index) => (
              <li
                key={item.portfolio_id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => selectResult(item.portfolio_id)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="font-mono text-xs text-muted-foreground shrink-0 w-28">
                  {item.portfolio_id}
                </span>
                {item._matchedById && (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    ID
                  </span>
                )}
                <span className="truncate font-medium">
                  {item.nombre || '-'}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No se encontraron iniciativas.
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Escriba al menos 2 caracteres para buscar.
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-muted-foreground">
          <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">↑↓</kbd> navegar</span>
          <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Enter</kbd> seleccionar</span>
          <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
