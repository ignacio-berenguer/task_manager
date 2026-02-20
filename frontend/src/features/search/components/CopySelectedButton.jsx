import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopySelectedButton({ selectedIds }) {
  const [copied, setCopied] = useState(false)
  const count = selectedIds.length

  if (count === 0) return null

  const handleCopy = async () => {
    const text = selectedIds.join(', ')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(
        `${count} Portfolio ID${count > 1 ? 's' : ''} copiado${count > 1 ? 's' : ''} al portapapeles`
      )
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      Copiar {count} ID{count > 1 ? 's' : ''}
    </Button>
  )
}
