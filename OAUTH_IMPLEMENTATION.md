# OAuth Authentication Implementation

This document describes the OAuth authentication system added to support provider-specific authentication methods, particularly GitHub OAuth for GitHub Copilot.

## Overview

The application now supports multiple authentication methods depending on the provider:

- **API Key** (`api-key`): Used by OpenAI, z.ai, and custom providers
- **OAuth** (`oauth`): Used by GitHub Copilot
- **None** (`none`): Used by localhost providers

## Architecture

### Type Definitions (`src/lib/types.ts`)

```typescript
export type AuthMethod = 'api-key' | 'oauth' | 'none'

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType: string
}

export interface ModelConfig {
  provider: ProviderType
  apiEndpoint: string
  modelName: string
  apiKey: string
  authMethod: AuthMethod
  oauthToken?: OAuthToken
  temperature?: number
  maxTokens?: number
}
```

### OAuth Library (`src/lib/oauth.ts`)

The OAuth library provides functions for:

- **`initiateGitHubOAuth()`**: Starts the GitHub OAuth flow by redirecting to GitHub's authorization page
- **`handleOAuthCallback(code, state)`**: Handles the OAuth callback and exchanges the authorization code for an access token
- **`isTokenExpired(token)`**: Checks if an OAuth token has expired
- **`refreshGitHubToken(refreshToken)`**: Refreshes an expired OAuth token
- **`getAuthorizationHeader(token)`**: Formats the OAuth token for API requests

### Provider Configuration (`src/lib/providers.ts`)

Each provider preset now includes:

```typescript
{
  name: 'GitHub Copilot',
  type: 'copilot',
  endpoint: 'https://api.githubcopilot.com/chat/completions',
  defaultModel: 'gpt-4',
  requiresApiKey: false,
  authMethod: 'oauth',
  supportsOAuth: true,
  description: 'GitHub Copilot Chat API (OAuth)'
}
```

### API Integration (`src/lib/api.ts`)

The `sendMessage` function now handles different authentication methods:

```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json'
}

if (config.authMethod === 'api-key' && config.apiKey) {
  headers['Authorization'] = `Bearer ${config.apiKey}`
} else if (config.authMethod === 'oauth' && config.oauthToken) {
  headers['Authorization'] = getAuthorizationHeader(config.oauthToken)
}
```

## User Interface

### Settings Dialog (`src/components/SettingsDialog.tsx`)

The settings dialog now provides:

1. **Provider Selection** with OAuth badge for OAuth-enabled providers
2. **OAuth Authentication Section** (when OAuth provider is selected):
   - "Connect with GitHub" button to initiate OAuth flow
   - Connected status with disconnect option
   - Clear messaging about OAuth requirements
3. **API Key Input** (when API key provider is selected)
4. **No Authentication Section** (when localhost/none provider is selected)

### OAuth Flow

1. User selects "GitHub Copilot" as provider
2. User clicks "Connect with GitHub" button
3. Application redirects to GitHub authorization page
4. User authorizes the application
5. GitHub redirects back with authorization code
6. Application exchanges code for access token
7. Token is stored in configuration and persisted locally
8. User can now send messages using GitHub Copilot

## Security Considerations

1. **Local Storage**: OAuth tokens are stored in browser local storage via `useKV` hook
2. **State Parameter**: CSRF protection using random state parameter
3. **Token Expiry**: Token expiration is tracked and handled
4. **Secure Transmission**: All OAuth flows use HTTPS

## Backend Requirements

For GitHub OAuth to work in production, you need:

1. **OAuth Application**: Register a GitHub OAuth application at https://github.com/settings/developers
2. **Backend Endpoint**: Implement `/api/oauth/github/token` to exchange authorization code for access token
3. **Token Refresh Endpoint**: Implement `/api/oauth/github/refresh` for token refresh

### Example Backend (Conceptual)

```typescript
// POST /api/oauth/github/token
async function exchangeCode(req, res) {
  const { code } = req.body
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  })
  
  const data = await response.json()
  res.json(data)
}
```

## Testing

### Testing OAuth Flow

1. Select "GitHub Copilot" provider in settings
2. Click "Connect with GitHub"
3. Verify redirect to GitHub authorization page
4. Authorize the application
5. Verify successful redirect back to application
6. Verify "Connected" status in settings
7. Send a message and verify OAuth token is included in request

### Testing API Key Flow

1. Select "OpenAI" provider in settings
2. Enter API key
3. Save configuration
4. Send a message and verify API key is included in request

### Testing No-Auth Flow

1. Select "Localhost" provider in settings
2. Verify no authentication fields are shown
3. Send a message and verify no authentication header is included

## Future Enhancements

1. **Additional OAuth Providers**: Support for other OAuth-based AI services
2. **Automatic Token Refresh**: Implement automatic token refresh before expiration
3. **Multi-Account Support**: Allow multiple accounts for the same provider
4. **Token Revocation**: Add ability to revoke OAuth tokens from settings
5. **OAuth Scopes**: Allow configuration of OAuth scopes per provider
