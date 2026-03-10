import { OAuthToken } from './types'

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

  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`
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
