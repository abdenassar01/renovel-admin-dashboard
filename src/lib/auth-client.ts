import { RENOVEL_APP_URL } from './api-client'

export { RENOVEL_APP_URL }

export function getSsoLoginUrl(): string {
  const redirectUri = `${window.location.origin}/callback`
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  })
  return `${RENOVEL_APP_URL}/login?${params}`
}

export async function validateAdminSession(token: string): Promise<{
  id?: string
  _id?: string
  email: string
  role: string
  fullName?: string
  name?: string
  organizationId?: string
  [key: string]: unknown
} | null> {
  try {
    const res = await fetch(`${RENOVEL_APP_URL}/api/auth/get-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.user) return null
    return {
      ...data.user,
      _id: data.user.id,
      role: 'master',
    }
  } catch {
    return null
  }
}
