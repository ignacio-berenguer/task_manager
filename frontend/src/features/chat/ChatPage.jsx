import { useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useChatContext } from './ChatContext'
import { MessageList } from './components/MessageList'
import { ChatInput } from './components/ChatInput'

export function ChatPage() {
  usePageTitle('Asistente IA')
  const { user } = useUser()
  const { messages, isLoading, streamingContent, toolSteps, thinkingParts, sendMessage, clearChat, stopGeneration } = useChatContext()

  const focusChatInput = useCallback(() => {
    const input = document.querySelector('[data-chat-input]')
    if (input) input.focus()
  }, [])

  // Register chat shortcuts for overlay display
  useKeyboardShortcuts([
    {
      id: 'chat.focus',
      keys: '/',
      key: '/',
      description: 'Enfocar campo de mensaje',
      category: 'Chat',
      action: focusChatInput,
    },
    {
      id: 'chat.stop',
      keys: 'Esc',
      key: 'Escape',
      description: 'Detener generación',
      category: 'Chat',
      action: () => { if (isLoading) stopGeneration() },
      alwaysActive: true,
      enabled: isLoading,
    },
    {
      id: 'chat.send',
      keys: 'Enter',
      key: 'Enter',
      description: 'Enviar mensaje',
      category: 'Chat',
      action: () => {},  // handled by ChatInput directly
    },
    {
      id: 'chat.history',
      keys: '↑ / ↓',
      key: 'ArrowUp',
      description: 'Historial de comandos',
      category: 'Chat',
      action: () => {},  // handled by ChatInput directly
    },
  ], [isLoading, stopGeneration, focusChatInput])

  const userName = user?.firstName || null

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight">Asistente IA</h1>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-3.5 h-3.5" />
              Nueva conversación
            </Button>
          )}
          {/* Subtle gradient accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
          toolSteps={toolSteps}
          thinkingParts={thinkingParts}
          onExampleClick={sendMessage}
          userName={userName}
        />

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}
