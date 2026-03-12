import { EndpointConfig, ToolLoopResponse } from './types'
import { getAuthorizationHeader } from './oauth'
import { getModeConfig } from './modes'
import { ModeType } from './types'

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

export async function sendMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  config: EndpointConfig,
  mode: ModeType,
  onToken: (token: string, type?: 'content' | 'thinking') => void
): Promise<void> {
  const modeConfig = getModeConfig(mode)

  const messages = [
    { role: 'system', content: modeConfig.systemPrompt },
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

  const shouldUseToolLoop = modeConfig.tools.some(tool => tool.name.startsWith('fs:'))

  if (shouldUseToolLoop) {
    const response = await tauriInvoke<ToolLoopResponse>('execute_tool_loop', {
      request: {
        apiEndpoint: config.apiEndpoint,
        model: config.modelName,
        headers,
        body: {
          model: config.modelName,
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 2000,
          stream: false
        },
        tools: modeConfig.tools,
        maxIterations: 6,
        maxToolCalls: 12
      }
    })

    if (response.reasoning) {
      onToken(response.reasoning, 'thinking')
    }
    if (response.content) {
      onToken(response.content, 'content')
    }
    return
  }

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.modelName,
      messages,
      tools: modeConfig.tools,
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
          const thinking = parsed.choices?.[0]?.delta?.thinking
          const reasoningContent = parsed.choices?.[0]?.delta?.reasoning_content
          
          if (thinking) {
            onToken(thinking, 'thinking')
          }
          if (reasoningContent) {
            onToken(reasoningContent, 'thinking')
          }
          if (content) {
            onToken(content, 'content')
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
        }
      }
    }
  }
}
