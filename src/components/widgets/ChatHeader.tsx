import { Button } from '@/components/ui/button'
import { ListBullets } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'

interface ChatHeaderProps {
  title: string
  endpoint?: EndpointConfig
  onSettingsClick: () => void
}

export function ChatHeader({ title, endpoint, onSettingsClick }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {endpoint ? `${endpoint.name} • ${endpoint.modelName}` : 'No endpoint configured'}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        className="hover:bg-accent/20"
      >
        <ListBullets weight="bold" className="w-5 h-5" />
      </Button>
    </div>
  )
}
