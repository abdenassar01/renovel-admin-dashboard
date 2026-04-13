import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { LicenseType } from '#/lib/types'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/licenses')({
  component: LicensesPage,
})

const licenseTypeSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0, 'Must be >= 0'),
  priceYearly: z.coerce.number().min(0, 'Must be >= 0'),
  isActive: z.boolean(),
})

function LicensesPage() {
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    license: LicenseType | null
  }>({ open: false, license: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    license: LicenseType | null
  }>({ open: false, license: null })
  const queryClient = useQueryClient()

  const { data: licenseTypes = [], isLoading } = useQuery({
    queryKey: queryKeys.licenses.types,
    queryFn: () => api.get<LicenseType[]>('/licenses/types'),
  })

  function invalidateLicenses() {
    queryClient.invalidateQueries({ queryKey: queryKeys.licenses.types })
  }

  const form = useForm({
    defaultValues: {
      key: '',
      label: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true,
    },
    validators: {
      onChange: licenseTypeSchema as any,
    },
    onSubmit: ({ value }) => {
      if (editDialog.license) {
        updateMutation.mutate({ id: editDialog.license._id, ...value })
      } else {
        createMutation.mutate(value)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof licenseTypeSchema>) =>
      api.post('/licenses/types', data),
    onSuccess: () => {
      toast.success('License type created')
      invalidateLicenses()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create license type'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & z.infer<typeof licenseTypeSchema>) =>
      api.put(`/licenses/types/${id}`, data),
    onSuccess: () => {
      toast.success('License type updated')
      invalidateLicenses()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update license type'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/licenses/types/${id}`),
    onSuccess: () => {
      toast.success('License type deleted')
      invalidateLicenses()
      setDeleteDialog({ open: false, license: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete license type'),
  })

  function openCreateDialog() {
    form.reset()
    setEditDialog({ open: true, license: null })
  }

  function openEditDialog(license: LicenseType) {
    form.reset()
    form.setFieldValue('key', license.key)
    form.setFieldValue('label', license.label)
    form.setFieldValue('description', license.description ?? '')
    form.setFieldValue('priceMonthly', license.priceMonthly)
    form.setFieldValue('priceYearly', license.priceYearly)
    form.setFieldValue('isActive', license.isActive)
    setEditDialog({ open: true, license })
  }

  function closeEditDialog() {
    setEditDialog({ open: false, license: null })
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
            <KeyRound className="size-6" />
            License Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage license types and pricing
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Create License Type
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Monthly Price</TableHead>
              <TableHead>Yearly Price</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenseTypes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No license types found
                </TableCell>
              </TableRow>
            ) : (
              licenseTypes.map((lt) => (
                <TableRow key={lt._id}>
                  <TableCell className="font-mono text-sm">{lt.key}</TableCell>
                  <TableCell className="font-medium">{lt.label}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {lt.description || '—'}
                  </TableCell>
                  <TableCell>${lt.priceMonthly}</TableCell>
                  <TableCell>${lt.priceYearly}</TableCell>
                  <TableCell>
                    {lt.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(lt)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setDeleteDialog({ open: true, license: lt })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.license ? 'Edit License Type' : 'Create License Type'}
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
            <form.Field name="key">
              {(field) => (
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. leadsManagement"
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {
                          (field.state.meta.errors[0] as { message?: string })
                            ?.message
                        }
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Field name="label">
              {(field) => (
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Leads Management"
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {
                          (field.state.meta.errors[0] as { message?: string })
                            ?.message
                        }
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description..."
                  />
                </div>
              )}
            </form.Field>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="priceMonthly">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Monthly Price ($)</Label>
                    <Input
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
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
              <form.Field name="priceYearly">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Yearly Price ($)</Label>
                    <Input
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
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
            </div>
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
                {editDialog.license ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, license: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete License Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.license?.label}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, license: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.license)
                  deleteMutation.mutate(deleteDialog.license._id)
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
