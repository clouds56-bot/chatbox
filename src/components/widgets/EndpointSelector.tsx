import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CaretDown, CheckCircle } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'

interface EndpointSelectorProps {
  endpoints: EndpointConfig[]
  selectedEndpoint: EndpointConfig | undefined
  onSelect: (endpointId: string) => void
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EndpointSelector({
  endpoints,
  selectedEndpoint,
  onSelect,
  disabled,
  open,
  onOpenChange
}: EndpointSelectorProps) {
  if (endpoints.length <= 1) return null

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-accent/20"
          disabled={disabled}
        >
          <span className="font-medium">{selectedEndpoint?.name || 'Select Endpoint'}</span>
          <CaretDown className="ml-2 w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[85vw] max-w-80 p-2" align="start">
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 sticky top-0 bg-popover">Select Endpoint</p>
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              onClick={() => {
                onSelect(endpoint.id)
                onOpenChange?.(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedEndpoint?.id === endpoint.id
                  ? 'bg-accent/20'
                  : 'hover:bg-accent/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{endpoint.name}</p>
                    {endpoint.isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {endpoint.modelName}
                  </p>
                </div>
                {selectedEndpoint?.id === endpoint.id && (
                  <CheckCircle weight="fill" className="w-4 h-4 text-accent flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
