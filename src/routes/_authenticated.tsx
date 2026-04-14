import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '#/components/layout/admin-sidebar'
import { AdminHeader } from '#/components/layout/admin-header'
import { useAuth } from '#/contexts/auth-context'
import { getStoredToken } from '#/lib/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const token = getStoredToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth()
  const token = getStoredToken()

  if (isLoading || (token && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    window.location.href = '/login'
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
