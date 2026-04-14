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
import { validateAdminSession } from '#/lib/auth-client'
import type { User } from '#/lib/types'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  handleCallback: (token: string) => Promise<void>
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

  const handleCallback = useCallback(async (token: string) => {
    const convexUser = await validateAdminSession(token)
    if (!convexUser || convexUser.role !== 'master') {
      throw new Error(
        'Access denied. Only master administrators can access this panel.',
      )
    }

    const user: User = {
      _id: convexUser._id,
      email: convexUser.email,
      role: convexUser.role as User['role'],
      fullName: convexUser.fullName,
      name: convexUser.name,
      organizationId: convexUser.organizationId,
      _creationTime: Date.now(),
    }

    setAuthSession(token, user)
    setUser(user)
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
