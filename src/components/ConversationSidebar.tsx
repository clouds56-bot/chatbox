import { Conversation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, TrashSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
    <div className="w-64 border-r border-border bg-muted flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewConversation}
          className="w-full bg-primary hover:bg-primary/90 gap-2"
        >
          <Plus weight="bold" className="w-5 h-5" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <Button
                variant="ghost"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  'w-full justify-start text-left h-auto py-3 px-3 hover:bg-background/60',
                  currentConversationId === conversation.id &&
                    'bg-background border-l-2 border-accent'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conversation.id)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
              >
                <TrashSimple weight="bold" className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
