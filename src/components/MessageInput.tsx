import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-3 items-end p-4 border-t border-border bg-background/95 backdrop-blur-sm">
      <Textarea
        id="message-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none bg-card border-input focus-visible:ring-accent"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || disabled}
        size="icon"
        className="h-[60px] w-[60px] flex-shrink-0 bg-primary hover:bg-primary/90"
      >
        <PaperPlaneRight weight="bold" className="w-5 h-5" />
      </Button>
    </div>
  )
}
