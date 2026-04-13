import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  getStoredUser,
  getStoredToken,
  refreshSession,
  setAuthSession,
  logout as authLogout,
  clearAuthSession,
} from '#/lib/auth'
import { exchangeCodeForToken, getUserInfo } from '#/lib/auth-client'
import type { User } from '#/lib/types'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  handleCallback: (code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
    }
    refreshSession()
      .then((fresh) => {
        if (fresh) {
          setUser(fresh)
        } else {
          setUser(null)
          clearAuthSession()
        }
      })
      .catch(() => {
        setUser(null)
        clearAuthSession()
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleCallback = useCallback(async (code: string) => {
    const { accessToken } = await exchangeCodeForToken(code)

    const userInfo = await getUserInfo(accessToken)

    const sub = (userInfo as any).sub as string

    const convexUser = await fetchConvexUser(accessToken, sub)
    if (!convexUser || convexUser.role !== 'master') {
      throw new Error(
        'Access denied. Only master administrators can access this panel.',
      )
    }

    setAuthSession(accessToken, convexUser)
    setUser(convexUser)
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    await authLogout()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && user.role === 'master',
        handleCallback,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

async function fetchConvexUser(
  accessToken: string,
  _authUserId: string,
): Promise<User | null> {
  try {
    const CONVEX_SITE_URL =
      import.meta.env.VITE_CONVEX_SITE_URL ||
      'https://wonderful-mongoose-290.eu-west-1.convex.site'
    const res = await fetch(`${CONVEX_SITE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
