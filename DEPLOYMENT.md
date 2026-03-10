# OAuth Backend Deployment Guide

This guide provides step-by-step instructions for deploying the OAuth backend server to various hosting platforms.

## Prerequisites

- Node.js 18+ installed
- GitHub OAuth application created
- Git repository for your code

## Platform-Specific Deployment

### Option 1: Heroku

#### 1. Install Heroku CLI
```bash
npm install -g heroku
heroku login
```

#### 2. Create Heroku App
```bash
heroku create your-oauth-server
```

#### 3. Set Environment Variables
```bash
heroku config:set GITHUB_CLIENT_ID=your_client_id
heroku config:set GITHUB_CLIENT_SECRET=your_client_secret
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
heroku config:set PORT=3001
```

#### 4. Create Procfile
Create `Procfile` in the server directory:
```
web: npm run server:start
```

#### 5. Deploy
```bash
git push heroku main
```

#### 6. Update GitHub OAuth App
Set callback URL to: `https://your-frontend-domain.com/oauth/callback`

---

### Option 2: Railway

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### 2. Initialize Project
```bash
railway init
```

#### 3. Set Environment Variables
```bash
railway variables set GITHUB_CLIENT_ID=your_client_id
railway variables set GITHUB_CLIENT_SECRET=your_client_secret
railway variables set FRONTEND_URL=https://your-frontend-domain.com
railway variables set PORT=3001
```

#### 4. Deploy
```bash
railway up
```

---

### Option 3: Render

#### 1. Connect Repository
- Go to https://render.com
- Click "New +" → "Web Service"
- Connect your GitHub repository

#### 2. Configure Service
- **Name**: oauth-server
- **Environment**: Node
- **Build Command**: `npm run server:build`
- **Start Command**: `npm run server:start`
- **Root Directory**: `server` (if deploying only server)

#### 3. Add Environment Variables
In Render dashboard:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
```

#### 4. Deploy
Render will automatically deploy when you push to your repository.

---

### Option 4: Vercel (Serverless)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

#### 2. Create `api/oauth/github/token.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange token' })
  }
}
```

#### 3. Create `vercel.json`
```json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://your-frontend-domain.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

#### 4. Deploy
```bash
vercel --prod
```

#### 5. Set Environment Variables
```bash
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
```

---

### Option 5: AWS Lambda (Serverless)

#### 1. Install Serverless Framework
```bash
npm install -g serverless
```

#### 2. Create `serverless.yml`
```yaml
service: oauth-server

provider:
  name: aws
  runtime: nodejs18.x
  stage: prod
  region: us-east-1
  environment:
    GITHUB_CLIENT_ID: ${env:GITHUB_CLIENT_ID}
    GITHUB_CLIENT_SECRET: ${env:GITHUB_CLIENT_SECRET}
    FRONTEND_URL: ${env:FRONTEND_URL}

functions:
  tokenExchange:
    handler: server/routes/oauth.token
    events:
      - http:
          path: /api/oauth/github/token
          method: post
          cors:
            origin: ${env:FRONTEND_URL}
            headers:
              - Content-Type
              - Authorization

  tokenRefresh:
    handler: server/routes/oauth.refresh
    events:
      - http:
          path: /api/oauth/github/refresh
          method: post
          cors:
            origin: ${env:FRONTEND_URL}

  tokenRevoke:
    handler: server/routes/oauth.revoke
    events:
      - http:
          path: /api/oauth/github/revoke
          method: post
          cors:
            origin: ${env:FRONTEND_URL}
```

#### 3. Deploy
```bash
serverless deploy
```

---

### Option 6: Digital Ocean App Platform

#### 1. Connect Repository
- Go to https://cloud.digitalocean.com/apps
- Click "Create App"
- Connect your GitHub repository

#### 2. Configure App
- **Name**: oauth-server
- **Type**: Web Service
- **Branch**: main
- **Source Directory**: server
- **Build Command**: `npm run server:build`
- **Run Command**: `npm run server:start`

#### 3. Add Environment Variables
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=8080
```

#### 4. Deploy
Digital Ocean will automatically deploy.

---

## Docker Deployment

### Create `server/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server

RUN npm run server:build

EXPOSE 3001

CMD ["npm", "run", "server:start"]
```

### Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  oauth-server:
    build:
      context: .
      dockerfile: server/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - PORT=3001
    restart: unless-stopped
```

### Deploy with Docker
```bash
docker-compose up -d
```

---

## Frontend Integration

After deploying the backend, update your frontend OAuth configuration.

### Option 1: Environment Variable
Create `.env` in frontend:
```env
VITE_OAUTH_SERVER_URL=https://your-oauth-server.com
```

Update `src/lib/oauth.ts`:
```typescript
const OAUTH_SERVER_URL = import.meta.env.VITE_OAUTH_SERVER_URL || 'http://localhost:3001'

const response = await fetch(`${OAUTH_SERVER_URL}/api/oauth/github/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
})
```

### Option 2: Reverse Proxy
Configure your frontend hosting to proxy `/api/oauth/*` requests to your backend server.

**Nginx Example:**
```nginx
location /api/oauth/ {
  proxy_pass https://your-oauth-server.com/api/oauth/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

**Vercel (vercel.json):**
```json
{
  "rewrites": [
    {
      "source": "/api/oauth/(.*)",
      "destination": "https://your-oauth-server.com/api/oauth/$1"
    }
  ]
}
```

---

## Security Checklist

- [ ] Use HTTPS for all OAuth flows
- [ ] Keep `GITHUB_CLIENT_SECRET` secret and secure
- [ ] Set `FRONTEND_URL` to exact production domain
- [ ] Enable rate limiting on OAuth endpoints
- [ ] Implement request logging for debugging
- [ ] Set up monitoring and alerts
- [ ] Use environment variables for all secrets
- [ ] Enable CORS only for your frontend domain
- [ ] Implement proper error handling
- [ ] Set up automated backups (if storing session data)

---

## Monitoring and Logging

### Add Logging to Server
Install winston:
```bash
npm install winston
```

Update `server/index.ts`:
```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### Health Check Monitoring
Set up monitoring to ping `/health` endpoint regularly.

Example services:
- UptimeRobot
- Pingdom
- StatusCake

---

## Troubleshooting Production Issues

### Check Logs
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# Render
# View logs in dashboard

# Docker
docker-compose logs -f oauth-server
```

### Common Issues

**CORS Errors:**
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check protocol (http vs https)
- Ensure trailing slashes match

**Token Exchange Failures:**
- Verify GitHub OAuth app credentials
- Check callback URL configuration
- Ensure authorization code hasn't expired

**Environment Variable Issues:**
- Verify all required variables are set
- Restart service after changing variables
- Check for typos in variable names

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple server instances
- Implement session persistence with Redis
- Cache OAuth responses appropriately

### Performance Optimization
- Enable gzip compression
- Implement request caching
- Use CDN for static assets
- Optimize database queries (if applicable)

---

## Backup and Recovery

### Environment Variables Backup
Store environment variables securely:
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Keep encrypted backup of `.env` file
- Document all required variables

### Disaster Recovery Plan
1. Maintain up-to-date documentation
2. Keep infrastructure as code (IaC) configurations
3. Test restore procedures regularly
4. Have rollback strategy ready

---

## Support

For issues or questions:
1. Check server logs first
2. Verify environment configuration
3. Review GitHub OAuth app settings
4. Check CORS and network configuration
5. Review backend API responses in browser dev tools
