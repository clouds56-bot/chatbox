import { useState, useEffect } from 'react'
import { ModelConfig, ProviderType } from '@/lib/types'
import { PROVIDER_PRESETS, getProviderPreset } from '@/lib/providers'
import { initiateGitHubOAuth, isTokenExpired } from '@/lib/oauth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GithubLogo, Check, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'

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
        authMethod: preset.authMethod,
        apiKey: preset.authMethod === 'none' ? '' : localConfig.apiKey,
        oauthToken: preset.authMethod === 'oauth' ? localConfig.oauthToken : undefined
      })
    }
  }

  const handleGitHubOAuth = async () => {
    try {
      await initiateGitHubOAuth()
    } catch (error) {
      toast.error('Failed to initiate GitHub OAuth')
      console.error(error)
    }
  }

  const currentPreset = getProviderPreset(localConfig.provider)
  const isCustomProvider = localConfig.provider === 'custom'
  const isOAuthProvider = currentPreset?.authMethod === 'oauth'
  const showApiKeyField = currentPreset?.authMethod === 'api-key'
  const isAuthenticated = isOAuthProvider 
    ? !!localConfig.oauthToken 
    : (showApiKeyField ? !!localConfig.apiKey : true)

  const tokenExpired = localConfig.oauthToken ? isTokenExpired(localConfig.oauthToken) : false
  const tokenExpiresAt = localConfig.oauthToken?.expiresAt
  const timeUntilExpiry = tokenExpiresAt ? tokenExpiresAt - Date.now() : null
  const hoursUntilExpiry = timeUntilExpiry ? Math.floor(timeUntilExpiry / (1000 * 60 * 60)) : null

  const handleSave = () => {
    onSave(localConfig)
    onOpenChange(false)
  }

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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{preset.name}</span>
                        {preset.supportsOAuth && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            OAuth
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOAuthProvider && (
            <div className="space-y-3">
              <Label>Authentication</Label>
              {isAuthenticated ? (
                <>
                  <div className={`flex items-center gap-2 p-3 border rounded-md ${
                    tokenExpired 
                      ? 'bg-destructive/10 border-destructive' 
                      : 'bg-accent/10 border-accent'
                  }`}>
                    <Check weight="bold" className={`w-5 h-5 ${
                      tokenExpired ? 'text-destructive' : 'text-accent'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {tokenExpired ? 'Token Expired' : 'Connected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You're authenticated with GitHub
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocalConfig({ ...localConfig, oauthToken: undefined })}
                    >
                      Disconnect
                    </Button>
                  </div>
                  {!tokenExpired && tokenExpiresAt && hoursUntilExpiry !== null && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Token expires in {hoursUntilExpiry > 0 ? `${hoursUntilExpiry}h` : '<1h'} 
                        {localConfig.oauthToken?.refreshToken && ' • Auto-refresh enabled'}
                      </p>
                    </div>
                  )}
                  {tokenExpired && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                      <p className="text-xs text-destructive">
                        Token expired. Please reconnect or wait for auto-refresh to complete.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleGitHubOAuth}
                  className="w-full bg-[#24292e] hover:bg-[#1a1e22] text-white"
                >
                  <GithubLogo weight="fill" className="w-5 h-5 mr-2" />
                  Connect with GitHub
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                GitHub OAuth is required to use GitHub Copilot API
              </p>
            </div>
          )}

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
