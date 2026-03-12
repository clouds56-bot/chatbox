import { useState, useRef, useEffect, useMemo } from 'react'
import { Conversation, Message, EndpointConfig, OAuthToken, ModeType } from '@/lib/types'
import { sendMessage } from '@/lib/api'
import { DEFAULT_MODE, getModeConfig, isModeType } from '@/lib/modes'
import { loadAppConfig, loadAppSession, saveAppConfig, saveAppSession } from '@/lib/persistence'
import { ConversationSidebar } from '@/components/ConversationSidebar'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'
import { EndpointsDialog } from '@/components/EndpointsDialog'
import { OAuthCallback } from '@/components/OAuthCallback'
import { ChatHeader } from '@/components/widgets/ChatHeader'
import { EmptyState } from '@/components/widgets/EmptyState'
import { SystemPromptPanel } from '@/components/widgets/SystemPromptPanel'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { toast, Toaster } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useIsMobile } from '@/hooks/use-mobile'

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([])
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [endpointsOpen, setEndpointsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedMode, setSelectedMode] = useState<ModeType>(DEFAULT_MODE)
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const isMobile = useIsMobile()

  const safeConversations = useMemo(() => conversations ?? [], [conversations])
  const safeEndpoints = useMemo(() => endpoints ?? [], [endpoints])

  const currentConversation = safeConversations.find(c => c.id === currentConversationId)
  const defaultEndpoint = safeEndpoints.find(e => e.isDefault) || safeEndpoints[0]

  useEffect(() => {
    let active = true

    const initializeState = async () => {
      const [storedConfig, storedSession] = await Promise.all([
        loadAppConfig(),
        loadAppSession()
      ])

      if (!active) {
        return
      }

      setEndpoints(storedConfig.endpoints)
      setSelectedEndpointId(storedConfig.selectedEndpointId)

      if (storedSession.conversations.length === 0) {
        const newConversation: Conversation = {
          id: uuidv4(),
          title: 'New Chat',
          mode: DEFAULT_MODE,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        setConversations([newConversation])
        setCurrentConversationId(newConversation.id)
        setSelectedMode(DEFAULT_MODE)
      } else {
        const normalizedConversations = storedSession.conversations.map((conversation) => ({
          ...conversation,
          mode: conversation.mode && isModeType(conversation.mode)
            ? conversation.mode
            : DEFAULT_MODE
        }))

        setConversations(normalizedConversations)
        const sessionConversationExists = storedSession.currentConversationId
          ? normalizedConversations.some(c => c.id === storedSession.currentConversationId)
          : false
        const nextConversationId = (
          sessionConversationExists
            ? storedSession.currentConversationId
            : normalizedConversations[0].id
        )

        const nextConversation = normalizedConversations.find(c => c.id === nextConversationId)
        setCurrentConversationId(nextConversationId)
        setSelectedMode(nextConversation?.mode ?? DEFAULT_MODE)
      }

      setIsHydrated(true)
    }

    initializeState().catch((error) => {
      console.error('Failed to initialize app state:', error)
      if (active) {
        const newConversation: Conversation = {
          id: uuidv4(),
          title: 'New Chat',
          mode: DEFAULT_MODE,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        setConversations([newConversation])
        setCurrentConversationId(newConversation.id)
        setSelectedMode(DEFAULT_MODE)
        setIsHydrated(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    saveAppConfig({
      endpoints: safeEndpoints,
      selectedEndpointId
    }).catch((error) => {
      console.error('Failed to save config:', error)
    })
  }, [safeEndpoints, selectedEndpointId, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    saveAppSession({
      conversations: safeConversations,
      currentConversationId
    }).catch((error) => {
      console.error('Failed to save session:', error)
    })
  }, [safeConversations, currentConversationId, isHydrated])

  useEffect(() => {
    if (!selectedEndpointId && defaultEndpoint) {
      setSelectedEndpointId(defaultEndpoint.id)
    }
  }, [defaultEndpoint, selectedEndpointId])

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

  const getScrollViewport = () => {
    return scrollRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
  }

  const isNearBottom = (viewport: HTMLElement, threshold = 96) => {
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    return distanceFromBottom <= threshold
  }

  useEffect(() => {
    shouldAutoScrollRef.current = true
  }, [currentConversationId])

  useEffect(() => {
    shouldAutoScrollRef.current = true
  }, [isMobile])

  useEffect(() => {
    const viewport = getScrollViewport()
    if (!viewport) {
      return
    }

    const handleScroll = () => {
      shouldAutoScrollRef.current = isNearBottom(viewport)
    }

    handleScroll()
    viewport.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
    }
  }, [currentConversationId, isHydrated, isMobile])

  useEffect(() => {
    const viewport = getScrollViewport()
    if (!viewport) {
      return
    }

    if (!shouldAutoScrollRef.current) {
      return
    }

    viewport.scrollTop = viewport.scrollHeight
  }, [currentConversation?.messages, isStreaming, isMobile])

  const createNewConversation = (mode: ModeType = DEFAULT_MODE) => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      mode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setConversations(current => [...(current ?? []), newConv])
    setCurrentConversationId(newConv.id)
    setSelectedMode(mode)
  }

  const deleteConversation = (id: string) => {
    setConversations(current => {
      const safeCurrent = current ?? []
      const filtered = safeCurrent.filter(c => c.id !== id)
      if (filtered.length === 0) {
        const newConv: Conversation = {
          id: uuidv4(),
          title: 'New Chat',
          mode: DEFAULT_MODE,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        setCurrentConversationId(newConv.id)
        setSelectedMode(DEFAULT_MODE)
        return [newConv]
      }
      if (id === currentConversationId) {
        setCurrentConversationId(filtered[0].id)
        setSelectedMode(filtered[0].mode ?? DEFAULT_MODE)
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

  const handleSendMessage = async (
    content: string,
    endpointId: string,
    modelName?: string,
    mode?: ModeType
  ) => {
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

    shouldAutoScrollRef.current = true

    const actualModelName = modelName || endpoint.modelName
    const activeMode = mode ?? currentConversation?.mode ?? selectedMode

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
              mode: c.mode ?? activeMode,
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
      thinking: '',
      isThinkingStreaming: false,
      endpointId
    }

    setConversations(current =>
      (current ?? []).map(c =>
        c.id === currentConversationId
          ? {
              ...c,
              mode: c.mode ?? activeMode,
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
        activeMode,
        (token: string, type?: 'content' | 'thinking') => {
          setConversations(current =>
            (current ?? []).map(c =>
              c.id === currentConversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === assistantMessageId
                        ? type === 'thinking'
                          ? { 
                              ...m, 
                              thinking: (m.thinking || '') + token,
                              isThinkingStreaming: true,
                              thinkingStartTime: m.thinkingStartTime || Date.now(),
                              thinkingTokenCount: (m.thinkingTokenCount || 0) + 1
                            }
                          : { 
                              ...m, 
                              content: m.content + token,
                              isStreaming: true,
                              isThinkingStreaming: false,
                              thinkingEndTime: m.thinking && !m.thinkingEndTime ? Date.now() : m.thinkingEndTime
                            }
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
                    ? { 
                        ...m, 
                        isStreaming: false, 
                        isThinkingStreaming: false,
                        thinkingEndTime: m.thinking && !m.thinkingEndTime ? Date.now() : m.thinkingEndTime
                      }
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
  const modeConfig = getModeConfig(selectedMode)

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    const conversation = safeConversations.find(c => c.id === id)
    setSelectedMode(conversation?.mode ?? DEFAULT_MODE)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleNewConversation = () => {
    createNewConversation(DEFAULT_MODE)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleModeChange = (mode: ModeType) => {
    if (!currentConversationId) {
      setSelectedMode(mode)
      return
    }

    setSelectedMode(mode)
    setConversations(current =>
      (current ?? []).map(c =>
        c.id === currentConversationId && c.messages.length === 0
          ? { ...c, mode }
          : c
      )
    )
  }

  const renderMessageList = () => (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6 space-y-4">
      {safeEndpoints.length === 0 && (
        <EmptyState
          type="no-endpoints"
          onConfigureClick={() => setEndpointsOpen(true)}
        />
      )}
      {safeEndpoints.length > 0 && currentConversation?.messages.length === 0 && (
        <EmptyState
          type="no-messages"
          endpointName={selectedEndpoint?.name}
        />
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
  )

  const renderComposer = (showEndpointFallback: boolean) => {
    if (safeEndpoints.length > 0) {
      return (
        <MessageInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          endpoints={safeEndpoints}
          selectedEndpointId={selectedEndpointId}
          onEndpointChange={setSelectedEndpointId}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          modeLocked={(currentConversation?.messages.length ?? 0) > 0}
        />
      )
    }

    if (!showEndpointFallback) {
      return null
    }

    return (
      <div className="flex h-full items-center justify-center p-6">
        <Button onClick={() => setEndpointsOpen(true)}>
          Configure endpoint
        </Button>
      </div>
    )
  }

  const renderChatBody = (onMenuClick?: () => void) => (
    <>
      <ChatHeader
        title={currentConversation?.title || 'AI Chat'}
        endpoint={selectedEndpoint}
        onSettingsClick={() => setEndpointsOpen(true)}
        onMenuClick={onMenuClick}
      />

      <SystemPromptPanel
        modeLabel={modeConfig.label}
        systemPrompt={modeConfig.systemPrompt}
      />

      <ScrollArea
        key={isMobile ? 'mobile-scroll-area' : 'desktop-scroll-area'}
        ref={scrollRef}
        className="flex-1 min-h-0"
      >
        {renderMessageList()}
      </ScrollArea>
    </>
  )

  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback />
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen bg-background text-foreground">
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={22} minSize={16} maxSize={34}>
              <ConversationSidebar
                conversations={safeConversations}
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={deleteConversation}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={78} minSize={50}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={74} minSize={45}>
                  <div className="flex h-full min-h-0 flex-col bg-background">
                    {renderChatBody()}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={26} minSize={18} maxSize={48}>
                  <div className="h-full border-t border-border/80 bg-card/20">
                    {renderComposer(true)}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {isMobile && (
          <div className="flex h-full min-w-0 flex-col">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="p-0 w-72">
                <ConversationSidebar
                  conversations={safeConversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  onDeleteConversation={deleteConversation}
                />
              </SheetContent>
            </Sheet>

            {renderChatBody(() => setSidebarOpen(true))}
            {renderComposer(false)}
          </div>
        )}

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
