import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ClipboardList,
  Search,
  Check,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { Registration, RegistrationStatus } from '#/lib/types'
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
import { Input } from '#/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/registrations')({
  component: RegistrationsPage,
})

const statusConfig: Record<
  RegistrationStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

function RegistrationsPage() {
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    registration: Registration | null
  }>({ open: false, registration: null })
  const queryClient = useQueryClient()

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: queryKeys.registrations.list(status),
    queryFn: () =>
      api.get<Registration[]>(
        `/registrations${status && status !== 'all' ? `?status=${status}` : ''}`,
      ),
  })

  const filtered = registrations.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
    )
  })

  function invalidateRegistrations() {
    queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all })
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status: newStatus,
    }: {
      id: string
      status: RegistrationStatus
    }) => api.put(`/registrations/${id}/status`, { status: newStatus }),
    onSuccess: (_, variables) => {
      toast.success(`Registration ${variables.status}`)
      invalidateRegistrations()
    },
    onError: (error) => toast.error(error.message || 'Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/registrations/${id}`),
    onSuccess: () => {
      toast.success('Registration deleted')
      invalidateRegistrations()
      setDeleteDialog({ open: false, registration: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete registration'),
  })

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardList className="size-6" />
          Registrations
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and manage user registration requests
        </p>
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
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px] pl-9"
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
                No registrations found
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((reg) => (
                      <TableRow key={reg._id}>
                        <TableCell className="font-medium">
                          {reg.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {reg.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[reg.status].variant}>
                            {statusConfig[reg.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(reg._creationTime), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {reg.userId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-primary"
                              asChild
                            >
                              <a href={`/users/${reg.userId}`}>
                                {reg.userName || reg.userId}
                                <ExternalLink className="ml-1 size-3" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {reg.ipAddress || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {reg.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: reg._id,
                                      status: 'approved',
                                    })
                                  }
                                >
                                  <Check className="mr-1 size-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: reg._id,
                                      status: 'rejected',
                                    })
                                  }
                                >
                                  <X className="mr-1 size-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  registration: reg,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
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
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, registration: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Registration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the registration for{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.registration?.name}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, registration: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.registration)
                  deleteMutation.mutate(deleteDialog.registration._id)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
