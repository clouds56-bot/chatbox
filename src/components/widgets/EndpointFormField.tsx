import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EndpointFormFieldProps {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
  step?: string
}

export function EndpointFormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  min,
  max,
  step
}: EndpointFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background border-input"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}
