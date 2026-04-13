import { api } from './api-client'
import type { User } from './types'

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

export function setAuthSession(token: string, user: User) {
  localStorage.setItem(AUTH_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function isMasterRole(user: User | null): boolean {
  return user?.role === 'master'
}

export async function logout() {
  clearAuthSession()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
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
