import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Conversation, Message, ModelConfig } from '@/lib/types'
import { sendMessage } from '@/lib/api'
import { ConversationSidebar } from '@/components/ConversationSidebar'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'
import { SettingsDialog } from '@/components/SettingsDialog'
import { OAuthCallback } from '@/components/OAuthCallback'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Gear } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

function App() {
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />
  }
  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [config, setConfig] = useKV<ModelConfig>('model-config', {
    provider: 'openai',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-4o',
    apiKey: '',
    authMethod: 'api-key',
    temperature: 0.7,
    maxTokens: 2000
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const safeConversations = conversations ?? []
  const safeConfig = config ?? {
    provider: 'openai' as const,
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-4o',
    apiKey: '',
    authMethod: 'api-key' as const,
    temperature: 0.7,
    maxTokens: 2000
  }

  const currentConversation = safeConversations.find(c => c.id === currentConversationId)

  useEffect(() => {
    if (safeConversations.length === 0) {
      createNewConversation()
    } else if (!currentConversationId) {
      setCurrentConversationId(safeConversations[0].id)
    }
  }, [])

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'oauth-success') {
        setConfig(current => ({
          ...(current ?? safeConfig),
          oauthToken: event.data.token
        }))
        toast.success('Successfully connected to GitHub!')
      } else if (event.data.type === 'oauth-error') {
        toast.error(event.data.error || 'OAuth authentication failed')
      }
    }

    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentConversation?.messages])

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setConversations(current => [...(current ?? []), newConv])
    setCurrentConversationId(newConv.id)
  }

  const deleteConversation = (id: string) => {
    setConversations(current => {
      const safeCurrent = current ?? []
      const filtered = safeCurrent.filter(c => c.id !== id)
      if (filtered.length === 0) {
        const newConv: Conversation = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        setCurrentConversationId(newConv.id)
        return [newConv]
      }
      if (id === currentConversationId) {
        setCurrentConversationId(filtered[0].id)
      }
      return filtered
    })
  }

  const updateConversationTitle = (convId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    setConversations(current =>
      (current ?? []).map(c => c.id === convId ? { ...c, title, updatedAt: Date.now() } : c)
    )
  }

  const handleSendMessage = async (content: string) => {
    const isApiKeyMethod = safeConfig.authMethod === 'api-key'
    const isOAuthMethod = safeConfig.authMethod === 'oauth'
    const isNoneMethod = safeConfig.authMethod === 'none'

    if (isApiKeyMethod && !safeConfig.apiKey) {
      toast.error('Please configure your API key in settings')
      setSettingsOpen(true)
      return
    }

    if (isOAuthMethod && !safeConfig.oauthToken) {
      toast.error('Please authenticate with OAuth in settings')
      setSettingsOpen(true)
      return
    }

    if (!currentConversationId) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    }

    setConversations(current =>
      (current ?? []).map(c =>
        c.id === currentConversationId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              updatedAt: Date.now()
            }
          : c
      )
    )

    if (currentConversation && currentConversation.messages.length === 0) {
      updateConversationTitle(currentConversationId, content)
    }

    const assistantMessageId = uuidv4()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    }

    setConversations(current =>
      (current ?? []).map(c =>
        c.id === currentConversationId
          ? {
              ...c,
              messages: [...c.messages, assistantMessage]
            }
          : c
      )
    )

    setIsStreaming(true)

    try {
      const conversationHistory = currentConversation?.messages.map(m => ({
        role: m.role,
        content: m.content
      })) || []

      await sendMessage(
        content,
        conversationHistory,
        safeConfig,
        (token: string) => {
          setConversations(current =>
            (current ?? []).map(c =>
              c.id === currentConversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + token }
                        : m
                    )
                  }
                : c
            )
          )
        }
      )

      setConversations(current =>
        (current ?? []).map(c =>
          c.id === currentConversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false }
                    : m
                ),
                updatedAt: Date.now()
              }
            : c
        )
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)

      setConversations(current =>
        (current ?? []).map(c =>
          c.id === currentConversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: `Error: ${errorMessage}`,
                        isStreaming: false,
                        error: true
                      }
                    : m
                )
              }
            : c
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-screen bg-background text-foreground">
        <ConversationSidebar
          conversations={safeConversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
        />

        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">
                {currentConversation?.title || 'AI Chat'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {safeConfig.provider === 'openai' && 'OpenAI'}
                {safeConfig.provider === 'z-ai' && 'z.ai'}
                {safeConfig.provider === 'copilot' && 'GitHub Copilot'}
                {safeConfig.provider === 'localhost' && 'Localhost'}
                {safeConfig.provider === 'custom' && 'Custom'}
                {' • '}{safeConfig.modelName || 'No model configured'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="hover:bg-accent/20"
            >
              <Gear weight="bold" className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-4xl mx-auto p-6 space-y-4">
              {currentConversation?.messages.length === 0 && (
                <div className="flex items-center justify-center h-[60vh] text-center">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      Start a conversation
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Send a message to begin chatting with your configured AI model
                    </p>
                  </div>
                </div>
              )}
              {currentConversation?.messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>

          <MessageInput onSend={handleSendMessage} disabled={isStreaming} />
        </div>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          config={safeConfig}
          onSave={(newConfig) => {
            setConfig(newConfig)
            toast.success('Configuration saved')
          }}
        />
      </div>
    </>
  )
}

export default App