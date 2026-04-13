import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Settings,
  Server,
  Database,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { DeploymentInfo, DatabaseStats } from '#/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Slider } from '#/components/ui/slider'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/system')({
  component: SystemSettingsPage,
})

const timeoutPresets = [15, 30, 60, 120, 240, 480]

function SystemSettingsPage() {
  const [idleMinutes, setIdleMinutes] = useState(30)
  const [confirmRecalculate, setConfirmRecalculate] = useState(false)
  const queryClient = useQueryClient()

  const { data: deploymentInfo, isLoading: deploymentLoading } = useQuery({
    queryKey: queryKeys.system.deployment,
    queryFn: () => api.get<DeploymentInfo>('/system/deployment-info'),
  })

  const { data: databaseStats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.system.database,
    queryFn: () => api.get<DatabaseStats>('/system/database-stats'),
  })

  const { data: idleTimeout } = useQuery({
    queryKey: queryKeys.system.idleTimeout,
    queryFn: () => api.get<{ minutes: number }>('/system/idle-timeout'),
  })

  useEffect(() => {
    if (idleTimeout?.minutes) {
      setIdleMinutes(idleTimeout.minutes)
    }
  }, [idleTimeout])

  const saveTimeoutMutation = useMutation({
    mutationFn: (minutes: number) =>
      api.put('/system/idle-timeout', { minutes }),
    onSuccess: () => {
      toast.success('Session timeout updated')
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.idleTimeout,
      })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update timeout'),
  })

  const recalculateMutation = useMutation({
    mutationFn: () => api.post('/system/recalculate-stats'),
    onSuccess: () => {
      toast.success('Stats recalculated successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.system.database })
      setConfirmRecalculate(false)
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to recalculate stats'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="size-6" />
          System Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          View system information and manage settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Session Timeout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {timeoutPresets.map((minutes) => (
              <Button
                key={minutes}
                variant={idleMinutes === minutes ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIdleMinutes(minutes)}
              >
                {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Custom timeout
              </span>
              <span className="text-sm font-medium">
                {idleMinutes >= 60
                  ? `${Math.floor(idleMinutes / 60)}h ${idleMinutes % 60 > 0 ? `${idleMinutes % 60}m` : ''}`
                  : `${idleMinutes}m`}
              </span>
            </div>
            <Slider
              value={[idleMinutes]}
              onValueChange={([v]) => setIdleMinutes(v)}
              min={5}
              max={480}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5m</span>
              <span>8h</span>
            </div>
          </div>
          <Button
            onClick={() => saveTimeoutMutation.mutate(idleMinutes)}
            disabled={saveTimeoutMutation.isPending}
          >
            {saveTimeoutMutation.isPending && (
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Save Timeout
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="size-5" />
            Deployment Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deploymentLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : deploymentInfo ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Convex URL</span>
                  <a
                    href={deploymentInfo.convexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {deploymentInfo.convexUrl.length > 30
                      ? `${deploymentInfo.convexUrl.slice(0, 30)}...`
                      : deploymentInfo.convexUrl}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deployment Name</span>
                  <span className="font-mono">
                    {deploymentInfo.deploymentName}
                  </span>
                </div>
                <Separator />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge
                    variant={
                      deploymentInfo.nodeEnv === 'production'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {deploymentInfo.nodeEnv}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">{deploymentInfo.appVersion}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform</span>
                  <span>{deploymentInfo.platform}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Failed to load deployment info
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Database Stats
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRecalculate(true)}
            >
              <RefreshCw className="mr-1 size-4" />
              Recalculate Stats
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : databaseStats ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Records
                </span>
                <span className="text-lg font-bold">
                  {databaseStats.totalRecords.toLocaleString()}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {databaseStats.tables.map((table) => (
                  <div key={table.key} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{table.key}</p>
                    <p className="text-xl font-bold">
                      {table.count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Failed to load database stats
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmRecalculate}
        onOpenChange={(open) => !open && setConfirmRecalculate(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalculate Stats</DialogTitle>
            <DialogDescription>
              This will recalculate all system statistics. This may take a
              moment.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to recalculate all system statistics?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRecalculate(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
            >
              {recalculateMutation.isPending && (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Recalculate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
