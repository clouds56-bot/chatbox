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
      'You are a research assistant. Provide structured analysis, note assumptions, compare alternatives, and include concise supporting rationale.',
    tools: [
      {
        id: 'synthesis',
        name: 'Synthesis',
        description: 'Break complex questions into key findings and recommendations.'
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
