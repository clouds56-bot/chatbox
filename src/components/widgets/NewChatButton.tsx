import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react'

interface NewChatButtonProps {
  onClick: () => void
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="w-full bg-primary hover:bg-primary/90 gap-2"
    >
      <Plus weight="bold" className="w-5 h-5" />
      New Chat
    </Button>
  )
}
