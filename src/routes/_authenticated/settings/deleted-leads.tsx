import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Trash2, RotateCcw, AlertTriangle, Search } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { DeletedLead } from '#/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/deleted-leads')({
  component: DeletedLeadsPage,
})

function DeletedLeadsPage() {
  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    lead: DeletedLead | null
    action: 'restore' | 'permanentDelete' | null
  }>({ open: false, lead: null, action: null })
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading } = useQuery({
    queryKey: queryKeys.deletedLeads.all,
    queryFn: () => api.get<DeletedLead[]>('/leads/deleted'),
  })

  const filtered = leads.filter((lead) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      lead.customerName?.toLowerCase().includes(q) ||
      lead.customerEmail?.toLowerCase().includes(q) ||
      lead.description?.toLowerCase().includes(q)
    )
  })

  function invalidateLeads() {
    queryClient.invalidateQueries({ queryKey: queryKeys.deletedLeads.all })
  }

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.post(`/leads/${id}/restore`),
    onSuccess: () => {
      toast.success('Lead restored successfully')
      invalidateLeads()
      closeDialog()
    },
    onError: (error) => toast.error(error.message || 'Failed to restore lead'),
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}/permanent`),
    onSuccess: () => {
      toast.success('Lead permanently deleted')
      invalidateLeads()
      closeDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to permanently delete lead'),
  })

  function closeDialog() {
    setConfirmDialog({ open: false, lead: null, action: null })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trash2 className="size-6" />
          Deleted Leads
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage soft-deleted leads
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No deleted leads found
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Deleted Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell className="font-medium">
                    {lead.customerName || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.customerEmail || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.customerPhone || '—'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {lead.description
                      ? lead.description.length > 50
                        ? `${lead.description.slice(0, 50)}...`
                        : lead.description
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.source || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(lead._creationTime), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            lead,
                            action: 'restore',
                          })
                        }
                      >
                        <RotateCcw className="mr-1 size-4" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            lead,
                            action: 'permanentDelete',
                          })
                        }
                      >
                        <AlertTriangle className="mr-1 size-4" />
                        Permanent Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent
          className={
            confirmDialog.action === 'permanentDelete'
              ? 'border-destructive/50'
              : ''
          }
        >
          <DialogHeader>
            <DialogTitle
              className={
                confirmDialog.action === 'permanentDelete'
                  ? 'text-destructive'
                  : ''
              }
            >
              {confirmDialog.action === 'restore'
                ? 'Restore Lead'
                : 'Permanently Delete Lead'}
            </DialogTitle>
            {confirmDialog.action === 'permanentDelete' && (
              <DialogDescription className="text-destructive">
                This action is irreversible. The lead will be permanently
                removed from the database.
              </DialogDescription>
            )}
          </DialogHeader>
          {confirmDialog.action === 'restore' ? (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to restore{' '}
              <span className="font-medium text-foreground">
                {confirmDialog.lead?.customerName || 'this lead'}
              </span>
              ?
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-destructive">
                {confirmDialog.lead?.customerName || 'this lead'}
              </span>
              ? This cannot be undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {confirmDialog.action === 'restore' ? (
              <Button
                onClick={() => {
                  if (confirmDialog.lead)
                    restoreMutation.mutate(confirmDialog.lead._id)
                }}
                disabled={restoreMutation.isPending}
              >
                {restoreMutation.isPending && (
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Restore
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmDialog.lead)
                    permanentDeleteMutation.mutate(confirmDialog.lead._id)
                }}
                disabled={permanentDeleteMutation.isPending}
              >
                {permanentDeleteMutation.isPending && (
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Permanently Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
