import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaperPlaneRight, CaretDown } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from '@phosphor-icons/react'

interface MessageInputProps {
  onSend: (message: string, endpointId: string) => void
  disabled?: boolean
  endpoints: EndpointConfig[]
  selectedEndpointId: string | null
  onEndpointChange: (endpointId: string) => void
}

export function MessageInput({ onSend, disabled, endpoints, selectedEndpointId, onEndpointChange }: MessageInputProps) {
  const [input, setInput] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints.find(e => e.isDefault) || endpoints[0]

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed && !disabled && selectedEndpoint) {
      onSend(trimmed, selectedEndpoint.id)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleEndpointSelect = (endpointId: string) => {
    onEndpointChange(endpointId)
    setPopoverOpen(false)
  }

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex gap-3 items-end p-4">
        <div className="flex-1 space-y-2">
          {endpoints.length > 1 && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-accent/20"
                  disabled={disabled}
                >
                  <span className="font-medium">{selectedEndpoint?.name || 'Select Model'}</span>
                  <span className="mx-1.5 text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedEndpoint?.modelName}</span>
                  <CaretDown className="ml-2 w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Select Endpoint</p>
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => handleEndpointSelect(endpoint.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedEndpoint?.id === endpoint.id
                          ? 'bg-accent/20'
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{endpoint.name}</p>
                            {endpoint.isDefault && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
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
          )}
          <Textarea
            id="message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled || !selectedEndpoint}
            className="min-h-[60px] max-h-[200px] resize-none bg-card border-input focus-visible:ring-accent"
            rows={1}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled || !selectedEndpoint}
          size="icon"
          className="h-[60px] w-[60px] flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <PaperPlaneRight weight="bold" className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
