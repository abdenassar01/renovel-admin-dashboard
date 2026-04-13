import { Link, useRouterState } from '@tanstack/react-router'
import {
  Building2,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Key,
  ClipboardList,
  Activity,
  Tags,
  FileText,
  Trash2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { ScrollArea } from '#/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { useSidebar } from '#/contexts/sidebar-context'
import { useAuth } from '#/contexts/auth-context'
import { cn } from '#/lib/utils'

const mainNav = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organizations' as const, label: 'Organizations', icon: Building2 },
  { to: '/feedback' as const, label: 'Feedback', icon: MessageSquare },
]

const settingsNav = [
  { to: '/settings/team' as const, label: 'Team', icon: Users },
  { to: '/settings/licenses' as const, label: 'Licenses', icon: Key },
  {
    to: '/settings/registrations' as const,
    label: 'Registrations',
    icon: ClipboardList,
  },
  {
    to: '/settings/activity-logs' as const,
    label: 'Activity Logs',
    icon: Activity,
  },
  {
    to: '/settings/plan-templates' as const,
    label: 'Plan Templates',
    icon: CreditCard,
  },
  { to: '/settings/categories' as const, label: 'Categories', icon: Tags },
  { to: '/settings/lead-types' as const, label: 'Lead Types', icon: FileText },
  {
    to: '/settings/deleted-leads' as const,
    label: 'Deleted Leads',
    icon: Trash2,
  },
  { to: '/settings/system' as const, label: 'System', icon: Settings },
]

function NavItem({
  to,
  label,
  icon: Icon,
  collapsed,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  collapsed: boolean
}) {
  const router = useRouterState()
  const isActive = router.location.pathname === to

  const content = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean
  onClose?: () => void
}) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center gap-3 border-b px-4 py-4',
          collapsed && 'justify-center px-2',
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Renovel Admin</h1>
              <p className="text-xs text-muted-foreground">Management Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="size-4 text-primary-foreground" />
          </div>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </p>
          )}
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </p>
          )}
          {settingsNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" onClick={logout}>
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminSidebar() {
  const { isOpen, toggleSidebar, isMobileOpen, closeMobile } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          'hidden border-r bg-card transition-all duration-300 lg:block',
          isOpen ? 'w-64' : 'w-16',
        )}
      >
        <SidebarContent collapsed={!isOpen} />
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-10 flex size-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-accent"
        >
          {isOpen ? (
            <ChevronLeft className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
      </aside>

      <Sheet
        open={isMobileOpen}
        onOpenChange={(open) => !open && closeMobile()}
      >
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent collapsed={false} onClose={closeMobile} />
        </SheetContent>
      </Sheet>
    </>
  )
}
