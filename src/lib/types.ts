export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  error?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export type ProviderType = 'openai' | 'z-ai' | 'copilot' | 'localhost' | 'custom'

export interface ModelConfig {
  provider: ProviderType
  apiEndpoint: string
  modelName: string
  apiKey: string
  temperature?: number
  maxTokens?: number
}

export interface ProviderPreset {
  name: string
  type: ProviderType
  endpoint: string
  defaultModel: string
  requiresApiKey: boolean
  description: string
  models?: string[]
}
