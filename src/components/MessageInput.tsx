import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaperPlaneRight } from '@phosphor-icons/react'
import { EndpointConfig } from '@/lib/types'
import { EndpointSelector } from '@/components/widgets/EndpointSelector'
import { ModelSelector } from '@/components/widgets/ModelSelector'
import { ModeSelector } from '@/components/widgets/ModeSelector'
import { ModeType } from '@/lib/types'

interface MessageInputProps {
  onSend: (message: string, endpointId: string, modelName?: string, mode?: ModeType) => void
  disabled?: boolean
  endpoints: EndpointConfig[]
  selectedEndpointId: string | null
  onEndpointChange: (endpointId: string) => void
  selectedMode: ModeType
  onModeChange: (mode: ModeType) => void
  modeLocked?: boolean
}

export function MessageInput({
  onSend,
  disabled,
  endpoints,
  selectedEndpointId,
  onEndpointChange,
  selectedMode,
  onModeChange,
  modeLocked
}: MessageInputProps) {
  const [input, setInput] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints.find(e => e.isDefault) || endpoints[0]
  
  const enabledModels = selectedEndpoint?.enabledModels || selectedEndpoint?.availableModels || []
  const currentModel = selectedModel || selectedEndpoint?.modelName

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed && !disabled && selectedEndpoint) {
      onSend(trimmed, selectedEndpoint.id, currentModel, selectedMode)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleEndpointChange = (endpointId: string) => {
    onEndpointChange(endpointId)
    setSelectedModel(null)
  }

  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col gap-2 p-3 md:p-4">
        <div className="flex gap-2">
          <ModeSelector
            selectedMode={selectedMode}
            onSelect={onModeChange}
            disabled={disabled || modeLocked}
          />
          <EndpointSelector
            endpoints={endpoints}
            selectedEndpoint={selectedEndpoint}
            onSelect={handleEndpointChange}
            disabled={disabled}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
          />
          <ModelSelector
            models={enabledModels}
            selectedModel={currentModel || ''}
            onSelect={handleModelSelect}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            id="message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled || !selectedEndpoint}
            className="min-h-[60px] max-h-[200px] resize-none bg-card border-input focus-visible:ring-accent flex-1"
            rows={1}
          />
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
    </div>
  )
}
