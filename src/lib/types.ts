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

export interface ModelConfig {
  apiEndpoint: string
  modelName: string
  apiKey: string
  temperature?: number
  maxTokens?: number
}
