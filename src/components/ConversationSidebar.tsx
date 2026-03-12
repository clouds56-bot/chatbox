import { Conversation } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewChatButton } from '@/components/widgets/NewChatButton'
import { ConversationListItem } from '@/components/widgets/ConversationListItem'

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  return (
    <div className="h-full w-full border-r border-border bg-muted flex flex-col">
      <div className="p-3 border-b border-border">
        <NewChatButton onClick={onNewConversation} />
      </div>
      
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={currentConversationId === conversation.id}
              onSelect={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
