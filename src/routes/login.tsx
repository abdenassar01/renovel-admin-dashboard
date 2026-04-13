import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Shield, Loader2 } from 'lucide-react'
import { getSSOLoginUrl } from '#/lib/auth'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSSO() {
    setLoading(true)
    setError(null)
    try {
      const url = getSSOLoginUrl()
      window.location.href = url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initiate SSO login. Please try again.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--sea-ink)] via-[var(--lagoon-deep)] to-[var(--lagoon)] opacity-5" />

      <Card className="relative z-10 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary">
            <Shield className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Renovel Admin</CardTitle>
          <CardDescription>
            Sign in with your Renovel account to access the admin panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleSSO} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Redirecting to Renovel...' : 'Sign in with Renovel SSO'}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Only master administrators can access this panel.
            <br />
            You will be redirected to renovel.se to authenticate.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
