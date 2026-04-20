import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Check,
  X,
  Pause,
  Play,
  Save,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type {
  Organization,
  OrganizationStats,
  User,
  ApprovalStatus,
  FeatureFlags,
  PlanLimits,
  PlanTemplate,
} from '#/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/_authenticated/organizations/$orgId')({
  component: OrganizationDetailPage,
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

function OrganizationDetailPage() {
  const { orgId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [notes, setNotes] = useState('')
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures)
  const [planLimits, setPlanLimits] = useState<PlanLimits>({})
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: 'approve' | 'deny' | 'suspend' | 'reactivate' | null
  }>({ open: false, action: null })
  const [actionNotes, setActionNotes] = useState('')

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: () => api.get<Organization>(`/organizations/${orgId}`),
    enabled: !!orgId,
  })

  const { data: stats } = useQuery({
    queryKey: queryKeys.organizations.stats(orgId),
    queryFn: () => api.get<OrganizationStats>(`/organizations/${orgId}/stats`),
    enabled: !!orgId,
  })

  const { data: members = [] } = useQuery({
    queryKey: queryKeys.organizations.members(orgId),
    queryFn: () => api.get<User[]>(`/organizations/${orgId}/members`),
    enabled: !!orgId,
  })

  const { data: planTemplates = [] } = useQuery({
    queryKey: queryKeys.planTemplates.all,
    queryFn: () => api.get<PlanTemplate[]>('/plan-templates'),
  })

  useEffect(() => {
    if (org) {
      setNotes(org.approvalNotes || '')
      setFeatures(org.features || { ...defaultFeatures })
      setPlanLimits(org.planLimits || {})
    }
  }, [org])

  function invalidateOrg() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.organizations.detail(orgId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.organizations.stats(orgId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.organizations.members(orgId),
    })
    queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all })
  }

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      notes: n,
    }: {
      action: 'approve' | 'deny' | 'suspend' | 'reactivate'
      notes: string
    }) => {
      return api.put(`/organizations/${orgId}/${action}`, { notes: n })
    },
    onSuccess: (_, variables) => {
      toast.success(`Organization ${variables.action}d successfully`)
      invalidateOrg()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message || 'Action failed')
    },
  })

  const notesMutation = useMutation({
    mutationFn: (newNotes: string) =>
      api.put(`/organizations/${orgId}/notes`, { notes: newNotes }),
    onSuccess: () => {
      toast.success('Notes updated')
      invalidateOrg()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update notes')
    },
  })

  const featuresMutation = useMutation({
    mutationFn: (newFeatures: FeatureFlags) =>
      api.put(`/organizations/${orgId}/features`, {
        features: newFeatures,
        planLimits: org?.planLimits,
      }),
    onSuccess: () => {
      toast.success('Features updated')
      invalidateOrg()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update features')
    },
  })

  const planLimitsMutation = useMutation({
    mutationFn: (newLimits: PlanLimits) =>
      api.put(`/organizations/${orgId}/features`, {
        features: org?.features || features,
        planLimits: newLimits,
      }),
    onSuccess: () => {
      toast.success('Plan limits updated')
      invalidateOrg()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update plan limits')
    },
  })

  const applyTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.post(`/plan-templates/${templateId}/apply/${orgId}`),
    onSuccess: () => {
      toast.success('Plan template applied')
      invalidateOrg()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to apply template')
    },
  })

  function closeDialog() {
    setActionDialog({ open: false, action: null })
    setActionNotes('')
  }

  function toggleFeature(key: keyof FeatureFlags, value: boolean) {
    setFeatures((prev) => ({ ...prev, [key]: value }))
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Organization not found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/organizations' })}
        >
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {org.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {org.email}
                </span>
              )}
              <StatusBadge status={org.approvalStatus} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {org.approvalStatus === 'pending' && (
            <>
              <Button
                className="text-green-600 hover:text-green-700"
                variant="outline"
                size="sm"
                onClick={() =>
                  setActionDialog({ open: true, action: 'approve' })
                }
              >
                <Check className="mr-1 size-4" />
                Approve
              </Button>
              <Button
                className="text-red-600 hover:text-red-700"
                variant="outline"
                size="sm"
                onClick={() => setActionDialog({ open: true, action: 'deny' })}
              >
                <X className="mr-1 size-4" />
                Deny
              </Button>
            </>
          )}
          {org.approvalStatus === 'approved' && (
            <Button
              className="text-yellow-600 hover:text-yellow-700"
              variant="outline"
              size="sm"
              onClick={() => setActionDialog({ open: true, action: 'suspend' })}
            >
              <Pause className="mr-1 size-4" />
              Suspend
            </Button>
          )}
          {org.approvalStatus === 'suspended' && (
            <Button
              className="text-green-600 hover:text-green-700"
              variant="outline"
              size="sm"
              onClick={() =>
                setActionDialog({ open: true, action: 'reactivate' })
              }
            >
              <Play className="mr-1 size-4" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="features">Features & Plan</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {org.contactPerson?.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span>{org.contactPerson.name}</span>
                    {org.contactPerson.role && (
                      <span className="text-muted-foreground">
                        ({org.contactPerson.role})
                      </span>
                    )}
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{org.email}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{org.phone}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="size-4 text-muted-foreground" />
                    <span>{org.website}</span>
                  </div>
                )}
                {(org.address || org.city || org.postalCode || org.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>
                      {[org.address, org.postalCode, org.city, org.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Org Number</span>
                  <span>{org.orgNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT Number</span>
                  <span>{org.vatNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="capitalize">
                    {org.subscriptionPlan || 'free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subscription Status
                  </span>
                  <span className="capitalize">
                    {org.subscriptionStatus || '—'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {org.createdAt
                      ? new Date(org.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                {org.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{new Date(org.approvedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {org.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial Ends</span>
                    <span>
                      {new Date(org.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Members</span>
                  <span>{stats?.totalMembers ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owners</span>
                  <span>{stats?.owners ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Managers</span>
                  <span>{stats?.managers ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sellers</span>
                  <span>{stats?.sellers ?? '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Plan Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Users</span>
                  <span>{org.planLimits?.maxUsers ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Leads</span>
                  <span>{org.planLimits?.maxLeads ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Bookings</span>
                  <span>{org.planLimits?.maxBookings ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Max Storage (MB)
                  </span>
                  <span>{org.planLimits?.maxStorageMB ?? '—'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members found
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback>
                            {(member.name || member.email)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {member.name || member.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {member.organizationRole || member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(featureLabels) as (keyof FeatureFlags)[]).map(
                  (key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{featureLabels[key]}</span>
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) =>
                          toggleFeature(key, checked)
                        }
                      />
                    </div>
                  ),
                )}
                <Button
                  onClick={() => featuresMutation.mutate(features)}
                  disabled={featuresMutation.isPending}
                  size="sm"
                >
                  <Save className="mr-1 size-4" />
                  Save Features
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apply Plan Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {planTemplates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() =>
                      applyTemplateMutation.mutate(selectedTemplate)
                    }
                    disabled={
                      !selectedTemplate || applyTemplateMutation.isPending
                    }
                    size="sm"
                  >
                    Apply Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Plan Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="w-28 text-sm text-muted-foreground">
                        Max Users
                      </label>
                      <Input
                        type="number"
                        value={planLimits.maxUsers ?? ''}
                        onChange={(e) =>
                          setPlanLimits((prev) => ({
                            ...prev,
                            maxUsers: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        placeholder="Unlimited"
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-28 text-sm text-muted-foreground">
                        Max Leads
                      </label>
                      <Input
                        type="number"
                        value={planLimits.maxLeads ?? ''}
                        onChange={(e) =>
                          setPlanLimits((prev) => ({
                            ...prev,
                            maxLeads: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        placeholder="Unlimited"
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-28 text-sm text-muted-foreground">
                        Max Bookings
                      </label>
                      <Input
                        type="number"
                        value={planLimits.maxBookings ?? ''}
                        onChange={(e) =>
                          setPlanLimits((prev) => ({
                            ...prev,
                            maxBookings: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        placeholder="Unlimited"
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-28 text-sm text-muted-foreground">
                        Max Storage (MB)
                      </label>
                      <Input
                        type="number"
                        value={planLimits.maxStorageMB ?? ''}
                        onChange={(e) =>
                          setPlanLimits((prev) => ({
                            ...prev,
                            maxStorageMB: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        placeholder="Unlimited"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => planLimitsMutation.mutate(planLimits)}
                    disabled={planLimitsMutation.isPending}
                    size="sm"
                  >
                    <Save className="mr-1 size-4" />
                    Save Limits
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add notes about this organization..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <Button
                onClick={() => notesMutation.mutate(notes)}
                disabled={notesMutation.isPending}
                size="sm"
              >
                <Save className="mr-1 size-4" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
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
            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add optional notes..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionDialog.action) {
                  actionMutation.mutate({
                    action: actionDialog.action,
                    notes: actionNotes,
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
