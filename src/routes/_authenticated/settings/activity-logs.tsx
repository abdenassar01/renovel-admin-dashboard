import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity as ActivityIcon,
  ArrowRight,
  Plus,
  UserPlus,
  Search,
  Settings,
  Trash2,
  Mail,
  CheckCircle,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { Activity } from '#/lib/types'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

export const Route = createFileRoute('/_authenticated/settings/activity-logs')({
  component: ActivityLogsPage,
})

const typeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  'lead:move': {
    icon: ArrowRight,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Lead Moved',
  },
  'lead:create': {
    icon: Plus,
    color:
      'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    label: 'Lead Created',
  },
  'lead:delete': {
    icon: Trash2,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    label: 'Lead Deleted',
  },
  'user:create': {
    icon: UserPlus,
    color:
      'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    label: 'User Created',
  },
  'user:update': {
    icon: Settings,
    color:
      'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'User Updated',
  },
  'email:send': {
    icon: Mail,
    color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
    label: 'Email Sent',
  },
  'registration:approve': {
    icon: CheckCircle,
    color:
      'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Registration Approved',
  },
}

const defaultTypeConfig = {
  icon: ActivityIcon,
  color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400',
  label: 'Activity',
}

export const PAGE_SIZE = 25

function ActivityLogsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filters: Record<string, unknown> = {}
  if (typeFilter !== 'all') filters.type = typeFilter
  if (userFilter) filters.user = userFilter

  const { data: activities = [], isLoading } = useQuery({
    queryKey: queryKeys.activities.list(filters),
    queryFn: () => api.get<Activity[]>('/activities'),
  })

  const filtered = activities.filter((a) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !a.content?.toLowerCase().includes(q) &&
        !a.userName?.toLowerCase().includes(q)
      )
        return false
    }
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (userFilter && a.userName !== userFilter) return false
    return true
  })

  const visible = filtered.slice(0, visibleCount)
  const uniqueTypes = [...new Set(activities.map((a) => a.type))]
  const uniqueUsers = [
    ...new Set(activities.map((a) => a.userName).filter(Boolean)),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ActivityIcon className="size-6" />
          Activity Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Track all system activity and user actions
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {typeConfig[t]?.label ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Users</SelectItem>
            {uniqueUsers.map((u) => (
              <SelectItem key={u} value={u!}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No activities found
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((activity) => {
            const config = typeConfig[activity.type] ?? defaultTypeConfig
            const Icon = config.icon
            return (
              <div
                key={activity._id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {activity.userName && (
                      <span className="text-sm text-muted-foreground">
                        by {activity.userName}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{activity.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(
                      new Date(activity._creationTime),
                      'MMM d, yyyy HH:mm',
                    )}
                  </p>
                </div>
              </div>
            )
          })}
          {visibleCount < filtered.length && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Load More ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
