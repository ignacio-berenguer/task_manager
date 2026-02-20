import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toSharePointOnlineUrl } from '@/lib/sharepoint'

/**
 * Convert a snake_case key to Title Case.
 * "titulo_documento" -> "Titulo Documento"
 */
function snakeCaseToTitle(key) {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function SummaryContent({ jsonString }) {
  const sections = useMemo(() => {
    if (!jsonString) return null
    try {
      const data = JSON.parse(jsonString)
      if (typeof data !== 'object' || data === null) return null
      return Object.entries(data)
    } catch {
      return null
    }
  }, [jsonString])

  if (!jsonString) {
    return <p className="text-sm text-muted-foreground py-4">Sin resumen disponible</p>
  }

  if (!sections) {
    // Parse failed — show raw text
    return (
      <pre className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-4 max-h-[70vh] overflow-auto">
        {jsonString}
      </pre>
    )
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
      {sections.map(([key, value]) => {
        // Skip null, empty string, empty array
        if (value === null || value === undefined) return null
        if (typeof value === 'string' && value.trim() === '') return null
        if (Array.isArray(value) && value.length === 0) return null

        return (
          <div key={key} className="border-b border-border/30 pb-3 last:border-b-0">
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              {snakeCaseToTitle(key)}
            </h3>
            {typeof value === 'string' ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {value}
              </p>
            ) : Array.isArray(value) ? (
              <ul className="list-disc list-inside space-y-0.5">
                {value.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {String(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{JSON.stringify(value)}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SummaryViewerModal({ open, onOpenChange, title, jsonString, sharePointUrl }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title || 'Visor de Resumen'}</DialogTitle>
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

        <SummaryContent jsonString={jsonString} />
      </DialogContent>
    </Dialog>
  )
}
