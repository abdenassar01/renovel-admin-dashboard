import { createAuthClient } from 'better-auth/client'
import { oidcClient } from 'better-auth/client/plugins'

const CONVEX_SITE_URL =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  'https://wonderful-mongoose-290.eu-west-1.convex.site'

export const authClient = createAuthClient({
  baseURL: CONVEX_SITE_URL,
  plugins: [oidcClient()],
})

export function getOAuthAuthorizeUrl(): string {
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'renovel-admin'
  const redirectUri = `${window.location.origin}/login/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  })
  return `${CONVEX_SITE_URL}/api/auth/oauth2/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string
  refreshToken?: string
  idToken?: string
}> {
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'renovel-admin'
  const clientSecret = import.meta.env.VITE_OIDC_CLIENT_SECRET || ''
  const redirectUri = `${window.location.origin}/login/callback`

  const response = await fetch(`${CONVEX_SITE_URL}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
  }
}

export async function getUserInfo(
  accessToken: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${CONVEX_SITE_URL}/api/auth/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}
