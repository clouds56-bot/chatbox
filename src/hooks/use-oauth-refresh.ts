import { useEffect, useRef } from 'react'
import { OAuthToken } from '@/lib/types'
import { refreshGitHubToken, isTokenExpired } from '@/lib/oauth'
import { toast } from 'sonner'

const REFRESH_BUFFER_MS = 5 * 60 * 1000

export function useOAuthRefresh(
  token: OAuthToken | undefined,
  onTokenRefreshed: (newToken: OAuthToken) => void
) {
  const timeoutRef = useRef<number | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!token || !token.expiresAt || !token.refreshToken) {
      return
    }

    const scheduleRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const now = Date.now()
      const expiresAt = token.expiresAt!
      const timeUntilExpiry = expiresAt - now
      const timeUntilRefresh = Math.max(0, timeUntilExpiry - REFRESH_BUFFER_MS)

      if (timeUntilRefresh <= 0 && !isTokenExpired(token)) {
        performRefresh()
      } else if (timeUntilRefresh > 0) {
        timeoutRef.current = window.setTimeout(() => {
          performRefresh()
        }, timeUntilRefresh)
      }
    }

    const performRefresh = async () => {
      if (isRefreshingRef.current || !token.refreshToken) {
        return
      }

      isRefreshingRef.current = true

      try {
        const newToken = await refreshGitHubToken(token.refreshToken)
        onTokenRefreshed(newToken)
        toast.success('OAuth token refreshed successfully')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to refresh token: ${message}`)
        console.error('Token refresh failed:', error)
      } finally {
        isRefreshingRef.current = false
      }
    }

    scheduleRefresh()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [token, onTokenRefreshed])
}
