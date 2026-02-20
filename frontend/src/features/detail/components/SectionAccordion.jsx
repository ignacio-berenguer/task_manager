import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Reusable accordion section for the detail page.
 *
 * Supports two modes:
 * - Uncontrolled: uses defaultOpen to set initial state (original behavior)
 * - Controlled: uses isOpen + onToggle from parent (for Expand/Collapse All)
 *
 * @param {object} props
 * @param {React.ReactNode} [props.headerAction] - Optional action element rendered in trigger (e.g. add button).
 *   When provided and section is empty, children are rendered instead of generic empty message.
 * @param {boolean} [props.isOpen] - Controlled open state (optional). When provided, overrides defaultOpen.
 * @param {function} [props.onToggle] - Called with section id when user clicks trigger (controlled mode).
 * @param {function} [props.onExport] - Optional callback to export section data as CSV.
 * @param {function} [props.onHistory] - Optional callback to open section edit history modal.
 */
export function SectionAccordion({
  id,
  title,
  count,
  defaultOpen = false,
  children,
  className,
  headerAction,
  isOpen: controlledOpen,
  onToggle,
  onExport,
  onHistory,
}) {
  const isEmpty = count === 0
  const isControlled = controlledOpen !== undefined

  const accordionProps = isControlled
    ? { value: controlledOpen ? [id] : [], onValueChange: () => onToggle?.(id) }
    : { defaultValue: defaultOpen ? id : undefined }

  return (
    <Accordion
      type="single"
      collapsible
      {...accordionProps}
      className={cn('mb-4 scroll-mt-44', className)}
      id={id}
    >
      <AccordionItem value={id} className="border rounded-lg border-l-4 border-l-primary/50">
        <div className="flex items-center px-4 py-3 bg-muted/30 hover:bg-muted/40">
          <AccordionTrigger className="hover:no-underline flex-1 p-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold font-heading">{title}</span>
              {count !== undefined && (
                <Badge variant={isEmpty ? 'outline' : 'secondary'} size="sm">
                  {isEmpty ? 'vacío' : count}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex items-center gap-0.5">
            {onHistory && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onHistory} title="Ver historial de cambios" aria-label="Ver historial de cambios">
                <Clock className="h-3.5 w-3.5" />
              </Button>
            )}
            {onExport && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExport} title="Exportar datos">
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {headerAction}
          </span>
        </div>
        <AccordionContent className="px-4 pb-4">
          {isEmpty && !headerAction ? (
            <p className="text-sm text-muted-foreground py-2">Sin datos disponibles</p>
          ) : (
            children
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
