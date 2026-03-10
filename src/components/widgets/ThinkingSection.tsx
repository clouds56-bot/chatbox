import { useState, useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Brain, CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { marked } from 'marked'

interface ThinkingSectionProps {
  thinking: string
  isStreaming?: boolean
  hasContent?: boolean
}

export function ThinkingSection({ thinking, isStreaming, hasContent }: ThinkingSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!hasContent && thinking) {
      setIsOpen(true)
    } else if (hasContent && !isStreaming) {
      setIsOpen(false)
    }
  }, [hasContent, thinking, isStreaming])

  if (!thinking) return null

  const renderThinking = () => {
    try {
      const html = marked.parse(thinking, { async: false }) as string
      return <div className="text-sm text-muted-foreground markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
    } catch {
      return <div className="text-sm text-muted-foreground whitespace-pre-wrap">{thinking}</div>
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'bg-accent/50 hover:bg-accent/70 text-accent-foreground',
            'transition-colors duration-150 group w-full'
          )}
        >
          <Brain size={16} weight="duotone" className="text-primary" />
          <span className="font-medium">Thinking</span>
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs"
            >
              ...
            </motion.span>
          )}
          <CaretDown
            size={16}
            className={cn(
              'ml-auto transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
          {renderThinking()}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
