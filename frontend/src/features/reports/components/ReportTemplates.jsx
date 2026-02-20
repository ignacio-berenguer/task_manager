import { useState } from 'react'
import { Save, X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Report template save/load/delete controls
 */
export function ReportTemplates({ templates, onSave, onLoad, onDelete }) {
  const [isSaving, setIsSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const handleSave = () => {
    const name = templateName.trim()
    if (!name) return
    onSave(name)
    setTemplateName('')
    setIsSaving(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsSaving(false)
      setTemplateName('')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Template dropdown */}
      {templates.length > 0 && (
        <div className="relative group">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Plantillas ({templates.length})
          </Button>
          <div className="absolute left-0 top-full z-50 hidden group-hover:block pt-1">
          <div className="min-w-[200px] max-w-[300px] rounded-md border bg-popover p-1 shadow-md">
            {templates.map((tmpl, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-1 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <button
                  type="button"
                  className="flex-1 text-left truncate"
                  onClick={() => onLoad(idx)}
                  title={tmpl.name}
                >
                  {tmpl.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(idx)
                  }}
                  className="shrink-0 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Save button / inline input */}
      {isSaving ? (
        <div className="flex items-center gap-1.5">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre de plantilla..."
            className="h-8 w-48 text-sm"
            autoFocus
          />
          <Button size="sm" variant="default" onClick={handleSave} disabled={!templateName.trim()}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsSaving(false); setTemplateName('') }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setIsSaving(true)} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Guardar plantilla
        </Button>
      )}
    </div>
  )
}
