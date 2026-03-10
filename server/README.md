# OAuth Server

Backend server for handling OAuth token exchange flows securely.

## Features

- **GitHub OAuth Token Exchange**: Secure server-side token exchange for GitHub OAuth
- **Token Refresh**: Automatic refresh token handling
- **Token Revocation**: Ability to revoke OAuth tokens
- **CORS Support**: Configured for cross-origin requests from frontend
- **Error Handling**: Comprehensive error handling with descriptive messages

## Setup

### 1. Create GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:5173` (or your production URL)
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback`
4. Click "Register application"
5. Note your **Client ID** and generate a **Client Secret**

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your GitHub OAuth credentials:

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Install Dependencies

The server uses dependencies from the main project. Make sure you've installed the project dependencies:

```bash
npm install
```

### 4. Start the Server

From the project root:

```bash
npm run server:dev
```

Or from the server directory:

```bash
npm start
```

The server will start on `http://localhost:3001`.

## API Endpoints

### POST `/api/oauth/github/token`

Exchange GitHub authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code_from_github"
}
```

**Response:**
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

### POST `/api/oauth/github/refresh`

Refresh an expired GitHub access token.

**Request:**
```json
{
  "refresh_token": "ghr_..."
}
```

**Response:**
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

### POST `/api/oauth/github/revoke`

Revoke a GitHub access token.

**Request:**
```json
{
  "access_token": "gho_..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Considerations

1. **Never expose client secrets**: The client secret must remain on the server
2. **Use HTTPS in production**: Always use HTTPS for OAuth flows in production
3. **Validate state parameter**: The server relies on the frontend to validate the state parameter
4. **Environment variables**: Never commit `.env` files to version control
5. **CORS configuration**: Update `FRONTEND_URL` to match your production domain

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

Common error codes:
- `authorization_code_required`: Missing authorization code
- `refresh_token_required`: Missing refresh token
- `oauth_not_configured`: Server credentials not configured
- `server_error`: Internal server error

## Development

The server uses TypeScript and Express. Key files:

- `index.ts`: Main server setup and middleware
- `routes/oauth.ts`: OAuth endpoint handlers
- `tsconfig.json`: TypeScript configuration

## Production Deployment

1. Set environment variables on your hosting platform
2. Update `FRONTEND_URL` to your production domain
3. Update GitHub OAuth app callback URL to production URL
4. Build and run: `npm run build && npm start`
5. Ensure HTTPS is configured

## Troubleshooting

### "OAuth not configured" error

Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in your `.env` file.

### CORS errors

Verify `FRONTEND_URL` in `.env` matches your frontend's URL exactly.

### "Invalid OAuth state" error

This is a security feature. Make sure cookies/sessionStorage are working properly in your browser.

### Token exchange fails

1. Verify your GitHub OAuth app credentials
2. Check the authorization callback URL matches your GitHub app settings
3. Ensure the authorization code hasn't expired (they're single-use and short-lived)
