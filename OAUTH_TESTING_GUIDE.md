# OAuth Testing Guide - GitHub Copilot Integration

This guide walks through testing the OAuth authentication flow for GitHub Copilot integration.

## Prerequisites

Before testing, ensure:

1. ✅ Backend OAuth server is running (`pnpm server:dev`)
2. ✅ Frontend development server is running (`pnpm dev`)
3. ✅ GitHub OAuth App is configured with correct callback URL
4. ✅ Environment variables are set in `server/.env`

## Test Scenario 1: Initial OAuth Connection

### Steps:

1. **Open the Application**
   - Navigate to `http://localhost:5173` in your browser
   - You should see the AI Chat interface with a conversation sidebar

2. **Open Settings**
   - Click the gear icon (⚙️) in the top-right corner
   - The "Model Configuration" dialog should open

3. **Select GitHub Copilot Provider**
   - In the "Provider" dropdown, select "GitHub Copilot"
   - Notice the "OAuth" badge next to the provider name
   - The authentication section should appear showing "Connect with GitHub" button

4. **Initiate OAuth Flow**
   - Click the "Connect with GitHub" button
   - A popup window should open (600x700px, centered)
   - The popup should redirect to GitHub's authorization page

5. **Authorize on GitHub**
   - Log in to GitHub if not already authenticated
   - Review the requested permissions (read:user)
   - Click "Authorize" to grant access

6. **OAuth Callback Processing**
   - The popup should redirect to `/oauth/callback`
   - You should see a loading spinner with "Authenticating..." message
   - The backend server should exchange the authorization code for an access token
   - On success, you should see a green checkmark with "Success!" message
   - The popup should automatically close after 2 seconds

7. **Verify Connected State**
   - Return to the main application window
   - A toast notification should appear: "Successfully connected to GitHub!"
   - In the settings dialog, the authentication section should now show:
     - Green checkmark icon
     - "Connected" status
     - "You're authenticated with GitHub" message
     - "Disconnect" button

8. **Save Configuration**
   - Select a model from the "Model Name" dropdown (gpt-4 or gpt-3.5-turbo)
   - Adjust temperature and max tokens if desired
   - Click "Save Configuration"
   - Toast notification: "Configuration saved"
   - Settings dialog should close

9. **Test Chat with OAuth Token**
   - Type a message in the chat input (e.g., "Hello, tell me a joke")
   - Press Enter or click the send button
   - The message should be sent to GitHub Copilot API with OAuth token
   - You should receive a streaming response from the model

### Expected Results:

✅ OAuth popup opens correctly  
✅ GitHub authorization page loads  
✅ After authorization, callback processes successfully  
✅ Token is stored in configuration  
✅ "Connected" state displays in settings  
✅ Chat messages work with OAuth authentication  
✅ No console errors

## Test Scenario 2: Persistent OAuth Token

### Steps:

1. **Complete Initial Connection** (Scenario 1)

2. **Refresh the Page**
   - Press F5 or refresh the browser
   - The application should reload

3. **Verify Persistence**
   - Open Settings (gear icon)
   - Select "GitHub Copilot" provider
   - The authentication section should still show "Connected" state
   - No need to re-authenticate

4. **Test Chat Again**
   - Send a new message
   - Verify it works without re-authentication

### Expected Results:

✅ OAuth token persists after page refresh  
✅ No need to re-authenticate  
✅ Chat continues to work

## Test Scenario 3: Disconnect and Reconnect

### Steps:

1. **Start with Connected State** (Scenario 1)

2. **Disconnect**
   - Open Settings
   - In the connected authentication section, click "Disconnect" button
   - The authentication section should return to "Connect with GitHub" state

3. **Save and Test**
   - Click "Save Configuration" (token is now removed)
   - Try to send a message
   - Should show error: "Please authenticate with OAuth in settings"

4. **Reconnect**
   - Open Settings again
   - Click "Connect with GitHub"
   - Complete OAuth flow again
   - Verify connection works

### Expected Results:

✅ Disconnect removes OAuth token  
✅ Chat fails without token  
✅ Can reconnect successfully  
✅ Chat works after reconnection

## Test Scenario 4: Error Handling - User Denies Authorization

### Steps:

1. **Initiate OAuth Flow**
   - Open Settings
   - Select "GitHub Copilot"
   - Click "Connect with GitHub"
   - Popup opens with GitHub authorization page

2. **Deny Authorization**
   - On GitHub's authorization page, click "Cancel" or deny access

3. **Verify Error Handling**
   - Popup should redirect to callback with error parameters
   - Should see red X icon with "Authentication Failed" message
   - Error message should display
   - Popup auto-closes after 3 seconds

4. **Return to Main Window**
   - An error toast should appear in the main window
   - Settings should still show "Connect with GitHub" button (not connected)

### Expected Results:

✅ Error is caught and displayed  
✅ User-friendly error message shown  
✅ Popup closes gracefully  
✅ Can retry authentication

## Test Scenario 5: Error Handling - Invalid State

### Steps:

1. **Initiate OAuth Flow**
   - Start the OAuth process normally

2. **Clear Session Storage**
   - Before completing authorization on GitHub
   - Open browser DevTools (F12)
   - Go to Application > Session Storage
   - Clear `oauth_state` entry

3. **Complete Authorization**
   - Authorize on GitHub
   - Callback should detect state mismatch

4. **Verify Error**
   - Should see "Invalid OAuth state" error
   - Popup closes after 3 seconds
   - Main window shows error toast

### Expected Results:

✅ State validation prevents CSRF attacks  
✅ Clear error message  
✅ User can retry safely

## Test Scenario 6: Backend Server Down

### Steps:

1. **Stop Backend Server**
   - Stop the server running on port 3001
   - Kill the `pnpm server:dev` process

2. **Attempt OAuth**
   - Open Settings
   - Select "GitHub Copilot"
   - Click "Connect with GitHub"
   - Complete GitHub authorization

3. **Observe Failure**
   - Callback should fail to exchange token
   - Network error should be caught
   - Error message displayed
   - Popup closes

4. **Restart Server and Retry**
   - Restart backend server: `pnpm server:dev`
   - Try OAuth flow again
   - Should work normally

### Expected Results:

✅ Network error is handled gracefully  
✅ Error message explains the issue  
✅ Works after server restart

## Test Scenario 7: Multiple Provider Switching

### Steps:

1. **Connect to GitHub Copilot** (OAuth)
   - Complete OAuth flow
   - Verify connected state

2. **Switch to OpenAI**
   - Open Settings
   - Select "OpenAI" provider
   - Notice OAuth section is hidden
   - API Key field is shown instead
   - Enter an API key (or leave blank for testing)
   - Save configuration

3. **Switch Back to GitHub Copilot**
   - Open Settings
   - Select "GitHub Copilot" again
   - OAuth token should still be preserved
   - Should show "Connected" state

4. **Switch to Localhost**
   - Select "Localhost" provider
   - No authentication fields should be shown
   - Save configuration

### Expected Results:

✅ Provider switching works smoothly  
✅ OAuth token persists when switching away and back  
✅ Correct authentication UI for each provider  
✅ No data loss when switching providers

## Debugging Tips

### Check Backend Logs

Monitor the backend server terminal for:
- OAuth token exchange requests
- GitHub API responses
- Error messages

### Check Browser Console

Look for:
- Network errors (failed fetch calls)
- JavaScript errors
- OAuth callback messages (postMessage events)

### Check Network Tab

In DevTools Network tab:
1. Filter by `/api/oauth`
2. Check request/response for token exchange
3. Verify status codes (200 for success)

### Check Session Storage

In DevTools Application > Session Storage:
- `oauth_state` - should be set during OAuth flow
- `oauth_provider` - should be 'copilot'

### Check Local Storage (via useKV)

The OAuth token is stored via `useKV` in the model configuration:
- Open DevTools Console
- Run: `await spark.kv.get('model-config')`
- Should show configuration with `oauthToken` object

## Common Issues and Solutions

### Issue: Popup is Blocked

**Symptom:** Clicking "Connect with GitHub" does nothing

**Solution:**
- Allow popups for localhost:5173
- Check browser's popup blocker settings

### Issue: CORS Errors

**Symptom:** Token exchange fails with CORS error

**Solution:**
- Verify `FRONTEND_URL` in `server/.env` matches exactly
- Ensure backend server is running
- Check backend CORS configuration

### Issue: Invalid OAuth State

**Symptom:** Always get "Invalid OAuth state" error

**Solution:**
- Clear session storage
- Make sure cookies/session storage is enabled
- Try in a different browser or incognito mode

### Issue: Token Exchange Fails

**Symptom:** "Failed to exchange OAuth code" error

**Solution:**
- Verify GitHub OAuth App credentials in `server/.env`
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Verify callback URL matches GitHub OAuth App settings
- Check backend server logs for detailed error

### Issue: Popup Doesn't Close

**Symptom:** OAuth completes but popup stays open

**Solution:**
- Manually close the popup
- Check if `window.opener` is accessible
- Verify postMessage is not being blocked

## Success Criteria

All tests pass if:

✅ OAuth popup flow works end-to-end  
✅ Token is stored and persists  
✅ Chat works with OAuth authentication  
✅ Errors are handled gracefully  
✅ Can disconnect and reconnect  
✅ Provider switching preserves tokens  
✅ No console errors during normal operation  
✅ Backend server logs show successful exchanges

## Next Steps After Testing

If all tests pass:
1. Document any configuration issues encountered
2. Test with real GitHub Copilot API calls (requires valid access)
3. Monitor token expiration and refresh flows
4. Consider adding automated tests
5. Deploy to production environment and retest

## Production Testing Notes

When testing in production:

1. Update GitHub OAuth App with production callback URL
2. Update `FRONTEND_URL` in production environment
3. Ensure HTTPS is used (required for OAuth in production)
4. Test from multiple browsers and devices
5. Monitor error rates and token exchange success rates
