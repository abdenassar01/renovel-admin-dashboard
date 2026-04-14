const CONVEX_SITE_URL =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  'https://wonderful-mongoose-290.eu-west-1.convex.site'

export { CONVEX_SITE_URL }

const RENOVEL_APP_URL =
  import.meta.env.VITE_RENOVEL_APP_URL || 'https://stagingdb.renovel.se'

export { RENOVEL_APP_URL }

export function getSsoLoginUrl(): string {
  const redirectUri = `${window.location.origin}/callback`
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  })
  return `${RENOVEL_APP_URL}/login?${params}`
}

export async function validateAdminSession(token: string): Promise<{
  _id: string
  email: string
  role: string
  fullName?: string
  name?: string
  organizationId?: string
  [key: string]: unknown
} | null> {
  try {
    const res = await fetch(`${CONVEX_SITE_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
