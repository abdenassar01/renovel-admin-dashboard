import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { useAuth } from '#/contexts/auth-context'

export const Route = createFileRoute('/login/callback')({
  component: SSOCallbackPage,
})

function SSOCallbackPage() {
  const { ssoLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setError('No authentication token received. Please try again.')
      return
    }

    ssoLogin(token)
      .then(() => navigate({ to: '/' }))
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.',
        )
      })
  }, [ssoLogin, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <>
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
              <Shield className="size-6 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">Authentication Failed</h2>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <a
                href="/login"
                className="mt-4 inline-block text-sm text-primary underline"
              >
                Back to login
              </a>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Authenticating...</p>
          </>
        )}
      </div>
    </div>
  )
}
