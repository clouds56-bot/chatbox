import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SystemPromptPanelProps {
  modeLabel: string
  systemPrompt: string
}

export function SystemPromptPanel({ modeLabel, systemPrompt }: SystemPromptPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/70 bg-card/30 px-4 py-2 md:px-6">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>System Prompt ({modeLabel})</span>
            <CaretDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2">
            <Textarea
              value={systemPrompt}
              readOnly
              className="min-h-24 max-h-56 resize-y bg-background/70 text-xs leading-relaxed"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
