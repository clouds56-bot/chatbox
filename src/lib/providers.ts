import { ProviderPreset } from './types'

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'OpenAI',
    type: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    authMethod: 'api-key',
    description: 'Official OpenAI API with GPT models',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    name: 'z.ai',
    type: 'z-ai',
    endpoint: 'https://api.z.ai/v1/chat/completions',
    defaultModel: 'z-1',
    requiresApiKey: true,
    authMethod: 'api-key',
    description: 'z.ai API endpoint',
    models: ['z-1', 'z-1-mini']
  },
  {
    name: 'GitHub Copilot',
    type: 'copilot',
    endpoint: 'https://api.githubcopilot.com/chat/completions',
    defaultModel: 'gpt-4',
    requiresApiKey: false,
    authMethod: 'oauth',
    supportsOAuth: true,
    description: 'GitHub Copilot Chat API (OAuth)',
    models: ['gpt-4', 'gpt-3.5-turbo']
  },
  {
    name: 'Localhost',
    type: 'localhost',
    endpoint: 'http://localhost:1234/v1/chat/completions',
    defaultModel: 'local-model',
    requiresApiKey: false,
    authMethod: 'none',
    description: 'Local LLM server (LM Studio, Ollama, etc.)',
    models: ['local-model']
  },
  {
    name: 'Custom',
    type: 'custom',
    endpoint: '',
    defaultModel: '',
    requiresApiKey: true,
    authMethod: 'api-key',
    description: 'Custom API endpoint',
    models: []
  }
]

export function getProviderPreset(type: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.type === type)
}
