import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { LayoutTemplate, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { PlanTemplate, FeatureFlags, PlanLimits } from '#/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Separator } from '#/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings/plan-templates')(
  {
    component: PlanTemplatesPage,
  },
)

const planTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0).optional(),
  priceYearly: z.coerce.number().min(0).optional(),
  isActive: z.boolean(),
})

const featureLabels: Record<keyof FeatureFlags, string> = {
  leadsManagement: 'Leads Management',
  offerBuilder: 'Offer Builder',
  inventory: 'Inventory',
  registering: 'Registering',
  bookingManagement: 'Booking Management',
  teamChat: 'Team Chat',
  aiIntegration: 'AI Integration',
  statistics: 'Statistics',
  emailIntegration: 'Email Integration',
  customBranding: 'Custom Branding',
  apiAccess: 'API Access',
  multiUser: 'Multi User',
}

const defaultFeatures: FeatureFlags = {
  leadsManagement: false,
  offerBuilder: false,
  inventory: false,
  registering: false,
  bookingManagement: false,
  teamChat: false,
  aiIntegration: false,
  statistics: false,
  emailIntegration: false,
  customBranding: false,
  apiAccess: false,
  multiUser: false,
}

function PlanTemplatesPage() {
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    template: PlanTemplate | null
  }>({ open: false, template: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    template: PlanTemplate | null
  }>({ open: false, template: null })
  const [features, setFeatures] = useState<FeatureFlags>({ ...defaultFeatures })
  const [limits, setLimits] = useState<PlanLimits>({})
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: queryKeys.planTemplates.all,
    queryFn: () => api.get<PlanTemplate[]>('/plan-templates'),
  })

  function invalidateTemplates() {
    queryClient.invalidateQueries({ queryKey: queryKeys.planTemplates.all })
  }

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true,
    },
    validators: {
      onChange: planTemplateSchema as any,
    },
    onSubmit: ({ value }) => {
      const payload = { ...value, features, limits }
      if (editDialog.template) {
        updateMutation.mutate({ id: editDialog.template._id, ...payload })
      } else {
        createMutation.mutate(payload)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/plan-templates', data),
    onSuccess: () => {
      toast.success('Plan template created')
      invalidateTemplates()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create template'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.put(`/plan-templates/${id}`, data),
    onSuccess: () => {
      toast.success('Plan template updated')
      invalidateTemplates()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update template'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plan-templates/${id}`),
    onSuccess: () => {
      toast.success('Plan template deleted')
      invalidateTemplates()
      setDeleteDialog({ open: false, template: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete template'),
  })

  function openCreateDialog() {
    form.reset()
    setFeatures({ ...defaultFeatures })
    setLimits({})
    setEditDialog({ open: true, template: null })
  }

  function openEditDialog(template: PlanTemplate) {
    form.reset()
    form.setFieldValue('name', template.name)
    form.setFieldValue('slug', template.slug)
    form.setFieldValue('description', template.description ?? '')
    form.setFieldValue('priceMonthly', template.priceMonthly ?? 0)
    form.setFieldValue('priceYearly', template.priceYearly ?? 0)
    form.setFieldValue('isActive', template.isActive)
    setFeatures(template.features ?? { ...defaultFeatures })
    setLimits(template.limits ?? {})
    setEditDialog({ open: true, template })
  }

  function closeEditDialog() {
    setEditDialog({ open: false, template: null })
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
            <LayoutTemplate className="size-6" />
            Plan Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage subscription plan templates
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No plan templates found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {template.slug}
                    </p>
                  </div>
                  {template.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-lg font-bold">
                      ${template.priceMonthly ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Yearly</p>
                    <p className="text-lg font-bold">
                      ${template.priceYearly ?? 0}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  {(
                    Object.entries(template.features ?? {}) as [
                      keyof FeatureFlags,
                      boolean,
                    ][]
                  )
                    .filter(([, v]) => v)
                    .map(([key]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1 text-sm"
                      >
                        <Check className="size-3 text-green-600" />
                        {featureLabels[key]}
                      </div>
                    ))}
                  {(
                    Object.entries(template.features ?? {}) as [
                      keyof FeatureFlags,
                      boolean,
                    ][]
                  ).filter(([, v]) => !v).length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <X className="size-3" />
                      {
                        (
                          Object.entries(template.features ?? {}) as [
                            keyof FeatureFlags,
                            boolean,
                          ][]
                        ).filter(([, v]) => !v).length
                      }{' '}
                      features disabled
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteDialog({ open: true, template })}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDialog.template
                ? 'Edit Plan Template'
                : 'Create Plan Template'}
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
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label>Name</Label>
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
            <form.Field name="slug">
              {(field) => (
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. professional"
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
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
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
                  </div>
                )}
              </form.Field>
            </div>
            <div className="space-y-3">
              <Label>Features</Label>
              {(Object.keys(featureLabels) as (keyof FeatureFlags)[]).map(
                (key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{featureLabels[key]}</span>
                    <Switch
                      size="sm"
                      checked={features[key] ?? false}
                      onCheckedChange={(checked) =>
                        setFeatures((prev) => ({
                          ...prev,
                          [key]: checked,
                        }))
                      }
                    />
                  </div>
                ),
              )}
            </div>
            <div className="space-y-3">
              <Label>Limits</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Max Users
                  </span>
                  <Input
                    type="number"
                    value={limits.maxUsers ?? ''}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        maxUsers: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Max Leads
                  </span>
                  <Input
                    type="number"
                    value={limits.maxLeads ?? ''}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        maxLeads: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Max Bookings
                  </span>
                  <Input
                    type="number"
                    value={limits.maxBookings ?? ''}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        maxBookings: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Max Storage (MB)
                  </span>
                  <Input
                    type="number"
                    value={limits.maxStorageMB ?? ''}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        maxStorageMB: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
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
                {editDialog.template ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, template: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.template?.name}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, template: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.template)
                  deleteMutation.mutate(deleteDialog.template._id)
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
