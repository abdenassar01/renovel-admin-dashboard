import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  MessageSquare,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { DashboardStats } from '#/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})

function StatCard({
  title,
  value,
  icon: Icon,
  badge,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  badge?: { label: string; variant: 'default' | 'secondary' | 'outline' }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Renovel platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Organizations"
          value={stats?.totalOrganizations ?? 0}
          icon={Building2}
        />
        <StatCard
          title="Pending Organizations"
          value={stats?.pendingOrganizations ?? 0}
          icon={Clock}
          badge={
            stats?.pendingOrganizations
              ? { label: 'Needs review', variant: 'outline' }
              : undefined
          }
        />
        <StatCard
          title="Active Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
        />
        <StatCard
          title="Open Feedback"
          value={stats?.openFeedback ?? 0}
          icon={MessageSquare}
          badge={
            stats?.openFeedback
              ? { label: `${stats.openFeedback} open`, variant: 'secondary' }
              : undefined
          }
        />
        <StatCard
          title="Pending Registrations"
          value={stats?.pendingRegistrations ?? 0}
          icon={AlertCircle}
          badge={
            stats?.pendingRegistrations
              ? { label: 'Pending', variant: 'outline' }
              : undefined
          }
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="transition-colors hover:border-primary/30">
            <Link to="/organizations" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4" />
                  Organizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage organizations, review and approve applications
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="transition-colors hover:border-primary/30">
            <Link to="/feedback" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="size-4" />
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review user feedback and manage support requests
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="transition-colors hover:border-primary/30">
            <Link to="/settings/team" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage admin team members and permissions
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
