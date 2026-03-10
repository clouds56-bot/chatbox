# OAuth Authentication Implementation

This document describes the OAuth authentication system with backend token exchange endpoints for secure OAuth flows.

## Overview

The application now supports multiple authentication methods depending on the provider:

- **API Key** (`api-key`): Used by OpenAI, z.ai, and custom providers
- **OAuth** (`oauth`): Used by GitHub Copilot with secure server-side token exchange
- **None** (`none`): Used by localhost providers

## Architecture

### Backend Server (`/server`)

The backend server handles OAuth token exchange securely using Express:

**Key Files:**
- `server/index.ts`: Main Express server with CORS and routing
- `server/routes/oauth.ts`: OAuth endpoint handlers for token exchange, refresh, and revocation
- `server/.env`: Environment variables for GitHub OAuth credentials

**Endpoints:**
- `POST /api/oauth/github/token`: Exchange authorization code for access token
- `POST /api/oauth/github/refresh`: Refresh an expired access token
- `POST /api/oauth/github/revoke`: Revoke an access token
- `GET /health`: Health check endpoint

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
- **`handleOAuthCallback(code, state)`**: Handles the OAuth callback and exchanges the authorization code for an access token via the backend
- **`isTokenExpired(token)`**: Checks if an OAuth token has expired
- **`refreshGitHubToken(refreshToken)`**: Refreshes an expired OAuth token via the backend
- **`getAuthorizationHeader(token)`**: Formats the OAuth token for API requests

### Provider Configuration (`src/lib/providers.ts`)

Each provider preset includes authentication method configuration:

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

The `sendMessage` function handles different authentication methods:

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

## Setup Instructions

### 1. Create GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:5173` (development) or your production URL
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback`
4. Click "Register application"
5. Note your **Client ID** and generate a **Client Secret**

### 2. Configure Server Environment

Create `server/.env` file:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Start the Backend Server

From the project root:

```bash
npm run server:dev
```

The OAuth server will run on `http://localhost:3001`.

### 4. Start the Frontend

In a separate terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

## User Interface

### Settings Dialog (`src/components/SettingsDialog.tsx`)

The settings dialog provides:

1. **Provider Selection** with OAuth badge for OAuth-enabled providers
2. **OAuth Authentication Section** (when OAuth provider is selected):
   - "Connect with GitHub" button to initiate OAuth flow
   - Connected status with disconnect option
   - Token expiration information
3. **API Key Input** (when API key provider is selected)
4. **No Authentication Section** (when localhost/none provider is selected)

### OAuth Callback Handler (`src/components/OAuthCallback.tsx`)

Handles the OAuth callback flow:
- Processes authorization code from GitHub
- Exchanges code for access token via backend
- Displays success/error status
- Communicates with parent window via postMessage
- Auto-closes on completion

## OAuth Flow

1. User selects "GitHub Copilot" as provider in settings
2. User clicks "Connect with GitHub" button
3. Application opens OAuth popup window directed to GitHub authorization page
4. User authorizes the application on GitHub
5. GitHub redirects to callback URL with authorization code
6. Callback handler exchanges code for access token via `/api/oauth/github/token`
7. Token is stored in configuration and persisted via `useKV`
8. User can now send messages using GitHub Copilot

## Security Considerations

1. **Server-Side Token Exchange**: Client secret never exposed to frontend
2. **HTTPS Required**: All OAuth flows must use HTTPS in production
3. **State Parameter**: CSRF protection using cryptographically secure random state
4. **Token Storage**: OAuth tokens stored locally via browser storage (useKV)
5. **Token Expiry**: Token expiration is tracked and can be refreshed
6. **CORS Configuration**: Server configured to accept requests only from specified frontend URL

## Backend API Reference

### POST `/api/oauth/github/token`

Exchange GitHub authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code_from_github"
}
```

**Success Response (200):**
```json
{
  "access_token": "gho_...",
  "token_type": "bearer",
  "scope": "read:user",
  "refresh_token": "ghr_...",
  "expires_in": 28800,
  "refresh_token_expires_in": 15552000
}
```

**Error Response (400/500):**
```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

### POST `/api/oauth/github/refresh`

Refresh an expired GitHub access token.

**Request:**
```json
{
  "refresh_token": "ghr_..."
}
```

**Response:** Same format as token exchange

### POST `/api/oauth/github/revoke`

Revoke a GitHub access token.

**Request:**
```json
{
  "access_token": "gho_..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

## Testing

### Testing OAuth Flow

1. Ensure both frontend and backend servers are running
2. Open the application in your browser
3. Open Settings and select "GitHub Copilot" provider
4. Click "Connect with GitHub"
5. Verify redirect to GitHub authorization page in popup
6. Authorize the application
7. Verify successful redirect back and "Connected" status
8. Send a test message and verify OAuth token is used

### Testing API Key Flow

1. Select "OpenAI" provider in settings
2. Enter valid API key
3. Save configuration
4. Send a message and verify API key authentication

### Testing No-Auth Flow

1. Select "Localhost" provider in settings
2. Verify no authentication fields are shown
3. Send a message and verify no authentication header

## Production Deployment

### Backend Deployment

1. **Set Environment Variables** on your hosting platform:
   ```
   GITHUB_CLIENT_ID=your_production_client_id
   GITHUB_CLIENT_SECRET=your_production_client_secret
   FRONTEND_URL=https://your-domain.com
   PORT=3001
   ```

2. **Build the server**:
   ```bash
   npm run server:build
   ```

3. **Start the server**:
   ```bash
   npm run server:start
   ```

4. **Configure Reverse Proxy** (if needed) to route `/api/oauth/*` to your backend server

### GitHub OAuth App Configuration

1. Update your GitHub OAuth app settings
2. Set production callback URL: `https://your-domain.com/oauth/callback`
3. Set homepage URL: `https://your-domain.com`

### Frontend Configuration

Ensure your frontend proxies API requests to the backend server or update the OAuth library to use the correct backend URL.

## Troubleshooting

### "OAuth not configured" error

- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in server's `.env`
- Restart the backend server after changing environment variables

### CORS errors

- Check `FRONTEND_URL` in server's `.env` matches your frontend URL exactly
- Ensure both protocols (http/https) match

### "Invalid OAuth state" error

- This is a security feature preventing CSRF attacks
- Clear browser storage and try again
- Ensure sessionStorage is enabled in browser

### Token exchange fails

1. Verify GitHub OAuth app credentials are correct
2. Check authorization callback URL matches GitHub app settings
3. Ensure authorization codes are used immediately (they expire quickly and are single-use)
4. Check backend server logs for detailed error messages

### "Failed to exchange OAuth code" error

- Verify backend server is running on the expected port
- Check network connectivity between frontend and backend
- Verify CORS is properly configured
- Check browser console for detailed error messages

## Future Enhancements

1. **Additional OAuth Providers**: Support for Azure AD, Google, Auth0, etc.
2. **Automatic Token Refresh**: Implement background token refresh before expiration
3. **Multi-Account Support**: Allow multiple accounts for the same provider
4. **Token Management UI**: Admin panel to view/revoke tokens
5. **OAuth Scopes Configuration**: Allow custom scope selection per provider
6. **Session Management**: Implement proper session handling for authenticated users
