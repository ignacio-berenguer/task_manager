import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Chat')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [toolSteps, setToolSteps] = useState([])
  const [thinkingParts, setThinkingParts] = useState([])
  const abortRef = useRef(null)
  const clearedRef = useRef(false) // Track if chat was explicitly cleared

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return

    // Reset cleared flag when starting a new message
    clearedRef.current = false

    const userMessage = { role: 'user', content: content.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setStreamingContent('')
    setToolSteps([])
    setThinkingParts([])

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        let errorMsg = 'Error del servidor'
        try {
          const errorData = await response.json()
          errorMsg = errorData.detail || errorMsg
        } catch { /* ignore */ }
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }])
        setIsLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''
      const collectedToolSteps = []
      const collectedThinking = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        let eventType = null
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6))
              if (eventType === 'clear_streaming') {
                // Capture thinking text before clearing
                if (accumulated.trim()) {
                  collectedThinking.push(accumulated.trim())
                  setThinkingParts([...collectedThinking])
                }
                accumulated = ''
                setStreamingContent('')
              } else if (eventType === 'tool_call') {
                const step = {
                  tool: data.tool,
                  inputSummary: data.input_summary || '',
                  inputRaw: data.input_raw || null,
                  thinking: data.thinking || '',
                  resultSummary: data.result_summary || '',
                  durationMs: data.duration_ms || 0,
                  iteration: data.iteration || 0,
                }
                collectedToolSteps.push(step)
                setToolSteps(prev => [...prev, step])
              } else if (eventType === 'chunk' && data.content) {
                accumulated += data.content
                setStreamingContent(accumulated)
              } else if (eventType === 'error') {
                accumulated += `\n\nError: ${data.message || 'Error desconocido'}`
                setStreamingContent(accumulated)
              }
            } catch (e) {
              logger.warning('Failed to parse SSE data', e)
            }
            eventType = null
          } else if (line === '') {
            eventType = null
          }
        }
      }

      // Finalize: move streaming content into messages, preserving tool steps and thinking
      const assistantMsg = {
        role: 'assistant',
        content: accumulated || 'No se recibió respuesta del asistente.',
        ...(collectedToolSteps.length > 0 && { toolSteps: collectedToolSteps }),
        ...(collectedThinking.length > 0 && { thinking: collectedThinking }),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.info('Request aborted')
        // Only add interrupted message if chat wasn't explicitly cleared
        if (!clearedRef.current && (accumulated || streamingContent)) {
          setMessages(prev => [...prev, { role: 'assistant', content: (accumulated || streamingContent) + '\n\n*(Respuesta interrumpida)*' }])
        }
      } else {
        logger.error('Chat error', error)
        setMessages(prev => [...prev, { role: 'assistant', content: 'No se pudo conectar con el servidor. Verifica que el backend está ejecutándose.' }])
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      setToolSteps([])
      setThinkingParts([])
      abortRef.current = null
    }
  }, [messages, isLoading])

  const clearChat = useCallback(() => {
    // Mark chat as cleared before aborting to prevent race condition
    clearedRef.current = true
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setMessages([])
    setStreamingContent('')
    setToolSteps([])
    setThinkingParts([])
    setIsLoading(false)
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  const value = {
    messages,
    isLoading,
    streamingContent,
    toolSteps,
    thinkingParts,
    sendMessage,
    clearChat,
    stopGeneration,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
