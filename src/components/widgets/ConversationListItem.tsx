import { Conversation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { TrashSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ConversationListItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onDelete
}: ConversationListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <Button
        variant="ghost"
        onClick={onSelect}
        className={cn(
          'w-full justify-start text-left h-auto py-3 px-3 hover:bg-background/60',
          isActive && 'bg-background border-l-2 border-accent'
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
          onDelete()
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
      >
        <TrashSimple weight="bold" className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
