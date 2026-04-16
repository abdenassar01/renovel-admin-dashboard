const baseUrl = (
  import.meta.env.VITE_RENOVEL_APP_URL || 'https://db.renovel.se'
).replace(/\/$/, '')

export const RENOVEL_APP_URL = baseUrl

type RequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('renovel_admin_token')
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = await getAuthToken()
  const { method = 'GET', body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const response = await fetch(
    `${RENOVEL_APP_URL}/api/admin${safeEndpoint}`,
    config,
  )

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('renovel_admin_token')
      localStorage.removeItem('renovel_admin_user')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (response.status === 403) {
    throw new Error('Forbidden: Master role required')
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(
      error.message || `Request failed with status ${response.status}`,
    )
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
}
