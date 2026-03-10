import { Message, EndpointConfig } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { MessageAvatar } from '@/components/widgets/MessageAvatar'
import { MessageMetadata } from '@/components/widgets/MessageMetadata'
import { MessageContent } from '@/components/widgets/MessageContent'
import { ThinkingSection } from '@/components/widgets/ThinkingSection'

interface MessageBubbleProps {
  message: Message
  endpoint?: EndpointConfig
}

export function MessageBubble({ message, endpoint }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('flex gap-4 w-full', isUser && 'flex-row-reverse')}
    >
      <MessageAvatar isUser={isUser} />

      <div className="flex flex-col gap-2 max-w-[85%]">
        {!isUser && <MessageMetadata endpoint={endpoint} />}
        {!isUser && message.thinking && (
          <ThinkingSection 
            thinking={message.thinking} 
            isStreaming={message.isThinkingStreaming}
            hasContent={!!message.content}
          />
        )}
        <MessageContent
          content={message.content}
          isUser={isUser}
          isError={message.error}
          isStreaming={message.isStreaming}
        />
      </div>
    </motion.div>
  )
}
