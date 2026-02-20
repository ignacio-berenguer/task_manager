import { useState } from 'react'
import { User, Bot, ChevronRight, ChevronDown, Wrench, Clock, Database, Lightbulb } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { cn } from '@/lib/utils'

const TOOL_LABELS = {
  buscar_iniciativas: 'Buscar iniciativas',
  buscar_en_tabla: 'Buscar en tabla',
  obtener_iniciativa: 'Obtener iniciativa',
  obtener_documentos: 'Obtener documentos',
  contar_iniciativas: 'Contar iniciativas',
  totalizar_importes: 'Totalizar importes',
  listar_tablas: 'Listar tablas',
  describir_tabla: 'Describir tabla',
  obtener_valores_campo: 'Obtener valores',
  generar_grafico: 'Generar gráfico',
  ejecutar_consulta_sql: 'Ejecutar SQL',
}

export function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user'
  const hasToolSteps = !isUser && message.toolSteps?.length > 0
  const hasThinking = !isUser && message.thinking?.some(t => t.trim())

  return (
    <div className={cn('flex gap-3 py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 ring-2 ring-primary/20">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={cn('space-y-1.5', isUser ? 'max-w-[85%]' : 'max-w-[90%]')}>
        {hasThinking && <ThinkingAccordion parts={message.thinking} />}
        {hasToolSteps && <ToolStepsAccordion steps={message.toolSteps} />}
        <div
          className={cn(
            'rounded-lg px-4 py-2.5',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
              : 'bg-background/80 backdrop-blur-sm border border-border/50 text-foreground',
            isStreaming && !isUser && 'animate-pulse-subtle'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="text-sm prose-sm">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 ring-2 ring-primary/20">
          <User className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  )
}

function ToolStepsAccordion({ steps }) {
  const [open, setOpen] = useState(false)
  const totalDuration = steps.reduce((sum, s) => sum + (s.durationMs || 0), 0)

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <Wrench className="w-3 h-3" />
        <span className="font-medium">Proceso de respuesta</span>
        <span className="text-muted-foreground/60">
          ({steps.length} {steps.length === 1 ? 'consulta' : 'consultas'}
          {totalDuration > 0 && ` \u00b7 ${formatDuration(totalDuration)}`})
        </span>
        {open
          ? <ChevronDown className="w-3 h-3 ml-auto" />
          : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="border-t border-border/30">
          {steps.map((step, i) => (
            <ToolStepDetail key={i} step={step} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function ToolStepDetail({ step, index }) {
  const [expanded, setExpanded] = useState(false)
  const label = TOOL_LABELS[step.tool] || step.tool

  return (
    <div className={cn('border-b border-border/20 last:border-b-0', expanded && 'bg-muted/20')}>
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/20 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
          : <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground/60" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground">{label}</span>
            {step.inputSummary && (
              <span className="text-muted-foreground">— {step.inputSummary}</span>
            )}
          </div>
          {step.thinking && (
            <p className="text-muted-foreground mt-0.5 italic leading-relaxed">
              {step.thinking}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground/60 ml-2">
          {step.resultSummary && (
            <span className="hidden sm:inline" title={step.resultSummary}>
              <Database className="w-3 h-3 inline mr-0.5" />
              {step.resultSummary.length > 30 ? step.resultSummary.slice(0, 30) + '...' : step.resultSummary}
            </span>
          )}
          {step.durationMs > 0 && (
            <span title={`${step.durationMs} ms`}>
              <Clock className="w-3 h-3 inline mr-0.5" />
              {formatDuration(step.durationMs)}
            </span>
          )}
        </div>
      </button>

      {/* Expanded technical details */}
      {expanded && (
        <div className="px-3 pb-2 ml-5 space-y-2">
          {/* Thinking / reasoning */}
          {step.thinking && (
            <DetailSection title="Razonamiento">
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{step.thinking}</p>
            </DetailSection>
          )}

          {/* Full API call parameters */}
          {step.inputRaw && (
            <DetailSection title="Parámetros de la herramienta (JSON)">
              <pre className="text-xs font-mono bg-muted/40 rounded-md px-2.5 py-2 overflow-x-auto whitespace-pre-wrap break-all border border-border/20">
                {JSON.stringify(step.inputRaw, null, 2)}
              </pre>
            </DetailSection>
          )}

          {/* Result summary */}
          {step.resultSummary && (
            <DetailSection title="Resultado">
              <p className="text-xs text-foreground/80">{step.resultSummary}</p>
            </DetailSection>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 pt-1">
            {step.iteration > 0 && <span>Iteración {step.iteration}</span>}
            {step.durationMs > 0 && <span>Duración: {step.durationMs} ms</span>}
            <span className="font-mono">Herramienta: {step.tool}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
        {title}
      </div>
      {children}
    </div>
  )
}

function ThinkingAccordion({ parts }) {
  const [open, setOpen] = useState(false)
  const nonEmpty = parts.filter(t => t.trim())
  if (nonEmpty.length === 0) return null

  return (
    <div className="rounded-lg border border-border/40 bg-amber-500/5 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-amber-500/10 transition-colors"
      >
        <Lightbulb className="w-3 h-3 text-amber-500" />
        <span className="font-medium">Razonamiento del asistente</span>
        <span className="text-muted-foreground/60">
          ({nonEmpty.length} {nonEmpty.length === 1 ? 'paso' : 'pasos'})
        </span>
        {open
          ? <ChevronDown className="w-3 h-3 ml-auto" />
          : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="border-t border-border/30 px-3 py-2 space-y-2">
          {nonEmpty.map((text, i) => (
            <div key={i} className="text-xs text-foreground/80">
              <MarkdownRenderer content={text} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
