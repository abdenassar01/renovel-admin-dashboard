import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  KeyRound,
  RotateCcw,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { User, UserRole } from '#/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Separator } from '#/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings/team')({
  component: TeamManagementPage,
})

const createUserSchema = z.object({
  email: z.string().email('Valid email required'),
  fullName: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['master', 'admin', 'user']),
})

const editUserSchema = z.object({
  name: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['master', 'admin', 'user']),
})

const permissionKeys = [
  'manageLeads',
  'viewStatistics',
  'manageBookings',
  'manageUsers',
  'manageSettings',
  'sendEmails',
  'viewAllLeads',
  'exportData',
] as const

const permissionLabels: Record<string, string> = {
  manageLeads: 'Manage Leads',
  viewStatistics: 'View Statistics',
  manageBookings: 'Manage Bookings',
  manageUsers: 'Manage Users',
  manageSettings: 'Manage Settings',
  sendEmails: 'Send Emails',
  viewAllLeads: 'View All Leads',
  exportData: 'Export Data',
}

const roleConfig: Record<
  UserRole,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  master: { label: 'Master', variant: 'default' },
  admin: { label: 'Admin', variant: 'secondary' },
  user: { label: 'User', variant: 'outline' },
}

type DialogMode = 'create' | 'edit' | 'delete' | 'permissions' | null

function TeamManagementPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => api.get<User[]>('/users'),
  })

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalUsers = users.length
  const masters = users.filter((u) => u.role === 'master').length
  const admins = users.filter((u) => u.role === 'admin').length
  const regular = users.filter((u) => u.role === 'user').length

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  }

  const createUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof createUserSchema>) =>
      api.post('/users', data),
    onSuccess: () => {
      toast.success('User created successfully')
      invalidateUsers()
      closeDialog()
    },
    onError: (error) => toast.error(error.message || 'Failed to create user'),
  })

  const updateUserRoleMutation = useMutation({
    mutationFn: ({
      id,
      role,
      ...data
    }: { id: string } & z.infer<typeof editUserSchema>) =>
      Promise.all([
        api.put(`/users/${id}/role`, { role }),
        api.put(`/users/${id}/profile`, data),
      ]),
    onSuccess: () => {
      toast.success('User updated successfully')
      invalidateUsers()
      closeDialog()
    },
    onError: (error) => toast.error(error.message || 'Failed to update user'),
  })

  const updatePermissionsMutation = useMutation({
    mutationFn: ({
      id,
      permissions: perms,
    }: {
      id: string
      permissions: Record<string, boolean>
    }) => api.put(`/users/${id}/permissions`, { permissions: perms }),
    onSuccess: () => {
      toast.success('Permissions updated')
      invalidateUsers()
      closeDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update permissions'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted')
      invalidateUsers()
      closeDialog()
    },
    onError: (error) => toast.error(error.message || 'Failed to delete user'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/reset-password`),
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to reset password'),
  })

  function closeDialog() {
    setDialogMode(null)
    setSelectedUser(null)
    setPermissions({})
  }

  function openPermissions(user: User) {
    setSelectedUser(user)
    const perms: Record<string, boolean> = {}
    for (const key of permissionKeys) {
      perms[key] = user.permissions?.[key] ?? false
    }
    setPermissions(perms)
    setDialogMode('permissions')
  }

  const createForm = useForm({
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      role: 'user' as UserRole,
    },
    validators: {
      onChange: createUserSchema as any,
    },
    onSubmit: ({ value }) => {
      createUserMutation.mutate(value)
    },
  })

  const editForm = useForm({
    defaultValues: {
      name: selectedUser?.name ?? '',
      fullName: selectedUser?.fullName ?? '',
      phone: selectedUser?.phone ?? '',
      role: (selectedUser?.role ?? 'user') as UserRole,
    },
    validators: {
      onChange: editUserSchema as any,
    },
    onSubmit: ({ value }) => {
      if (selectedUser) {
        updateUserRoleMutation.mutate({ id: selectedUser._id, ...value })
      }
    },
  })

  function getInitials(user: User) {
    return (user.name || user.fullName || user.email)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
            <Users className="size-6" />
            Team Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => {
            createForm.reset()
            setDialogMode('create')
          }}
        >
          <UserPlus className="mr-2 size-4" />
          Create User
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Masters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Regular Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regular}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No users found
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{getInitials(user)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {user.name || user.fullName || user.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={roleConfig[user.role].variant}>
                  {roleConfig[user.role].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {user.organizationId ? 'Has Org' : 'No Org'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(user._creationTime), 'MMM d, yyyy')}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user)
                        editForm.reset()
                        editForm.setFieldValue('name', user.name ?? '')
                        editForm.setFieldValue('fullName', user.fullName ?? '')
                        editForm.setFieldValue('phone', user.phone ?? '')
                        editForm.setFieldValue('role', user.role)
                        setDialogMode('edit')
                      }}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPermissions(user)}>
                      <KeyRound className="mr-2 size-4" />
                      Edit Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => resetPasswordMutation.mutate(user._id)}
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedUser(user)
                        setDialogMode('delete')
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={dialogMode === 'create'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              createForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <createForm.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
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
            </createForm.Field>
            <createForm.Field name="fullName">
              {(field) => (
                <div className="space-y-2">
                  <Label>Full Name</Label>
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
            </createForm.Field>
            <createForm.Field name="phone">
              {(field) => (
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </createForm.Field>
            <createForm.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </createForm.Field>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && (
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === 'edit' && !!selectedUser}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <editForm.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </editForm.Field>
            <editForm.Field name="fullName">
              {(field) => (
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </editForm.Field>
            <editForm.Field name="phone">
              {(field) => (
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </editForm.Field>
            <editForm.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </editForm.Field>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserRoleMutation.isPending}>
                {updateUserRoleMutation.isPending && (
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === 'delete' && !!selectedUser}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {selectedUser?.name || selectedUser?.email}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) deleteUserMutation.mutate(selectedUser._id)
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === 'permissions' && !!selectedUser}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Permissions — {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {permissionKeys.map((key) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm">{permissionLabels[key]}</span>
                <input
                  type="checkbox"
                  checked={permissions[key] ?? false}
                  onChange={(e) =>
                    setPermissions((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-input"
                />
              </label>
            ))}
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updatePermissionsMutation.mutate({
                    id: selectedUser._id,
                    permissions,
                  })
                }
              }}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending && (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
