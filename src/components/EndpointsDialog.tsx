import { useState } from 'react'
import { EndpointConfig, ProviderType } from '@/lib/types'
import { PROVIDER_PRESETS, getProviderPreset } from '@/lib/providers'
import { initiateGitHubOAuth, isTokenExpired } from '@/lib/oauth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { GithubLogo, Check, Clock, Trash, Plus, PencilSimple, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface EndpointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoints: EndpointConfig[]
  onSave: (endpoints: EndpointConfig[]) => void
}

export function EndpointsDialog({ open, onOpenChange, endpoints, onSave }: EndpointsDialogProps) {
  const [localEndpoints, setLocalEndpoints] = useState<EndpointConfig[]>(endpoints)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EndpointConfig | null>(null)

  const handleAddNew = () => {
    const newEndpoint: EndpointConfig = {
      id: uuidv4(),
      name: 'New Endpoint',
      provider: 'openai',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      modelName: 'gpt-4o',
      apiKey: '',
      authMethod: 'api-key',
      temperature: 0.7,
      maxTokens: 2000,
      isDefault: localEndpoints.length === 0
    }
    setEditForm(newEndpoint)
    setEditingId(newEndpoint.id)
  }

  const handleEdit = (endpoint: EndpointConfig) => {
    setEditForm({ ...endpoint })
    setEditingId(endpoint.id)
  }

  const handleDelete = (id: string) => {
    const newEndpoints = localEndpoints.filter(e => e.id !== id)
    if (newEndpoints.length > 0 && !newEndpoints.some(e => e.isDefault)) {
      newEndpoints[0].isDefault = true
    }
    setLocalEndpoints(newEndpoints)
  }

  const handleSetDefault = (id: string) => {
    setLocalEndpoints(localEndpoints.map(e => ({
      ...e,
      isDefault: e.id === id
    })))
  }

  const handleProviderChange = (providerType: ProviderType) => {
    if (!editForm) return
    const preset = getProviderPreset(providerType)
    if (preset) {
      setEditForm({
        ...editForm,
        provider: preset.type,
        apiEndpoint: preset.endpoint,
        modelName: preset.defaultModel,
        authMethod: preset.authMethod,
        apiKey: preset.authMethod === 'none' ? '' : editForm.apiKey,
        oauthToken: preset.authMethod === 'oauth' ? editForm.oauthToken : undefined
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

  const handleSaveEdit = () => {
    if (!editForm) return

    const isNew = !localEndpoints.some(e => e.id === editForm.id)
    if (isNew) {
      setLocalEndpoints([...localEndpoints, editForm])
    } else {
      setLocalEndpoints(localEndpoints.map(e => e.id === editForm.id ? editForm : e))
    }
    setEditForm(null)
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditForm(null)
    setEditingId(null)
  }

  const handleSaveAll = () => {
    if (localEndpoints.length === 0) {
      toast.error('Add at least one endpoint')
      return
    }
    onSave(localEndpoints)
    onOpenChange(false)
    toast.success('Endpoints saved')
  }

  const currentPreset = editForm ? getProviderPreset(editForm.provider) : null
  const isCustomProvider = editForm?.provider === 'custom'
  const isOAuthProvider = currentPreset?.authMethod === 'oauth'
  const showApiKeyField = currentPreset?.authMethod === 'api-key'
  const isAuthenticated = editForm && (isOAuthProvider 
    ? !!editForm.oauthToken 
    : (showApiKeyField ? !!editForm.apiKey : true))

  const tokenExpired = editForm?.oauthToken ? isTokenExpired(editForm.oauthToken) : false
  const tokenExpiresAt = editForm?.oauthToken?.expiresAt
  const timeUntilExpiry = tokenExpiresAt ? tokenExpiresAt - Date.now() : null
  const hoursUntilExpiry = timeUntilExpiry ? Math.floor(timeUntilExpiry / (1000 * 60 * 60)) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Manage Endpoints</DialogTitle>
          <DialogDescription>
            Add multiple model endpoints and switch between them when sending messages
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          <div className="w-64 border-r border-border pr-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Your Endpoints</h3>
              <Button size="sm" variant="ghost" onClick={handleAddNew}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {localEndpoints.map((endpoint) => (
                  <Card
                    key={endpoint.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      editingId === endpoint.id 
                        ? 'bg-accent/20 border-accent' 
                        : 'hover:bg-accent/10'
                    }`}
                    onClick={() => handleEdit(endpoint)}
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
                          handleDelete(endpoint.id)
                        }}
                      >
                        <Trash className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {localEndpoints.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No endpoints yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <ScrollArea className="flex-1">
            {editForm ? (
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint-name">Endpoint Name</Label>
                  <Input
                    id="endpoint-name"
                    placeholder="My Custom Endpoint"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-background border-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={editForm.provider} onValueChange={handleProviderChange}>
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
                            onClick={() => setEditForm({ ...editForm, oauthToken: undefined })}
                          >
                            Disconnect
                          </Button>
                        </div>
                        {!tokenExpired && tokenExpiresAt && hoursUntilExpiry !== null && (
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Token expires in {hoursUntilExpiry > 0 ? `${hoursUntilExpiry}h` : '<1h'} 
                              {editForm.oauthToken?.refreshToken && ' • Auto-refresh enabled'}
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
                  </div>
                )}

                <Separator className="bg-border" />

                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    type="url"
                    placeholder="https://api.openai.com/v1/chat/completions"
                    value={editForm.apiEndpoint}
                    onChange={(e) => setEditForm({ ...editForm, apiEndpoint: e.target.value })}
                    className="bg-background border-input"
                    disabled={!isCustomProvider}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  {currentPreset?.models && currentPreset.models.length > 0 && !isCustomProvider ? (
                    <Select 
                      value={editForm.modelName} 
                      onValueChange={(value) => setEditForm({ ...editForm, modelName: value })}
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
                      value={editForm.modelName}
                      onChange={(e) => setEditForm({ ...editForm, modelName: e.target.value })}
                      className="bg-background border-input"
                    />
                  )}
                </div>

                {showApiKeyField && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="sk-..."
                      value={editForm.apiKey}
                      onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                      className="bg-background border-input"
                    />
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
                      value={editForm.temperature ?? 0.7}
                      onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
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
                      value={editForm.maxTokens ?? 2000}
                      onChange={(e) => setEditForm({ ...editForm, maxTokens: parseInt(e.target.value) })}
                      className="bg-background border-input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={editForm.isDefault || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSetDefault(editForm.id)
                        setEditForm({ ...editForm, isDefault: true })
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is-default" className="text-sm cursor-pointer">
                    Set as default endpoint
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} className="flex-1 bg-primary hover:bg-primary/90">
                    <Check className="w-4 h-4 mr-2" />
                    Save Endpoint
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div className="space-y-2">
                  <PencilSimple className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-sm">Select an endpoint to edit or add a new one</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} className="bg-primary hover:bg-primary/90">
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
