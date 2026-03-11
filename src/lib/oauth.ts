import { OAuthToken } from './types'

export interface DeviceCodeInfo {
  deviceCode: string
  userCode: string
  verificationUri: string
  expiresIn: number
  interval: number
}

export async function initiateGitHubOAuth(): Promise<void> {
  const user = await window.spark.user()
  
  if (!user || !user.id) {
    throw new Error('User not authenticated')
  }

  const state = generateRandomState()
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_provider', 'copilot')

  const params = new URLSearchParams({
    client_id: 'Iv1.b507a08c87ecfe98',
    redirect_uri: window.location.origin + '/oauth/callback',
    state,
    scope: 'read:user'
  })

  const width = 600
  const height = 700
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  window.open(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
    'GitHub OAuth',
    `width=${width},height=${height},left=${left},top=${top},popup=yes`
  )
}

export async function handleOAuthCallback(code: string, state: string): Promise<OAuthToken> {
  const savedState = sessionStorage.getItem('oauth_state')
  const provider = sessionStorage.getItem('oauth_provider')

  if (state !== savedState) {
    throw new Error('Invalid OAuth state')
  }

  if (provider !== 'copilot') {
    throw new Error('Invalid OAuth provider')
  }

  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('oauth_provider')

  const response = await fetch('/api/oauth/github/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })

  if (!response.ok) {
    throw new Error('Failed to exchange OAuth code')
  }

  const data = await response.json()
  
  const token: OAuthToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    tokenType: data.token_type || 'Bearer'
  }

  return token
}

export function isTokenExpired(token: OAuthToken): boolean {
  if (!token.expiresAt) return false
  return Date.now() >= token.expiresAt
}

export async function refreshGitHubToken(refreshToken: string): Promise<OAuthToken> {
  const response = await fetch('/api/oauth/github/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh OAuth token')
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    tokenType: data.token_type || 'Bearer'
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function getAuthorizationHeader(token: OAuthToken): string {
  return `${token.tokenType} ${token.accessToken}`
}

export async function requestDeviceCode(): Promise<DeviceCodeInfo> {
  const response = await fetch('/api/oauth/github/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to request device code')
  }

  const data = await response.json()
  
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    expiresIn: data.expires_in,
    interval: data.interval
  }
}

export async function pollDeviceToken(deviceCode: string): Promise<OAuthToken> {
  const response = await fetch('/api/oauth/github/device/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_code: deviceCode })
  })

  const data = await response.json()

  if (!response.ok) {
    if (data.error === 'authorization_pending') {
      throw new Error('authorization_pending')
    }
    if (data.error === 'slow_down') {
      throw new Error('slow_down')
    }
    throw new Error(data.message || 'Failed to poll for token')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
    tokenType: data.token_type || 'Bearer'
  }
}

export async function waitForDeviceToken(
  deviceCodeInfo: DeviceCodeInfo,
  onPending?: () => void
): Promise<OAuthToken> {
  const startTime = Date.now()
  const expiresAt = startTime + (deviceCodeInfo.expiresIn * 1000)
  let interval = deviceCodeInfo.interval * 1000

  while (Date.now() < expiresAt) {
    await new Promise(resolve => setTimeout(resolve, interval))

    try {
      const token = await pollDeviceToken(deviceCodeInfo.deviceCode)
      return token
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'authorization_pending') {
          onPending?.()
          continue
        }
        if (error.message === 'slow_down') {
          interval += 5000
          continue
        }
      }
      throw error
    }
  }

  throw new Error('Device authorization expired')
}
