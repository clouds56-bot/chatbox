import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ModelCheckboxProps {
  model: string
  checked: boolean
  onToggle: () => void
}

export function ModelCheckbox({ model, checked, onToggle }: ModelCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={`model-${model}`}
        checked={checked}
        onCheckedChange={onToggle}
      />
      <Label 
        htmlFor={`model-${model}`} 
        className="text-sm font-normal cursor-pointer flex-1"
      >
        {model}
      </Label>
    </div>
  )
}
