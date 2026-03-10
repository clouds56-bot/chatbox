import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CaretDown, CheckCircle } from '@phosphor-icons/react'

interface ModelSelectorProps {
  models: string[]
  selectedModel: string
  onSelect: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ models, selectedModel, onSelect, disabled }: ModelSelectorProps) {
  if (models.length <= 1) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-accent/20"
          disabled={disabled}
        >
          <span className="text-muted-foreground">{selectedModel}</span>
          <CaretDown className="ml-2 w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[75vw] max-w-64 p-2" align="start">
        <div className="space-y-1 max-h-[40vh] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 sticky top-0 bg-popover">Select Model</p>
          {models.map((model) => (
            <button
              key={model}
              onClick={() => onSelect(model)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedModel === model
                  ? 'bg-accent/20'
                  : 'hover:bg-accent/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate">{model}</p>
                {selectedModel === model && (
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
