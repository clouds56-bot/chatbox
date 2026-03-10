import { useState, useEffect } from 'react'
import { ModelConfig, ProviderType } from '@/lib/types'
import { PROVIDER_PRESETS, getProviderPreset } from '@/lib/providers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ModelConfig
  onSave: (config: ModelConfig) => void
}

export function SettingsDialog({ open, onOpenChange, config, onSave }: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleProviderChange = (providerType: ProviderType) => {
    const preset = getProviderPreset(providerType)
    if (preset) {
      setLocalConfig({
        ...localConfig,
        provider: preset.type,
        apiEndpoint: preset.endpoint,
        modelName: preset.defaultModel,
        apiKey: providerType === 'localhost' ? '' : localConfig.apiKey
      })
    }
  }

  const currentPreset = getProviderPreset(localConfig.provider)
  const isCustomProvider = localConfig.provider === 'custom'

  const handleSave = () => {
    onSave(localConfig)
    onOpenChange(false)
  }

  const showApiKeyField = !currentPreset || currentPreset.requiresApiKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Model Configuration</DialogTitle>
          <DialogDescription>
            Choose a provider and configure your API settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={localConfig.provider} onValueChange={handleProviderChange}>
              <SelectTrigger id="provider" className="bg-background border-input">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_PRESETS.map((preset) => (
                  <SelectItem key={preset.type} value={preset.type}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <Label htmlFor="api-endpoint">API Endpoint</Label>
            <Input
              id="api-endpoint"
              type="url"
              placeholder="https://api.openai.com/v1/chat/completions"
              value={localConfig.apiEndpoint}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, apiEndpoint: e.target.value })
              }
              className="bg-background border-input"
              disabled={!isCustomProvider}
            />
            <p className="text-xs text-muted-foreground">
              {isCustomProvider ? 'Full URL to the chat completions endpoint' : 'Preset endpoint for selected provider'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-name">Model Name</Label>
            {currentPreset?.models && currentPreset.models.length > 0 && !isCustomProvider ? (
              <Select 
                value={localConfig.modelName} 
                onValueChange={(value) => setLocalConfig({ ...localConfig, modelName: value })}
              >
                <SelectTrigger id="model-name" className="bg-background border-input">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {currentPreset.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="model-name"
                placeholder="gpt-4"
                value={localConfig.modelName}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, modelName: e.target.value })
                }
                className="bg-background border-input"
              />
            )}
            <p className="text-xs text-muted-foreground">
              The model identifier
            </p>
          </div>

          {showApiKeyField && (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={localConfig.apiKey}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, apiKey: e.target.value })
                }
                className="bg-background border-input"
              />
              <p className="text-xs text-muted-foreground">
                Your API key (stored locally in your browser)
              </p>
            </div>
          )}

          <Separator className="bg-border" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={localConfig.temperature ?? 0.7}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    temperature: parseFloat(e.target.value)
                  })
                }
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min="1"
                max="4096"
                value={localConfig.maxTokens ?? 2000}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    maxTokens: parseInt(e.target.value)
                  })
                }
                className="bg-background border-input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
