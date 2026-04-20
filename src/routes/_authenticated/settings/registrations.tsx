import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ClipboardList, Search, Check, X, Trash2 } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { Booking, BookingStatus } from '#/lib/types'
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
  component: BookingsPage,
})

const statusConfig: Record<
  BookingStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  signed: { label: 'Signed', variant: 'default' },
  refused: { label: 'Refused', variant: 'destructive' },
}

function BookingsPage() {
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    booking: Booking | null
  }>({ open: false, booking: null })
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: queryKeys.registrations.list(status),
    queryFn: () => api.get<Booking[]>('/registrations'),
  })

  const filtered = bookings
    .filter((b) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.workType?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q)
      )
    })
    .filter((b) => {
      if (!status || status === 'all') return true
      return b.status === status
    })

  function invalidateBookings() {
    queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all })
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status: newStatus,
    }: {
      id: string
      status: BookingStatus
    }) => api.put(`/registrations/${id}/status`, { status: newStatus }),
    onSuccess: (_, variables) => {
      toast.success(`Booking ${variables.status}`)
      invalidateBookings()
    },
    onError: (error) => toast.error(error.message || 'Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/registrations/${id}`),
    onSuccess: () => {
      toast.success('Booking deleted')
      invalidateBookings()
      setDeleteDialog({ open: false, booking: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete booking'),
  })

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'signed', label: 'Signed' },
    { value: 'refused', label: 'Refused' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardList className="size-6" />
          Bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and manage booking requests
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
              placeholder="Search by name, email, or work type..."
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
                No bookings found
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Work Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.workType || '\u2014'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusConfig[b.status]?.variant ?? 'outline'
                            }
                          >
                            {statusConfig[b.status]?.label ?? b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.adminDate
                            ? format(new Date(b.adminDate), 'MMM d, yyyy')
                            : format(new Date(b.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.city || '\u2014'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {b.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: b._id,
                                      status: 'signed',
                                    })
                                  }
                                >
                                  <Check className="mr-1 size-4" />
                                  Sign
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: b._id,
                                      status: 'refused',
                                    })
                                  }
                                >
                                  <X className="mr-1 size-4" />
                                  Refuse
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
                                  booking: b,
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
          !open && setDeleteDialog({ open: false, booking: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the booking for{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.booking?.name}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, booking: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.booking)
                  deleteMutation.mutate(deleteDialog.booking._id)
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
