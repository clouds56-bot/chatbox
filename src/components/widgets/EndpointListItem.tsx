import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Trash } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'

interface EndpointListItemProps {
  endpoint: EndpointConfig
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
}

export function EndpointListItem({ endpoint, isEditing, onEdit, onDelete }: EndpointListItemProps) {
  return (
    <Card
      className={`p-3 cursor-pointer transition-colors ${
        isEditing 
          ? 'bg-accent/20 border-accent' 
          : 'hover:bg-accent/10'
      }`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate">{endpoint.name}</p>
            {endpoint.isDefault && (
              <CheckCircle weight="fill" className="w-3 h-3 text-accent flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {endpoint.modelName}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </Card>
  )
}
