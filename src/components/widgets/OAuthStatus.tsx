import { Button } from '@/components/ui/button'
import { Check, Clock } from '@phosphor-icons/react'
import { OAuthToken } from '@/lib/types'
import { isTokenExpired } from '@/lib/oauth'

interface OAuthStatusProps {
  token?: OAuthToken
  onDisconnect: () => void
}

export function OAuthStatus({ token, onDisconnect }: OAuthStatusProps) {
  if (!token) return null

  const tokenExpired = isTokenExpired(token)
  const tokenExpiresAt = token.expiresAt
  const timeUntilExpiry = tokenExpiresAt ? tokenExpiresAt - Date.now() : null
  const hoursUntilExpiry = timeUntilExpiry ? Math.floor(timeUntilExpiry / (1000 * 60 * 60)) : null

  return (
    <>
      <div className={`flex items-center gap-2 p-3 border rounded-md ${
        tokenExpired 
          ? 'bg-destructive/10 border-destructive' 
          : 'bg-accent/10 border-accent'
      }`}>
        <Check weight="bold" className={`w-5 h-5 ${
          tokenExpired ? 'text-destructive' : 'text-accent'
        }`} />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {tokenExpired ? 'Token Expired' : 'Connected'}
          </p>
          <p className="text-xs text-muted-foreground">
            You're authenticated with GitHub
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
      </div>
      {!tokenExpired && tokenExpiresAt && hoursUntilExpiry !== null && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Token expires in {hoursUntilExpiry > 0 ? `${hoursUntilExpiry}h` : '<1h'} 
            {token.refreshToken && ' • Auto-refresh enabled'}
          </p>
        </div>
      )}
    </>
  )
}
