# AI Chat Interface with OAuth Backend

A ChatGPT-like conversational AI interface that connects to multiple backend LLM providers with secure OAuth authentication support.

## Features

- 💬 **Multi-Provider Support**: Connect to OpenAI, z.ai, GitHub Copilot, localhost, or custom endpoints
- 🔐 **Secure OAuth Authentication**: Server-side OAuth token exchange for GitHub Copilot
- 🔑 **Flexible Authentication**: Support for API keys, OAuth, or no authentication
- 📝 **Markdown Rendering**: Full markdown support with code blocks, lists, and formatting
- 💾 **Persistent Conversations**: Save and manage multiple conversation threads
- ⚡ **Streaming Responses**: Real-time token-by-token response streaming
- 🎨 **Modern UI**: Clean, professional interface with dark theme

## Architecture

### Frontend
- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- shadcn/ui components
- Persistent storage via `useKV` hook

### Backend OAuth Server
- Express.js server for secure OAuth token exchange
- GitHub OAuth integration
- Token refresh and revocation endpoints
- CORS-enabled API endpoints

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OAuth (Optional - for GitHub Copilot)

If you want to use GitHub Copilot authentication:

#### Create GitHub OAuth App
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set callback URL: `http://localhost:5173/oauth/callback`
4. Note your Client ID and generate a Client Secret

#### Configure Server
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - OAuth Backend (if using OAuth):**
```bash
npm run server:dev
```

### 4. Open Application

Navigate to http://localhost:5173

## Configuration

### Provider Setup

The app comes with preset configurations for:

- **OpenAI**: Requires API key
- **z.ai**: Requires API key  
- **GitHub Copilot**: Requires OAuth authentication
- **Localhost**: No authentication needed
- **Custom**: Configure your own endpoint

### Authentication Methods

1. **API Key**: For OpenAI, z.ai, and most custom endpoints
2. **OAuth**: For GitHub Copilot with secure server-side token exchange
3. **None**: For local development servers

## Documentation

- **[OAuth Implementation Guide](./OAUTH_IMPLEMENTATION.md)**: Detailed OAuth flow and architecture
- **[Deployment Guide](./DEPLOYMENT.md)**: Instructions for deploying the OAuth backend
- **[Server README](./server/README.md)**: Backend API reference and setup
- **[PRD](./PRD.md)**: Product requirements and design specifications

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run server:dev` - Start OAuth server in development mode
- `npm run server:build` - Build OAuth server for production
- `npm run server:start` - Start production OAuth server

## Project Structure

```
.
├── src/
│   ├── components/        # React components
│   │   ├── ConversationSidebar.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── OAuthCallback.tsx
│   │   └── ui/           # shadcn components
│   ├── lib/              # Utilities and libraries
│   │   ├── api.ts        # API communication
│   │   ├── oauth.ts      # OAuth flow handlers
│   │   ├── providers.ts  # Provider configurations
│   │   └── types.ts      # TypeScript types
│   ├── App.tsx           # Main application
│   └── index.css         # Styles
├── server/               # OAuth backend server
│   ├── index.ts          # Express server
│   ├── routes/
│   │   └── oauth.ts      # OAuth endpoints
│   ├── .env.example      # Environment template
│   └── README.md         # Server documentation
├── OAUTH_IMPLEMENTATION.md
├── DEPLOYMENT.md
└── README.md
```

## Security

- OAuth client secrets are kept server-side only
- CSRF protection via state parameter
- Token expiration tracking
- Secure token storage via browser storage
- CORS configured for specific frontend domain

## Development

### Adding New Providers

1. Add provider configuration to `src/lib/providers.ts`
2. Update authentication logic in `src/lib/api.ts` if needed
3. Add OAuth endpoints in `server/routes/oauth.ts` for OAuth providers

### Customizing UI

- Theme variables in `src/index.css`
- Component styles use Tailwind classes
- shadcn components in `src/components/ui/`

## Troubleshooting

### OAuth Issues
- Verify GitHub OAuth app credentials
- Check callback URL matches exactly
- Ensure backend server is running
- Check CORS configuration

### API Connection Issues  
- Verify API keys are correct
- Check endpoint URLs
- Review authentication method for provider
- Check browser console for errors

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version (18+ required)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
