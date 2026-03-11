# Quick Start: Testing GitHub Copilot OAuth

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure GitHub OAuth App

You need to update the GitHub OAuth app client secret in the server configuration.

1. **Go to GitHub OAuth App Settings:**
   - Visit: https://github.com/settings/developers
   - Find the OAuth app with Client ID: `Iv1.b507a08c87ecfe98`
   - Or create a new OAuth app if needed

2. **Update server/.env:**
   ```bash
   # Edit this file
   nano server/.env
   
   # Update GITHUB_CLIENT_SECRET with your actual secret
   GITHUB_CLIENT_SECRET=your_actual_secret_here
   ```

### Step 2: Start the Backend Server

```bash
# From project root
pnpm server:dev
```

Expected output:
```
OAuth server running on port 3001
```

### Step 3: Start the Frontend (in a new terminal)

```bash
# From project root
pnpm dev
```

Expected output:
```
VITE ready in XXXms
➜  Local:   http://localhost:5173/
```

### Step 4: Test OAuth Flow

1. **Open the app:** http://localhost:5173

2. **Open Settings:** Click the gear icon (⚙️) in top-right

3. **Select GitHub Copilot:** Choose "GitHub Copilot" from provider dropdown

4. **Connect:** Click "Connect with GitHub" button

5. **Authorize:** A popup opens → Authorize the app on GitHub

6. **Success:** Popup shows success message and closes → Main window shows "Connected" 

7. **Save:** Click "Save Configuration"

8. **Test Chat:** Send a message to test the OAuth authentication!

## ✅ Verification Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend running on port 5173
- [ ] OAuth popup opens when clicking "Connect with GitHub"
- [ ] Can authorize on GitHub successfully
- [ ] Popup closes automatically after success
- [ ] Settings show "Connected" status
- [ ] Can send messages using OAuth token

## 🐛 Quick Troubleshooting

**Popup doesn't open?**
- Allow popups for localhost:5173 in browser settings

**"OAuth not configured" error?**
- Check `GITHUB_CLIENT_SECRET` in `server/.env`
- Restart the backend server after changing .env

**CORS errors?**
- Verify backend server is running
- Check `FRONTEND_URL=http://localhost:5173` in server/.env

**Token exchange fails?**
- Verify GitHub OAuth app callback URL: `http://localhost:5173/oauth/callback`
- Check backend server terminal for error details

## 📚 Full Documentation

For detailed testing scenarios and debugging:
- See: `OAUTH_TESTING_GUIDE.md`
- See: `OAUTH_IMPLEMENTATION.md`

## 🎯 What's Being Tested

This test verifies:

1. **OAuth Flow:** Complete OAuth 2.0 authorization flow with GitHub
2. **Token Exchange:** Secure server-side code-for-token exchange
3. **Token Storage:** Persistent storage using `useKV` 
4. **Authentication:** OAuth Bearer token authentication for API calls
5. **Error Handling:** Graceful error handling for various failure scenarios
6. **UI/UX:** Popup flow, connected state, and user feedback

## 🔐 Security Notes

- Client secret is kept on the server (never exposed to frontend)
- State parameter prevents CSRF attacks
- Tokens stored locally in browser via `useKV`
- OAuth token used in Authorization header for API requests

## 🎉 Success!

If you can complete the OAuth flow and send a message successfully, the OAuth implementation is working correctly!

The OAuth token will persist across page refreshes, so you only need to authenticate once.
