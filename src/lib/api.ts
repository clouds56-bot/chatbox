import { ModelConfig } from './types'
import { getAuthorizationHeader } from './oauth'

export async function sendMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  config: ModelConfig,
  onToken: (token: string) => void
): Promise<void> {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ]

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (config.authMethod === 'api-key' && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  } else if (config.authMethod === 'oauth' && config.oauthToken) {
    headers['Authorization'] = getAuthorizationHeader(config.oauthToken)
  }

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.modelName,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
      stream: true
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response body')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.trim() !== '')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            onToken(content)
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
        }
      }
    }
  }
}
