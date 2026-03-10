import { Router, Request, Response } from 'express'

const router = Router()

interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
}

interface GitHubErrorResponse {
  error: string
  error_description?: string
  error_uri?: string
}

router.post('/github/token', async (req: Request, res: Response) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('GitHub OAuth credentials not configured')
    return res.status(500).json({ 
      error: 'OAuth not configured',
      message: 'GitHub OAuth credentials are not set up on the server'
    })
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    })

    const data = await response.json() as GitHubTokenResponse | GitHubErrorResponse

    if ('error' in data) {
      console.error('GitHub OAuth error:', data)
      return res.status(400).json({
        error: data.error,
        message: data.error_description || 'Failed to exchange authorization code'
      })
    }

    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in
    })
  } catch (error) {
    console.error('Error exchanging GitHub OAuth code:', error)
    res.status(500).json({ 
      error: 'server_error',
      message: 'Failed to exchange authorization code with GitHub'
    })
  }
})

router.post('/github/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('GitHub OAuth credentials not configured')
    return res.status(500).json({ 
      error: 'OAuth not configured',
      message: 'GitHub OAuth credentials are not set up on the server'
    })
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: 'refresh_token'
      })
    })

    const data = await response.json() as GitHubTokenResponse | GitHubErrorResponse

    if ('error' in data) {
      console.error('GitHub OAuth refresh error:', data)
      return res.status(400).json({
        error: data.error,
        message: data.error_description || 'Failed to refresh access token'
      })
    }

    res.json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in
    })
  } catch (error) {
    console.error('Error refreshing GitHub OAuth token:', error)
    res.status(500).json({ 
      error: 'server_error',
      message: 'Failed to refresh token with GitHub'
    })
  }
})

router.post('/github/revoke', async (req: Request, res: Response) => {
  const { access_token } = req.body

  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'OAuth not configured',
      message: 'GitHub OAuth credentials are not set up on the server'
    })
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const response = await fetch(`https://api.github.com/applications/${clientId}/token`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        access_token
      })
    })

    if (response.status === 204) {
      res.json({ success: true, message: 'Token revoked successfully' })
    } else {
      const errorData = await response.json()
      res.status(response.status).json({
        error: 'revoke_failed',
        message: errorData.message || 'Failed to revoke token'
      })
    }
  } catch (error) {
    console.error('Error revoking GitHub OAuth token:', error)
    res.status(500).json({ 
      error: 'server_error',
      message: 'Failed to revoke token with GitHub'
    })
  }
})

export { router as oauthRouter }
