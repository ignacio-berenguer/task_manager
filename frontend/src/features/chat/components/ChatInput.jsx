import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommandHistory } from '../hooks/useCommandHistory'

export function ChatInput({ onSend, onStop, isLoading }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)
  const { push, navigateUp, navigateDown, reset } = useCommandHistory()

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return
    push(value)
    onSend(value)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
      return
    }

    // ArrowUp: navigate command history
    if (e.key === 'ArrowUp') {
      const ta = textareaRef.current
      const hasNoNewlines = !value.includes('\n')
      const cursorAtStart = ta && ta.selectionStart === 0
      if (hasNoNewlines || cursorAtStart) {
        const prev = navigateUp(value)
        if (prev !== null) {
          e.preventDefault()
          setValue(prev)
          // Reset textarea height for the new value
          if (ta) {
            ta.style.height = 'auto'
            requestAnimationFrame(() => {
              ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
            })
          }
        }
      }
    }

    // ArrowDown: navigate command history
    if (e.key === 'ArrowDown') {
      const ta = textareaRef.current
      const hasNoNewlines = !value.includes('\n')
      const cursorAtEnd = ta && ta.selectionStart === value.length
      if (hasNoNewlines || cursorAtEnd) {
        const next = navigateDown()
        if (next !== null) {
          e.preventDefault()
          setValue(next)
          // Reset textarea height for the new value
          if (ta) {
            ta.style.height = 'auto'
            requestAnimationFrame(() => {
              ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
            })
          }
        }
      }
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    reset()
    // Auto-grow textarea
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  return (
    <div className="p-3">
      <div
        className="flex items-end max-w-4xl mx-auto rounded-xl border border-border bg-background shadow-sm transition-all duration-200 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre el portfolio..."
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 transition-all duration-200"
          style={{ maxHeight: '120px' }}
        />
        <div className="flex-shrink-0 p-1.5">
          {isLoading ? (
            <Button size="icon" variant="destructive" onClick={onStop} className="h-8 w-8 rounded-lg">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSubmit} disabled={!value.trim()} className="h-8 w-8 rounded-lg">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
