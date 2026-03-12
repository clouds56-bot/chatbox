import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CaretDown, CheckCircle } from '@phosphor-icons/react'
import { MODES } from '@/lib/modes'
import { ModeType } from '@/lib/types'

interface ModeSelectorProps {
  selectedMode: ModeType
  onSelect: (mode: ModeType) => void
  disabled?: boolean
}

const modeOrder: ModeType[] = ['ask', 'chat', 'research']

export function ModeSelector({ selectedMode, onSelect, disabled }: ModeSelectorProps) {
  const selectedLabel = MODES[selectedMode].label

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-accent/20"
          disabled={disabled}
        >
          <span className="font-medium">{selectedLabel}</span>
          <CaretDown className="ml-2 w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[75vw] max-w-64 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 sticky top-0 bg-popover">
            Select Mode
          </p>
          {modeOrder.map((mode) => (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedMode === mode
                  ? 'bg-accent/20'
                  : 'hover:bg-accent/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{MODES[mode].label}</p>
                  <p className="text-xs text-muted-foreground truncate">{mode}</p>
                </div>
                {selectedMode === mode && (
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
