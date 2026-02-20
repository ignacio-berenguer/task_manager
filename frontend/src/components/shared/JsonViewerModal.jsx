import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toSharePointOnlineUrl } from '@/lib/sharepoint'

/**
 * Syntax-highlight a JSON string by wrapping tokens in colored spans.
 * Returns an array of React elements.
 */
function syntaxHighlight(jsonStr) {
  // Regex matches JSON tokens: strings, numbers, booleans, null, structural chars
  const tokenRegex = /("(?:\\.|[^"\\])*")\s*:/g
  const valueRegex = /("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

  // First pass: mark keys vs string values
  const keyPositions = new Set()
  let m
  while ((m = tokenRegex.exec(jsonStr)) !== null) {
    keyPositions.add(m.index)
  }

  const parts = []
  let lastIndex = 0

  // Unified regex for all tokens
  const allTokens = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

  while ((m = allTokens.exec(jsonStr)) !== null) {
    // Add structural chars before this token
    if (m.index > lastIndex) {
      const structural = jsonStr.slice(lastIndex, m.index)
      parts.push(
        <span key={`s-${lastIndex}`} className="text-gray-400">
          {structural}
        </span>
      )
    }

    if (m[1]) {
      // Key (followed by colon)
      parts.push(
        <span key={`k-${m.index}`} className="text-cyan-400">
          {m[1]}
        </span>
      )
    } else if (m[2]) {
      // String value
      parts.push(
        <span key={`v-${m.index}`} className="text-green-400">
          {m[2]}
        </span>
      )
    } else if (m[3]) {
      // Boolean or null
      parts.push(
        <span key={`b-${m.index}`} className="text-purple-400">
          {m[3]}
        </span>
      )
    } else if (m[4]) {
      // Number
      parts.push(
        <span key={`n-${m.index}`} className="text-yellow-400">
          {m[4]}
        </span>
      )
    }

    lastIndex = m.index + m[0].length
  }

  // Trailing structural chars
  if (lastIndex < jsonStr.length) {
    parts.push(
      <span key={`s-${lastIndex}`} className="text-gray-400">
        {jsonStr.slice(lastIndex)}
      </span>
    )
  }

  return parts
}

export function JsonViewerModal({ open, onOpenChange, title, jsonString, sharePointUrl }) {
  const highlighted = useMemo(() => {
    if (!jsonString) return null
    try {
      const parsed = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsed, null, 2)
      return syntaxHighlight(formatted)
    } catch {
      return null
    }
  }, [jsonString])

  const rawFallback = jsonString && !highlighted

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title || 'Visor JSON'}</DialogTitle>
        </DialogHeader>

        {sharePointUrl && (
          <a
            href={toSharePointOnlineUrl(sharePointUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir documento en SharePoint
          </a>
        )}

        {!jsonString ? (
          <p className="text-sm text-muted-foreground py-4">Sin resumen disponible</p>
        ) : (
          <pre className="font-mono text-sm bg-gray-900 text-gray-100 rounded-md p-4 max-h-[70vh] overflow-auto whitespace-pre-wrap">
            {highlighted || jsonString}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  )
}
