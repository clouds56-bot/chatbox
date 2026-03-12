import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationSidebar } from './ConversationSidebar'
import { Conversation } from '@/lib/types'

// Mock the child components
vi.mock('@/components/widgets/NewChatButton', () => ({
  NewChatButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="new-chat-button">
      New Chat
    </button>
  ),
}))

vi.mock('@/components/widgets/ConversationListItem', () => ({
  ConversationListItem: ({
    conversation,
    isActive,
    onSelect,
    onDelete,
  }: {
    conversation: Conversation
    isActive: boolean
    onSelect: () => void
    onDelete: () => void
  }) => (
    <div data-testid={`conversation-item-${conversation.id}`}>
      <button onClick={onSelect} data-testid={`select-${conversation.id}`}>
        {conversation.title}
      </button>
      <button onClick={onDelete} data-testid={`delete-${conversation.id}`}>
        Delete
      </button>
      {isActive && <span data-testid={`active-${conversation.id}`}>Active</span>}
    </div>
  ),
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="scroll-area">
      {children}
    </div>
  ),
}))

describe('ConversationSidebar', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      title: 'First Conversation',
      mode: 'chat',
      messages: [],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'conv-2',
      title: 'Second Conversation',
      mode: 'ask',
      messages: [],
      createdAt: Date.now() - 1800000,
      updatedAt: Date.now() - 1800000,
    },
    {
      id: 'conv-3',
      title: 'Third Conversation',
      mode: 'research',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  it('renders without crashing', () => {
    const { container } = render(
      <ConversationSidebar
        conversations={[]}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )
    expect(container).toBeTruthy()
  })

  it('renders the NewChatButton', () => {
    render(
      <ConversationSidebar
        conversations={[]}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )
    expect(screen.getByTestId('new-chat-button')).toBeInTheDocument()
  })

  it('calls onNewConversation when new chat button is clicked', async () => {
    const user = userEvent.setup()
    const onNewConversation = vi.fn()

    render(
      <ConversationSidebar
        conversations={[]}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={onNewConversation}
        onDeleteConversation={vi.fn()}
      />
    )

    await user.click(screen.getByTestId('new-chat-button'))
    expect(onNewConversation).toHaveBeenCalledTimes(1)
  })

  it('renders all conversations', () => {
    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-item-conv-2')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-item-conv-3')).toBeInTheDocument()
  })

  it('renders empty state when no conversations', () => {
    const { container } = render(
      <ConversationSidebar
        conversations={[]}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toBeInTheDocument()
    // No conversation items should be present
    expect(container.querySelectorAll('[data-testid^="conversation-item-"]')).toHaveLength(0)
  })

  it('marks the current conversation as active', () => {
    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-2"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByTestId('active-conv-2')).toBeInTheDocument()
    expect(screen.queryByTestId('active-conv-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('active-conv-3')).not.toBeInTheDocument()
  })

  it('calls onSelectConversation with correct id when conversation is clicked', async () => {
    const user = userEvent.setup()
    const onSelectConversation = vi.fn()

    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId={null}
        onSelectConversation={onSelectConversation}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    await user.click(screen.getByTestId('select-conv-2'))
    expect(onSelectConversation).toHaveBeenCalledWith('conv-2')
    expect(onSelectConversation).toHaveBeenCalledTimes(1)
  })

  it('calls onDeleteConversation with correct id when delete is clicked', async () => {
    const user = userEvent.setup()
    const onDeleteConversation = vi.fn()

    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-1"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={onDeleteConversation}
      />
    )

    await user.click(screen.getByTestId('delete-conv-3'))
    expect(onDeleteConversation).toHaveBeenCalledWith('conv-3')
    expect(onDeleteConversation).toHaveBeenCalledTimes(1)
  })

  it('renders conversations with correct props', () => {
    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-1"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByText('First Conversation')).toBeInTheDocument()
    expect(screen.getByText('Second Conversation')).toBeInTheDocument()
    expect(screen.getByText('Third Conversation')).toBeInTheDocument()
  })

  it('handles clicking different conversations sequentially', async () => {
    const user = userEvent.setup()
    const onSelectConversation = vi.fn()

    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-1"
        onSelectConversation={onSelectConversation}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    await user.click(screen.getByTestId('select-conv-2'))
    expect(onSelectConversation).toHaveBeenCalledWith('conv-2')

    await user.click(screen.getByTestId('select-conv-3'))
    expect(onSelectConversation).toHaveBeenCalledWith('conv-3')

    expect(onSelectConversation).toHaveBeenCalledTimes(2)
  })

  it('handles null currentConversationId', () => {
    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    // None should be marked as active
    expect(screen.queryByTestId('active-conv-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('active-conv-2')).not.toBeInTheDocument()
    expect(screen.queryByTestId('active-conv-3')).not.toBeInTheDocument()
  })

  it('handles single conversation', () => {
    const singleConversation = [mockConversations[0]]

    render(
      <ConversationSidebar
        conversations={singleConversation}
        currentConversationId="conv-1"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument()
    expect(screen.getByTestId('active-conv-1')).toBeInTheDocument()
    expect(screen.queryByTestId('conversation-item-conv-2')).not.toBeInTheDocument()
  })

  it('renders with large number of conversations', () => {
    const manyConversations: Conversation[] = Array.from({ length: 50 }, (_, i) => ({
      id: `conv-${i}`,
      title: `Conversation ${i}`,
      mode: 'chat' as const,
      messages: [],
      createdAt: Date.now() - i * 1000,
      updatedAt: Date.now() - i * 1000,
    }))

    render(
      <ConversationSidebar
        conversations={manyConversations}
        currentConversationId="conv-25"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByTestId('conversation-item-conv-0')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-item-conv-25')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-item-conv-49')).toBeInTheDocument()
    expect(screen.getByTestId('active-conv-25')).toBeInTheDocument()
  })

  it('maintains proper structure with border and background classes', () => {
    const { container } = render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-1"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    const mainDiv = container.querySelector('.h-full.w-full.border-r')
    expect(mainDiv).toBeInTheDocument()
  })

  it('handles conversation with empty title gracefully', () => {
    const conversationWithEmptyTitle: Conversation[] = [
      {
        id: 'conv-empty',
        title: '',
        mode: 'chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]

    render(
      <ConversationSidebar
        conversations={conversationWithEmptyTitle}
        currentConversationId="conv-empty"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />
    )

    expect(screen.getByTestId('conversation-item-conv-empty')).toBeInTheDocument()
  })

  it('does not call callbacks when not interacted with', () => {
    const onSelectConversation = vi.fn()
    const onNewConversation = vi.fn()
    const onDeleteConversation = vi.fn()

    render(
      <ConversationSidebar
        conversations={mockConversations}
        currentConversationId="conv-1"
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
      />
    )

    expect(onSelectConversation).not.toHaveBeenCalled()
    expect(onNewConversation).not.toHaveBeenCalled()
    expect(onDeleteConversation).not.toHaveBeenCalled()
  })
})