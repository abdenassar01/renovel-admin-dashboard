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
  handleSSOCallback,
  logout as authLogout,
  clearAuthSession,
} from '#/lib/auth'
import type { User } from '#/lib/types'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  ssoLogin: (token: string) => Promise<void>
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

  const ssoLogin = useCallback(async (token: string) => {
    const session = await handleSSOCallback(token)
    setUser(session.user)
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
        ssoLogin,
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
