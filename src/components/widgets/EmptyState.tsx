import { Button } from '@/components/ui/button'
import { ListBullets } from '@phosphor-icons/react'

interface EmptyStateProps {
  type: 'no-endpoints' | 'no-messages'
  endpointName?: string
  onConfigureClick?: () => void
}

export function EmptyState({ type, endpointName, onConfigureClick }: EmptyStateProps) {
  if (type === 'no-endpoints') {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Configure an endpoint
          </h2>
          <p className="text-muted-foreground text-lg">
            Add at least one model endpoint to start chatting
          </p>
          {onConfigureClick && (
            <Button
              onClick={onConfigureClick}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              <ListBullets weight="bold" className="w-4 h-4 mr-2" />
              Manage Endpoints
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-[60vh] text-center">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-foreground">
          Start a conversation
        </h2>
        <p className="text-muted-foreground text-lg">
          Send a message to begin chatting with {endpointName || 'your selected model'}
        </p>
      </div>
    </div>
  )
}
