import { ModeConfig, ModeType } from './types'

export const MODES: Record<ModeType, ModeConfig> = {
  ask: {
    id: 'ask',
    label: 'Ask',
    systemPrompt:
      'You are a precise assistant. Answer directly, keep responses concise, and prioritize clear actionable guidance.',
    tools: []
  },
  chat: {
    id: 'chat',
    label: 'Chat',
    systemPrompt:
      'You are a friendly assistant. Be conversational, helpful, and clear while keeping responses grounded in the user context.',
    tools: []
  },
  research: {
    id: 'research',
    label: 'Research',
    systemPrompt:
      'You are a research assistant with access to workspace file tools. Inspect the codebase before answering, use tools when details are missing, and provide structured analysis with concise supporting rationale.',
    tools: [
      {
        id: 'fs:list',
        name: 'fs:list',
        description: 'List files and directories inside the workspace.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            recursive: { type: 'boolean' },
            limit: { type: 'integer' }
          },
          required: ['path'],
          additionalProperties: false
        }
      },
      {
        id: 'fs:read',
        name: 'fs:read',
        description: 'Read lines from a workspace file.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            offset: { type: 'integer' },
            limit: { type: 'integer' }
          },
          required: ['path'],
          additionalProperties: false
        }
      },
      {
        id: 'fs:grep',
        name: 'fs:grep',
        description: 'Search workspace file contents with a regex pattern.',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            path: { type: 'string' },
            include: { type: 'string' },
            limit: { type: 'integer' }
          },
          required: ['pattern', 'path'],
          additionalProperties: false
        }
      }
    ]
  }
}

export const DEFAULT_MODE: ModeType = 'chat'

export function getModeConfig(mode: ModeType): ModeConfig {
  return MODES[mode]
}

export function isModeType(value: string): value is ModeType {
  return value === 'ask' || value === 'chat' || value === 'research'
}
