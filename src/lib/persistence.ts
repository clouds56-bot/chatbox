import { Conversation, EndpointConfig } from './types'

interface AppConfig {
  endpoints: EndpointConfig[]
  selectedEndpointId: string | null
}

interface AppSession {
  conversations: Conversation[]
  currentConversationId: string | null
}

const CONFIG_FALLBACK_KEY = 'chatbox.config'
const SESSION_FALLBACK_KEY = 'chatbox.session'

const EMPTY_CONFIG: AppConfig = {
  endpoints: [],
  selectedEndpointId: null
}

const EMPTY_SESSION: AppSession = {
  conversations: [],
  currentConversationId: null
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  return parseJson<T>(raw, fallback)
}

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const raw = await tauriInvoke<string>('load_config')
    const parsed = parseJson<Partial<AppConfig>>(raw, {})
    const config: AppConfig = {
      endpoints: Array.isArray(parsed.endpoints) ? parsed.endpoints : [],
      selectedEndpointId: typeof parsed.selectedEndpointId === 'string' ? parsed.selectedEndpointId : null
    }
    saveToLocalStorage(CONFIG_FALLBACK_KEY, config)
    return config
  } catch {
    return loadFromLocalStorage<AppConfig>(CONFIG_FALLBACK_KEY, EMPTY_CONFIG)
  }
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  saveToLocalStorage(CONFIG_FALLBACK_KEY, config)
  try {
    await tauriInvoke('save_config', { configJson: JSON.stringify(config) })
  } catch {
    return
  }
}

export async function loadAppSession(): Promise<AppSession> {
  try {
    const raw = await tauriInvoke<string>('load_session')
    const parsed = parseJson<Partial<AppSession>>(raw, {})
    const session: AppSession = {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      currentConversationId: typeof parsed.currentConversationId === 'string' ? parsed.currentConversationId : null
    }
    saveToLocalStorage(SESSION_FALLBACK_KEY, session)
    return session
  } catch {
    return loadFromLocalStorage<AppSession>(SESSION_FALLBACK_KEY, EMPTY_SESSION)
  }
}

export async function saveAppSession(session: AppSession): Promise<void> {
  saveToLocalStorage(SESSION_FALLBACK_KEY, session)
  try {
    await tauriInvoke('save_session', { sessionJson: JSON.stringify(session) })
  } catch {
    return
  }
}
