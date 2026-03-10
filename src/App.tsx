import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Conversation, Message, EndpointConfig, OAuthToken } from '@/lib/types'
import { sendMessage } from '@/lib/api'
import { ConversationSidebar } from '@/components/ConversationSidebar'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'
import { EndpointsDialog } from '@/components/EndpointsDialog'
import { OAuthCallback } from '@/components/OAuthCallback'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ListBullets } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

function App() {
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />
  }
  
  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useKV<EndpointConfig[]>('endpoints', [])
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [endpointsOpen, setEndpointsOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const safeConversations = conversations ?? []
  const safeEndpoints = endpoints ?? []

  const currentConversation = safeConversations.find(c => c.id === currentConversationId)
  const defaultEndpoint = safeEndpoints.find(e => e.isDefault) || safeEndpoints[0]

  useEffect(() => {
    if (safeConversations.length === 0) {
      createNewConversation()
    } else if (!currentConversationId) {
      setCurrentConversationId(safeConversations[0].id)
    }
  }, [])

  useEffect(() => {
    if (!selectedEndpointId && defaultEndpoint) {
      setSelectedEndpointId(defaultEndpoint.id)
    }
  }, [defaultEndpoint])

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'oauth-success') {
        const token: OAuthToken = event.data.token
        setEndpoints(current => {
          const updated = (current ?? []).map(e => {
            if (e.authMethod === 'oauth' && e.provider === 'copilot') {
              return { ...e, oauthToken: token }
            }
            return e
          })
          return updated
        })
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

  const handleSendMessage = async (content: string, endpointId: string, modelName?: string) => {
    const endpoint = safeEndpoints.find(e => e.id === endpointId)
    
    if (!endpoint) {
      toast.error('Selected endpoint not found')
      return
    }

    const isApiKeyMethod = endpoint.authMethod === 'api-key'
    const isOAuthMethod = endpoint.authMethod === 'oauth'

    if (isApiKeyMethod && !endpoint.apiKey) {
      toast.error('Please configure API key for this endpoint')
      setEndpointsOpen(true)
      return
    }

    if (isOAuthMethod && !endpoint.oauthToken) {
      toast.error('Please authenticate with OAuth for this endpoint')
      setEndpointsOpen(true)
      return
    }

    if (!currentConversationId) return

    const actualModelName = modelName || endpoint.modelName

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
      endpointId
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
      isStreaming: true,
      endpointId
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

      const endpointWithModel = { ...endpoint, modelName: actualModelName }

      await sendMessage(
        content,
        conversationHistory,
        endpointWithModel,
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

  const selectedEndpoint = safeEndpoints.find(e => e.id === selectedEndpointId) || defaultEndpoint

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
                {selectedEndpoint ? `${selectedEndpoint.name} • ${selectedEndpoint.modelName}` : 'No endpoint configured'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEndpointsOpen(true)}
              className="hover:bg-accent/20"
            >
              <ListBullets weight="bold" className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-4xl mx-auto p-6 space-y-4">
              {safeEndpoints.length === 0 && (
                <div className="flex items-center justify-center h-[60vh] text-center">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      Configure an endpoint
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Add at least one model endpoint to start chatting
                    </p>
                    <Button
                      onClick={() => setEndpointsOpen(true)}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      <ListBullets weight="bold" className="w-4 h-4 mr-2" />
                      Manage Endpoints
                    </Button>
                  </div>
                </div>
              )}
              {safeEndpoints.length > 0 && currentConversation?.messages.length === 0 && (
                <div className="flex items-center justify-center h-[60vh] text-center">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-foreground">
                      Start a conversation
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Send a message to begin chatting with {selectedEndpoint?.name || 'your selected model'}
                    </p>
                  </div>
                </div>
              )}
              {currentConversation?.messages.map(message => {
                const messageEndpoint = safeEndpoints.find(e => e.id === message.endpointId)
                return (
                  <MessageBubble 
                    key={message.id} 
                    message={message}
                    endpoint={message.role === 'assistant' ? messageEndpoint : undefined}
                  />
                )
              })}
            </div>
          </ScrollArea>

          {safeEndpoints.length > 0 && (
            <MessageInput 
              onSend={handleSendMessage} 
              disabled={isStreaming}
              endpoints={safeEndpoints}
              selectedEndpointId={selectedEndpointId}
              onEndpointChange={setSelectedEndpointId}
            />
          )}
        </div>

        <EndpointsDialog
          open={endpointsOpen}
          onOpenChange={setEndpointsOpen}
          endpoints={safeEndpoints}
          onSave={(newEndpoints) => {
            setEndpoints(newEndpoints)
          }}
        />
      </div>
    </>
  )
}

export default App
