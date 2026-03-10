import { Message } from '@/lib/types'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Robot, User } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { marked } from 'marked'

interface MessageBubbleProps {
  message: Message
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.error

  const formattedContent = useMemo(() => {
    if (!message.content) return ''
    return marked.parse(message.content, { async: false }) as string
  }, [message.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('flex gap-4 w-full', isUser && 'flex-row-reverse')}
    >
      <Avatar className={cn('w-8 h-8 flex-shrink-0', isUser ? 'bg-accent' : 'bg-primary')}>
        <div className="w-full h-full flex items-center justify-center">
          {isUser ? (
            <User weight="bold" className="w-5 h-5 text-accent-foreground" />
          ) : (
            <Robot weight="bold" className="w-5 h-5 text-primary-foreground" />
          )}
        </div>
      </Avatar>

      <Card
        className={cn(
          'p-4 max-w-[85%] break-words',
          isUser ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground',
          isError && 'border-destructive bg-destructive/10'
        )}
      >
        <div
          className="markdown-content text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        {message.isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 ml-1 bg-accent"
          />
        )}
      </Card>
    </motion.div>
  )
}
