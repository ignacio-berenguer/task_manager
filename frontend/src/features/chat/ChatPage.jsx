import { RotateCcw } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useChatContext } from './ChatContext'
import { MessageList } from './components/MessageList'
import { ChatInput } from './components/ChatInput'

export function ChatPage() {
  usePageTitle('Asistente IA')
  const { messages, isLoading, streamingContent, toolSteps, thinkingParts, sendMessage, clearChat, stopGeneration } = useChatContext()

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-3">
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
