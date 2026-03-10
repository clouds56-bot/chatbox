import { useEffect, useState } from 'react'
import { handleOAuthCallback } from '@/lib/oauth'
import { CircleNotch, CheckCircle, XCircle } from '@phosphor-icons/react'

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing OAuth callback...')

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        setStatus('error')
        setMessage(errorDescription || `OAuth error: ${error}`)
        setTimeout(() => window.close(), 3000)
        return
      }

      if (!code || !state) {
        setStatus('error')
        setMessage('Missing authorization code or state parameter')
        setTimeout(() => window.close(), 3000)
        return
      }

      try {
        const token = await handleOAuthCallback(code, state)
        
        window.opener?.postMessage({
          type: 'oauth-success',
          token
        }, window.location.origin)

        setStatus('success')
        setMessage('Authentication successful! You can close this window.')
        
        setTimeout(() => {
          window.close()
        }, 2000)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
        setStatus('error')
        setMessage(errorMessage)
        
        window.opener?.postMessage({
          type: 'oauth-error',
          error: errorMessage
        }, window.location.origin)

        setTimeout(() => {
          window.close()
        }, 3000)
      }
    }

    processCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="flex justify-center">
          {status === 'loading' && (
            <CircleNotch className="w-16 h-16 text-accent animate-spin" weight="bold" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 text-green-500" weight="bold" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 text-destructive" weight="bold" />
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  )
}
