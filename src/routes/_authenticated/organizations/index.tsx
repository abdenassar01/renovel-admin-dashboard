import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Check, X, Pause, Play, Building2, Eye } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { Organization, ApprovalStatus } from '#/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Textarea } from '#/components/ui/textarea'

export const Route = createFileRoute('/_authenticated/organizations/')({
  component: OrganizationsPage,
})

const statusConfig: Record<
  ApprovalStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  denied: { label: 'Denied', variant: 'destructive' },
  suspended: { label: 'Suspended', variant: 'secondary' },
}

function StatusBadge({ status }: { status?: ApprovalStatus }) {
  if (!status) return null
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function OrganizationsPage() {
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    org: Organization | null
    action: 'approve' | 'deny' | 'suspend' | 'reactivate' | null
  }>({ open: false, org: null, action: null })
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: queryKeys.organizations.list(status),
    queryFn: () =>
      api.get<Organization[]>(
        `/organizations${status && status !== 'all' ? `?status=${status}` : ''}`,
      ),
  })

  const filtered = organizations.filter((org) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      org.name?.toLowerCase().includes(q) ||
      org.orgNumber?.toLowerCase().includes(q) ||
      org.email?.toLowerCase().includes(q)
    )
  })

  const invalidateOrganizations = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all })
  }

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      notes: actionNotes,
    }: {
      id: string
      action: 'approve' | 'deny' | 'suspend' | 'reactivate'
      notes: string
    }) => {
      return api.put(`/organizations/${id}/${action}`, { notes: actionNotes })
    },
    onSuccess: (_, variables) => {
      toast.success(`Organization ${variables.action}d successfully`)
      invalidateOrganizations()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message || 'Action failed')
    },
  })

  function closeDialog() {
    setActionDialog({ open: false, org: null, action: null })
    setNotes('')
  }

  function openActionDialog(
    org: Organization,
    action: 'approve' | 'deny' | 'suspend' | 'reactivate',
  ) {
    setActionDialog({ open: true, org, action })
    setNotes('')
  }

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="size-6" />
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage organizations and their approval status
          </p>
        </div>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <div className="flex items-center justify-between">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, org number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[320px] pl-9"
            />
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No organizations found
              </div>
            ) : (
              <div className="rounded-lg border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Org Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((org) => (
                      <TableRow key={org._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {org.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{org.orgNumber || '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={org.approvalStatus} />
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {org.subscriptionPlan || 'free'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {org.createdAt
                            ? new Date(org.createdAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate({
                                  to: '/organizations/$orgId',
                                  params: { orgId: org._id },
                                })
                              }
                            >
                              <Eye className="mr-1 size-4" />
                              View Details
                            </Button>
                            {org.approvalStatus === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() =>
                                    openActionDialog(org, 'approve')
                                  }
                                >
                                  <Check className="mr-1 size-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openActionDialog(org, 'deny')}
                                >
                                  <X className="mr-1 size-4" />
                                  Deny
                                </Button>
                              </>
                            )}
                            {org.approvalStatus === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700"
                                onClick={() => openActionDialog(org, 'suspend')}
                              >
                                <Pause className="mr-1 size-4" />
                                Suspend
                              </Button>
                            )}
                            {org.approvalStatus === 'suspended' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() =>
                                  openActionDialog(org, 'reactivate')
                                }
                              >
                                <Play className="mr-1 size-4" />
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Organization'}
              {actionDialog.action === 'deny' && 'Deny Organization'}
              {actionDialog.action === 'suspend' && 'Suspend Organization'}
              {actionDialog.action === 'reactivate' &&
                'Reactivate Organization'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionDialog.org?.name}
            </p>
            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionDialog.org && actionDialog.action) {
                  actionMutation.mutate({
                    id: actionDialog.org._id,
                    action: actionDialog.action,
                    notes,
                  })
                }
              }}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending && (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
