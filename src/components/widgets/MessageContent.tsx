import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { marked } from 'marked'

interface MessageContentProps {
  content: string
  isUser: boolean
  isError?: boolean
  isStreaming?: boolean
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function MessageContent({ content, isUser, isError, isStreaming }: MessageContentProps) {
  const formattedContent = useMemo(() => {
    if (!content) return ''
    return marked.parse(content, { async: false }) as string
  }, [content])

  return (
    <Card
      className={cn(
        'p-4 break-words',
        isUser ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground',
        isError && 'border-destructive bg-destructive/10'
      )}
    >
      <div
        className="markdown-content text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
      {isStreaming && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 ml-1 bg-accent"
        />
      )}
    </Card>
  )
}
