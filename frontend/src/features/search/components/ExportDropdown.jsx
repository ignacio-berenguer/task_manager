import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export function ExportDropdown({ onExport, isExporting, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting} className="gap-2">
          {isExporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Formato de Exportacion</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { console.log('[Export] Excel clicked'); onExport('xlsx') }} className="cursor-pointer gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { console.log('[Export] CSV clicked'); onExport('csv') }} className="cursor-pointer gap-2">
          <FileText className="h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { console.log('[Export] TSV clicked'); onExport('tsv') }} className="cursor-pointer gap-2">
          <FileText className="h-4 w-4" />
          Tab-delimited (.tsv)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { console.log('[Export] JSON clicked'); onExport('json') }} className="cursor-pointer gap-2">
          <FileJson className="h-4 w-4" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
