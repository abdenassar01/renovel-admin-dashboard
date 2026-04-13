import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { LeadType } from '#/lib/types'
import { Card, CardContent } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/lead-types')({
  component: LeadTypesPage,
})

const leadTypeSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  bonusAmount: z.coerce.number().min(0, 'Must be >= 0'),
  isActive: z.boolean(),
  order: z.coerce.number().min(0),
})

function LeadTypesPage() {
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    leadType: LeadType | null
  }>({ open: false, leadType: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    leadType: LeadType | null
  }>({ open: false, leadType: null })
  const queryClient = useQueryClient()

  const { data: leadTypes = [], isLoading } = useQuery({
    queryKey: queryKeys.leadTypes.all,
    queryFn: () => api.get<LeadType[]>('/lead-types'),
  })

  function invalidateLeadTypes() {
    queryClient.invalidateQueries({ queryKey: queryKeys.leadTypes.all })
  }

  const form = useForm({
    defaultValues: {
      label: '',
      bonusAmount: 0,
      isActive: true,
      order: 0,
    },
    validators: {
      onChange: leadTypeSchema as any,
    },
    onSubmit: ({ value }) => {
      if (editDialog.leadType) {
        updateMutation.mutate({ id: editDialog.leadType._id, ...value })
      } else {
        createMutation.mutate(value)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof leadTypeSchema>) =>
      api.post('/lead-types', data),
    onSuccess: () => {
      toast.success('Lead type created')
      invalidateLeadTypes()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create lead type'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & z.infer<typeof leadTypeSchema>) =>
      api.put(`/lead-types/${id}`, data),
    onSuccess: () => {
      toast.success('Lead type updated')
      invalidateLeadTypes()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update lead type'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lead-types/${id}`),
    onSuccess: () => {
      toast.success('Lead type deleted')
      invalidateLeadTypes()
      setDeleteDialog({ open: false, leadType: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete lead type'),
  })

  function openCreateDialog() {
    form.reset()
    form.setFieldValue('order', leadTypes.length)
    setEditDialog({ open: true, leadType: null })
  }

  function openEditDialog(lt: LeadType) {
    form.reset()
    form.setFieldValue('label', lt.label)
    form.setFieldValue('bonusAmount', lt.bonusAmount)
    form.setFieldValue('isActive', lt.isActive)
    form.setFieldValue('order', lt.order)
    setEditDialog({ open: true, leadType: lt })
  }

  function closeEditDialog() {
    setEditDialog({ open: false, leadType: null })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Tag className="size-6" />
            Lead Types
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage lead type categories and bonus amounts
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Create Lead Type
        </Button>
      </div>

      {leadTypes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No lead types found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leadTypes.map((lt) => (
            <Card key={lt._id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{lt.label}</h3>
                    <p className="text-lg font-bold text-primary">
                      {lt.bonusAmount} SEK
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {lt.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      #{lt.order}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(lt)}
                  >
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setDeleteDialog({ open: true, leadType: lt })
                    }
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.leadType ? 'Edit Lead Type' : 'Create Lead Type'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field name="label">
              {(field) => (
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {(field.state.meta.errors[0] as any)?.message ||
                          'Validation error'}
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Field name="bonusAmount">
              {(field) => (
                <div className="space-y-2">
                  <Label>Bonus Amount (SEK)</Label>
                  <Input
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {(field.state.meta.errors[0] as any)?.message ||
                          'Validation error'}
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Field name="isActive">
              {(field) => (
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="order">
              {(field) => (
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {editDialog.leadType ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, leadType: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.leadType?.label}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, leadType: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.leadType)
                  deleteMutation.mutate(deleteDialog.leadType._id)
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
