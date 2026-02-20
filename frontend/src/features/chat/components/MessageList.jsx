import { useEffect, useRef } from 'react'
import { MessageSquare, Wrench, ChevronRight, Sparkles, Lightbulb } from 'lucide-react'
import { MessageBubble } from './MessageBubble'

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

const EXAMPLE_QUESTIONS = [
  '¿Cuántas iniciativas hay en ejecución?',
  '¿Cuál es el presupuesto total de 2025 por unidad?',
  '¿Qué iniciativas tiene la unidad Digital?',
  'Dame los detalles de SPA_25_001',
]

export function MessageList({ messages, isLoading, streamingContent, toolSteps, thinkingParts, onExampleClick }) {
  const endRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, toolSteps])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Animated icon with gradient background */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center shadow-lg shadow-primary/5">
            <Sparkles className="w-9 h-9 text-primary animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent blur-md -z-10" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight mb-2">Asistente IA del Portfolio</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-sm leading-relaxed">
          Pregunta cualquier cosa sobre las iniciativas, presupuestos, estados y datos del portfolio digital.
        </p>

        {/* Example questions as pill buttons */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              className="text-sm px-4 py-2 rounded-full border border-primary/20 bg-background hover:border-primary/50 hover:shadow-[0_0_12px_rgba(var(--primary-rgb,99,102,241),0.15)] transition-all duration-200 cursor-pointer text-foreground/80 hover:text-foreground"
              onClick={() => onExampleClick?.(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}

      {/* Tool activity panel — shown while agent is thinking */}
      {isLoading && toolSteps.length > 0 && !streamingContent && (
        <ToolStepsPanel steps={toolSteps} thinkingParts={thinkingParts} />
      )}

      {/* Streaming response */}
      {isLoading && streamingContent && (
        <MessageBubble
          message={{ role: 'assistant', content: streamingContent }}
          isStreaming
        />
      )}

      {/* Simple thinking indicator when no tool steps yet and no streaming */}
      {isLoading && !streamingContent && toolSteps.length === 0 && (
        <div className="flex gap-3 py-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

function ToolStepsPanel({ steps, thinkingParts }) {
  const hasThinking = thinkingParts?.some(t => t.trim())

  return (
    <div className="flex gap-3 py-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 ring-2 ring-primary/20">
        <Wrench className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <div className="flex-1 max-w-[90%]">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-2.5 space-y-1.5">
          {hasThinking && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-1">
              <Lightbulb className="w-3 h-3" />
              <span>Razonamiento capturado</span>
            </div>
          )}
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Consultando datos...
          </div>
          {steps.map((step, i) => (
            <ToolStepRow key={i} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ToolStepRow({ step, isLast }) {
  const label = TOOL_LABELS[step.tool] || step.tool

  return (
    <div className="flex items-start gap-2 text-sm">
      <ChevronRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isLast ? 'text-primary animate-pulse' : 'text-muted-foreground/60'}`} />
      <div className="min-w-0">
        <span className={`font-medium ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </span>
        {step.inputSummary && (
          <span className="text-muted-foreground text-xs ml-1.5">
            ({step.inputSummary})
          </span>
        )}
        {step.thinking && (
          <p className="text-muted-foreground text-xs mt-0.5 italic">
            {step.thinking.length > 150 ? step.thinking.slice(0, 150) + '...' : step.thinking}
          </p>
        )}
        {step.resultSummary && !isLast && (
          <span className="text-muted-foreground/50 text-xs ml-1">
            → {step.resultSummary}
          </span>
        )}
      </div>
    </div>
  )
}
