import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ConsoleDialog')

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

/**
 * Parse SSE text into events.
 * Handles buffered chunks that may contain partial lines.
 */
function parseSSEEvents(text) {
  const events = []
  const blocks = text.split('\n\n')
  for (const block of blocks) {
    if (!block.trim()) continue
    let eventType = 'message'
    let data = null
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        try {
          data = JSON.parse(line.slice(6))
        } catch {
          data = { line: line.slice(6) }
        }
      }
    }
    if (data) {
      events.push({ type: eventType, data })
    }
  }
  return events
}

/**
 * Terminal-like dialog that streams output from a backend trabajo endpoint.
 */
export function ConsoleDialog({ open, onClose, title, endpoint }) {
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('idle') // idle | running | completed | failed
  const [exitCode, setExitCode] = useState(null)
  const [duration, setDuration] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const outputRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [])

  // Auto-scroll when lines change
  useEffect(() => {
    scrollToBottom()
  }, [lines, scrollToBottom])

  // Elapsed time timer
  useEffect(() => {
    if (status === 'running') {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  // Stream the endpoint when dialog opens
  useEffect(() => {
    if (!open || !endpoint) return

    // Reset state
    setLines([])
    setStatus('running')
    setExitCode(null)
    setDuration(null)
    setError(null)
    setElapsed(0)

    let cancelled = false

    async function streamJob() {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.status === 409) {
          const body = await response.json()
          setError(body.detail || 'A job is already running')
          setStatus('failed')
          logger.warning('Job conflict: already running')
          return
        }

        if (!response.ok) {
          setError(`HTTP ${response.status}: ${response.statusText}`)
          setStatus('failed')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break

          buffer += decoder.decode(value, { stream: true })

          // Split on double newlines (SSE event separator)
          const parts = buffer.split('\n\n')
          // Keep last part as potential incomplete event
          buffer = parts.pop() || ''

          const chunk = parts.join('\n\n')
          if (!chunk.trim()) continue

          const events = parseSSEEvents(chunk + '\n\n')

          for (const event of events) {
            if (cancelled) break

            if (event.type === 'output' || event.type === 'error') {
              setLines(prev => [...prev, {
                text: event.data.line,
                stream: event.data.stream || (event.type === 'error' ? 'stderr' : 'stdout'),
                timestamp: event.data.timestamp,
              }])
            } else if (event.type === 'status') {
              const { status: s, exit_code, duration_seconds, error: err } = event.data
              if (s === 'completed' || s === 'failed') {
                setStatus(s)
                if (exit_code !== undefined) setExitCode(exit_code)
                if (duration_seconds !== undefined) setDuration(duration_seconds)
                if (err) setError(err)
                logger.info(`Job ${s}: exit_code=${exit_code}, duration=${duration_seconds}s`)
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim() && !cancelled) {
          const events = parseSSEEvents(buffer + '\n\n')
          for (const event of events) {
            if (event.type === 'output' || event.type === 'error') {
              setLines(prev => [...prev, {
                text: event.data.line,
                stream: event.data.stream || 'stdout',
                timestamp: event.data.timestamp,
              }])
            } else if (event.type === 'status') {
              const { status: s, exit_code, duration_seconds, error: err } = event.data
              if (s === 'completed' || s === 'failed') {
                setStatus(s)
                if (exit_code !== undefined) setExitCode(exit_code)
                if (duration_seconds !== undefined) setDuration(duration_seconds)
                if (err) setError(err)
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Stream error:', err)
          setError(err.message)
          setStatus('failed')
        }
      }
    }

    streamJob()

    return () => {
      cancelled = true
    }
  }, [open, endpoint])

  // Handle ESC key
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-100 font-heading">
              {title || 'Console'}
            </h2>
            {status === 'running' && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Ejecutando
              </span>
            )}
            {status === 'completed' && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Completado
              </span>
            )}
            {status === 'failed' && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
                <XCircle className="h-3 w-3" />
                Error
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Output area */}
        <div
          ref={outputRef}
          className="overflow-y-auto bg-zinc-950 px-4 py-3 font-mono text-xs leading-5 text-zinc-300"
          style={{ maxHeight: '60vh', minHeight: '300px' }}
        >
          {error && lines.length === 0 && (
            <div className="text-red-400">{error}</div>
          )}
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                line.stream === 'stderr'
                  ? 'text-red-400'
                  : 'text-zinc-300'
              }
            >
              {line.text}
            </div>
          ))}
          {status === 'running' && (
            <div className="mt-1 text-zinc-600 animate-pulse">_</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-700 px-4 py-2.5">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {status === 'running' && (
              <span>Tiempo: {formatElapsed(elapsed)}</span>
            )}
            {duration !== null && (
              <span>Duracion: {duration}s</span>
            )}
            {exitCode !== null && (
              <span>Exit code: {exitCode}</span>
            )}
            {lines.length > 0 && (
              <span>{lines.length} lineas</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
