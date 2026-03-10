import { Button } from '@/components/ui/button'
import { ListBullets, List } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'

interface ChatHeaderProps {
  title: string
  endpoint?: EndpointConfig
  onSettingsClick: () => void
  onMenuClick?: () => void
}

export function ChatHeader({ title, endpoint, onSettingsClick, onMenuClick }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hover:bg-accent/20 flex-shrink-0"
          >
            <List weight="bold" className="w-5 h-5" />
          </Button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {endpoint ? `${endpoint.name} • ${endpoint.modelName}` : 'No endpoint configured'}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        className="hover:bg-accent/20 flex-shrink-0"
      >
        <ListBullets weight="bold" className="w-5 h-5" />
      </Button>
    </div>
  )
}
