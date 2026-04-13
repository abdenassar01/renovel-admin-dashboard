import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import type { Category } from '#/lib/types'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/settings/categories')({
  component: CategoriesPage,
})

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  color: z.string().min(1, 'Color is required'),
  order: z.coerce.number().min(0),
})

function CategoriesPage() {
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    category: Category | null
  }>({ open: false, category: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    category: Category | null
  }>({ open: false, category: null })
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<Category[]>('/categories'),
  })

  const sorted = [...categories].sort((a, b) => a.order - b.order)

  function invalidateCategories() {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
  }

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      color: '#3b82f6',
      order: 0,
    },
    validators: {
      onChange: categorySchema as any,
    },
    onSubmit: ({ value }) => {
      if (editDialog.category) {
        updateMutation.mutate({ id: editDialog.category._id, ...value })
      } else {
        createMutation.mutate(value)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof categorySchema>) =>
      api.post('/categories', data),
    onSuccess: () => {
      toast.success('Category created')
      invalidateCategories()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & z.infer<typeof categorySchema>) =>
      api.put(`/categories/${id}`, data),
    onSuccess: () => {
      toast.success('Category updated')
      invalidateCategories()
      closeEditDialog()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted')
      invalidateCategories()
      setDeleteDialog({ open: false, category: null })
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to delete category'),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      api.put(`/categories/${id}/reorder`, { direction }),
    onSuccess: () => {
      invalidateCategories()
    },
    onError: (error) =>
      toast.error(error.message || 'Failed to reorder category'),
  })

  function openCreateDialog() {
    form.reset()
    form.setFieldValue('order', sorted.length)
    setEditDialog({ open: true, category: null })
  }

  function openEditDialog(category: Category) {
    form.reset()
    form.setFieldValue('name', category.name)
    form.setFieldValue('slug', category.slug ?? '')
    form.setFieldValue('color', category.color)
    form.setFieldValue('order', category.order)
    setEditDialog({ open: true, category })
  }

  function closeEditDialog() {
    setEditDialog({ open: false, category: null })
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
            <FolderOpen className="size-6" />
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage lead categories and their order
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Create Category
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No categories found
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((category, index) => (
            <div
              key={category._id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                {category.slug && (
                  <span className="text-sm text-muted-foreground">
                    {category.slug}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  #{category.order}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() =>
                    reorderMutation.mutate({
                      id: category._id,
                      direction: 'up',
                    })
                  }
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === sorted.length - 1}
                  onClick={() =>
                    reorderMutation.mutate({
                      id: category._id,
                      direction: 'down',
                    })
                  }
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteDialog({ open: true, category })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
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
              {editDialog.category ? 'Edit Category' : 'Create Category'}
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
            <form.Field name="color">
              {(field) => (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="size-10 cursor-pointer rounded border"
                    />
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
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
                {editDialog.category ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, category: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteDialog.category?.name}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, category: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.category)
                  deleteMutation.mutate(deleteDialog.category._id)
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
