import { Menu, Bell } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useSidebar } from '#/contexts/sidebar-context'
import { useAuth } from '#/contexts/auth-context'
import { useRouterState } from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/organizations': 'Organizations',
  '/feedback': 'Feedback',
  '/settings': 'Settings',
  '/settings/team': 'Team Management',
  '/settings/licenses': 'License Management',
  '/settings/registrations': 'Registrations',
  '/settings/activity-logs': 'Activity Logs',
  '/settings/plan-templates': 'Plan Templates',
  '/settings/categories': 'Categories',
  '/settings/lead-types': 'Lead Types',
  '/settings/deleted-leads': 'Deleted Leads',
  '/settings/system': 'System Settings',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/organizations/')) return 'Organization Details'
  return 'Admin Panel'
}

export function AdminHeader() {
  const { toggleMobile } = useSidebar()
  const { user, logout } = useAuth()
  const router = useRouterState()
  const pageTitle = getPageTitle(router.location.pathname)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobile}
      >
        <Menu className="size-5" />
      </Button>

      <h1 className="text-lg font-semibold">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-8 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {user?.fullName || 'Admin'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/system" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
