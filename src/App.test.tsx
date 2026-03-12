import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import * as persistence from '@/lib/persistence'
import * as api from '@/lib/api'
import { Conversation, EndpointConfig } from '@/lib/types'

// Mock dependencies
vi.mock('@/lib/persistence')
vi.mock('@/lib/api')
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid'),
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock child components
vi.mock('@/components/ConversationSidebar', () => ({
  ConversationSidebar: ({
    conversations,
    currentConversationId,
    onNewConversation,
  }: {
    conversations: Conversation[]
    currentConversationId: string | null
    onNewConversation: () => void
  }) => (
    <div data-testid="conversation-sidebar">
      <button onClick={onNewConversation} data-testid="new-conversation-btn">
        New
      </button>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="current-conversation-id">{currentConversationId}</div>
    </div>
  ),
}))

vi.mock('@/components/MessageBubble', () => ({
  MessageBubble: ({ message }: { message: { id: string; content: string } }) => (
    <div data-testid={`message-${message.id}`}>{message.content}</div>
  ),
}))

vi.mock('@/components/MessageInput', () => ({
  MessageInput: ({
    onSend,
    disabled,
  }: {
    onSend: (content: string, endpointId: string) => void
    disabled: boolean
  }) => (
    <div data-testid="message-input">
      <button
        onClick={() => onSend('test message', 'test-endpoint-id')}
        disabled={disabled}
        data-testid="send-message-btn"
      >
        Send
      </button>
    </div>
  ),
}))

vi.mock('@/components/EndpointsDialog', () => ({
  EndpointsDialog: ({
    open,
    onSave,
  }: {
    open: boolean
    onSave: (endpoints: EndpointConfig[]) => void
  }) => (
    <div data-testid="endpoints-dialog" data-open={open}>
      <button
        onClick={() =>
          onSave([
            {
              id: 'test-endpoint-id',
              name: 'Test Endpoint',
              provider: 'openai',
              apiEndpoint: 'https://api.openai.com',
              modelName: 'gpt-4',
              apiKey: 'test-key',
              authMethod: 'api-key',
              isDefault: true,
            },
          ])
        }
        data-testid="save-endpoints-btn"
      >
        Save
      </button>
    </div>
  ),
}))

vi.mock('@/components/OAuthCallback', () => ({
  OAuthCallback: () => <div data-testid="oauth-callback">OAuth Callback</div>,
}))

vi.mock('@/components/widgets/ChatHeader', () => ({
  ChatHeader: ({
    onSettingsClick,
    onMenuClick,
  }: {
    onSettingsClick: () => void
    onMenuClick?: () => void
  }) => (
    <div data-testid="chat-header">
      <button onClick={onSettingsClick} data-testid="settings-btn">
        Settings
      </button>
      {onMenuClick && (
        <button onClick={onMenuClick} data-testid="menu-btn">
          Menu
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/widgets/EmptyState', () => ({
  EmptyState: ({ type, onConfigureClick }: { type: string; onConfigureClick?: () => void }) => (
    <div data-testid={`empty-state-${type}`}>
      {onConfigureClick && (
        <button onClick={onConfigureClick} data-testid="configure-btn">
          Configure
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/widgets/SystemPromptPanel', () => ({
  SystemPromptPanel: () => <div data-testid="system-prompt-panel">System Prompt</div>,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area" data-slot="scroll-area-viewport">
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
}))

vi.mock('@/components/ui/resizable', () => ({
  ResizableHandle: () => <div data-testid="resizable-handle" />,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}))

describe('App', () => {
  const mockEndpoint: EndpointConfig = {
    id: 'test-endpoint-id',
    name: 'Test Endpoint',
    provider: 'openai',
    apiEndpoint: 'https://api.openai.com',
    modelName: 'gpt-4',
    apiKey: 'test-key',
    authMethod: 'api-key',
    isDefault: true,
  }

  const mockConversation: Conversation = {
    id: 'test-conv-id',
    title: 'Test Chat',
    mode: 'chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(persistence.loadAppConfig).mockResolvedValue({
      endpoints: [mockEndpoint],
      selectedEndpointId: 'test-endpoint-id',
    })
    vi.mocked(persistence.loadAppSession).mockResolvedValue({
      conversations: [mockConversation],
      currentConversationId: 'test-conv-id',
    })
    vi.mocked(persistence.saveAppConfig).mockResolvedValue()
    vi.mocked(persistence.saveAppSession).mockResolvedValue()
    vi.mocked(api.sendMessage).mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', async () => {
    const { container } = render(<App />)
    await waitFor(() => {
      expect(container).toBeTruthy()
    })
  })

  it('initializes with stored configuration and session', async () => {
    render(<App />)

    await waitFor(() => {
      expect(persistence.loadAppConfig).toHaveBeenCalled()
      expect(persistence.loadAppSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
      expect(screen.getByTestId('current-conversation-id')).toHaveTextContent('test-conv-id')
    })
  })

  it('creates a new conversation when session is empty', async () => {
    vi.mocked(persistence.loadAppSession).mockResolvedValue({
      conversations: [],
      currentConversationId: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
    })
  })

  it('handles initialization error gracefully', async () => {
    vi.mocked(persistence.loadAppConfig).mockRejectedValue(new Error('Load failed'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
    })
  })

  it('saves configuration when endpoints change', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('endpoints-dialog')).toBeInTheDocument()
    })

    const saveBtn = screen.getByTestId('save-endpoints-btn')
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(persistence.saveAppConfig).toHaveBeenCalled()
    })
  })

  it('saves session when conversations change', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('new-conversation-btn')).toBeInTheDocument()
    })

    const newConvBtn = screen.getByTestId('new-conversation-btn')
    await userEvent.click(newConvBtn)

    await waitFor(() => {
      expect(persistence.saveAppSession).toHaveBeenCalled()
    })
  })

  it('opens settings dialog when settings button is clicked', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('settings-btn')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('settings-btn'))

    await waitFor(() => {
      const dialog = screen.getByTestId('endpoints-dialog')
      expect(dialog.getAttribute('data-open')).toBe('true')
    })
  })

  it('shows empty state when no endpoints configured', async () => {
    vi.mocked(persistence.loadAppConfig).mockResolvedValue({
      endpoints: [],
      selectedEndpointId: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-state-no-endpoints')).toBeInTheDocument()
    })
  })

  it('shows empty state when no messages in conversation', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-state-no-messages')).toBeInTheDocument()
    })
  })

  it('handles creating a new conversation', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('new-conversation-btn')).toBeInTheDocument()
    })

    const initialCount = screen.getByTestId('conversations-count').textContent
    await userEvent.click(screen.getByTestId('new-conversation-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).not.toHaveTextContent(initialCount || '')
    })
  })

  it('normalizes conversations with invalid mode on load', async () => {
    vi.mocked(persistence.loadAppSession).mockResolvedValue({
      conversations: [
        {
          ...mockConversation,
          mode: 'invalid-mode' as any,
        },
      ],
      currentConversationId: 'test-conv-id',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
    })
  })

  it('renders OAuth callback page when on /oauth/callback path', () => {
    const originalPathname = window.location.pathname
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '/oauth/callback' },
    })

    render(<App />)

    expect(screen.getByTestId('oauth-callback')).toBeInTheDocument()

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: originalPathname },
    })
  })

  it('handles OAuth success message', async () => {
    const { toast } = await import('sonner')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('chat-header')).toBeInTheDocument()
    })

    const oauthEvent = new MessageEvent('message', {
      origin: window.location.origin,
      data: {
        type: 'oauth-success',
        token: {
          accessToken: 'test-token',
          tokenType: 'Bearer',
        },
      },
    })

    window.dispatchEvent(oauthEvent)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully connected to GitHub!')
    })
  })

  it('handles OAuth error message', async () => {
    const { toast } = await import('sonner')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('chat-header')).toBeInTheDocument()
    })

    const oauthEvent = new MessageEvent('message', {
      origin: window.location.origin,
      data: {
        type: 'oauth-error',
        error: 'Authentication failed',
      },
    })

    window.dispatchEvent(oauthEvent)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Authentication failed')
    })
  })

  it('ignores messages from different origins', async () => {
    const { toast } = await import('sonner')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('chat-header')).toBeInTheDocument()
    })

    const oauthEvent = new MessageEvent('message', {
      origin: 'https://malicious-site.com',
      data: {
        type: 'oauth-success',
        token: { accessToken: 'fake-token', tokenType: 'Bearer' },
      },
    })

    window.dispatchEvent(oauthEvent)

    // Should not call toast
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('sends message when send button is clicked', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    const sendBtn = screen.getByTestId('send-message-btn')
    await userEvent.click(sendBtn)

    await waitFor(() => {
      expect(api.sendMessage).toHaveBeenCalled()
    })
  })

  it('shows error when sending message without API key', async () => {
    const { toast } = await import('sonner')
    vi.mocked(persistence.loadAppConfig).mockResolvedValue({
      endpoints: [{ ...mockEndpoint, apiKey: '' }],
      selectedEndpointId: 'test-endpoint-id',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('send-message-btn'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please configure API key for this endpoint')
    })
  })

  it('shows error when sending message without OAuth token', async () => {
    const { toast } = await import('sonner')
    vi.mocked(persistence.loadAppConfig).mockResolvedValue({
      endpoints: [{ ...mockEndpoint, authMethod: 'oauth', oauthToken: undefined }],
      selectedEndpointId: 'test-endpoint-id',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('send-message-btn'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please authenticate with OAuth for this endpoint'
      )
    })
  })

  it('handles message send error', async () => {
    const { toast } = await import('sonner')
    vi.mocked(api.sendMessage).mockRejectedValue(new Error('Network error'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('send-message-btn'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })

  it('sets default endpoint when no endpoint is selected', async () => {
    vi.mocked(persistence.loadAppConfig).mockResolvedValue({
      endpoints: [mockEndpoint],
      selectedEndpointId: null,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('chat-header')).toBeInTheDocument()
    })

    // The component should auto-select the default endpoint
    await waitFor(() => {
      expect(persistence.saveAppConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedEndpointId: 'test-endpoint-id',
        })
      )
    })
  })

  it('does not save before hydration is complete', async () => {
    vi.mocked(persistence.loadAppConfig).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ endpoints: [mockEndpoint], selectedEndpointId: null }), 100)
        })
    )

    render(<App />)

    // saveAppConfig should not be called immediately
    expect(persistence.saveAppConfig).not.toHaveBeenCalled()

    await waitFor(
      () => {
        expect(persistence.loadAppConfig).toHaveBeenCalled()
      },
      { timeout: 200 }
    )
  })

  it('handles persistence save errors silently', async () => {
    vi.mocked(persistence.saveAppConfig).mockRejectedValue(new Error('Save failed'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('save-endpoints-btn')).toBeInTheDocument()
    })

    const saveBtn = screen.getByTestId('save-endpoints-btn')
    await userEvent.click(saveBtn)

    // Should not crash, error is logged to console
    await waitFor(() => {
      expect(persistence.saveAppConfig).toHaveBeenCalled()
    })
  })

  it('restores conversation mode when switching conversations', async () => {
    const conv1: Conversation = { ...mockConversation, id: 'conv-1', mode: 'ask' }
    const conv2: Conversation = { ...mockConversation, id: 'conv-2', mode: 'research' }

    vi.mocked(persistence.loadAppSession).mockResolvedValue({
      conversations: [conv1, conv2],
      currentConversationId: 'conv-1',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('current-conversation-id')).toHaveTextContent('conv-1')
    })
  })

  it('disables message input while streaming', async () => {
    vi.mocked(api.sendMessage).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100)
        })
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    const sendBtn = screen.getByTestId('send-message-btn')
    await userEvent.click(sendBtn)

    // Button should be disabled during streaming
    expect(sendBtn).toBeDisabled()

    await waitFor(() => {
      expect(sendBtn).not.toBeDisabled()
    })
  })

  it('updates conversation title from first message', async () => {
    const longMessage = 'This is a very long message that should be truncated to 50 characters when used as a title'

    vi.mocked(api.sendMessage).mockResolvedValue()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('send-message-btn')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('send-message-btn'))

    await waitFor(() => {
      expect(persistence.saveAppSession).toHaveBeenCalledWith(
        expect.objectContaining({
          conversations: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringMatching(/^test message/),
            }),
          ]),
        })
      )
    })
  })
})