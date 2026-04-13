import { api, getRenovelBaseUrl } from './api-client'
import type { AuthSession, User } from './types'

const AUTH_STORAGE_KEY = 'renovel_admin_token'
const USER_STORAGE_KEY = 'renovel_admin_user'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, session.token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function isMasterRole(user: User | null): boolean {
  return user?.role === 'master'
}

export function getSSOLoginUrl(): string {
  const baseUrl = getRenovelBaseUrl()
  const callbackUrl = encodeURIComponent(
    `${window.location.origin}/login/callback`,
  )
  return `${baseUrl}/api/auth/sign-in?callbackURL=${callbackUrl}`
}

export async function handleSSOCallback(token: string): Promise<AuthSession> {
  const session = await api.post<AuthSession>('/auth/sso/verify', { token })
  if (session.user.role !== 'master') {
    clearAuthSession()
    throw new Error(
      'Access denied. Only master administrators can access this panel.',
    )
  }
  setAuthSession(session)
  return session
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAuthSession()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

export async function refreshSession(): Promise<User | null> {
  try {
    const user = await api.get<User>('/auth/session')
    if (user.role !== 'master') {
      clearAuthSession()
      return null
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    return user
  } catch {
    clearAuthSession()
    return null
  }
}
