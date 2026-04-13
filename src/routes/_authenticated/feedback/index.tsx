import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Search,
  MessageSquare,
  Clock,
  Image,
  ExternalLink,
  Eye,
} from 'lucide-react'
import type { Feedback, FeedbackStatus } from '#/lib/types'
import { api } from '#/lib/api-client'
import { queryKeys } from '#/lib/query-keys'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

export const Route = createFileRoute('/_authenticated/feedback/')({
  component: FeedbackPage,
})

const categoryConfig: Record<string, { label: string; className: string }> = {
  bug: {
    label: 'Bug',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  feature: {
    label: 'Feature',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  improvement: {
    label: 'Improvement',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  other: {
    label: 'Other',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  resolved: {
    label: 'Resolved',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  closed: {
    label: 'Closed',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

const statusOptions: FeedbackStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
]

function FeedbackPage() {
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  )
  const queryClient = useQueryClient()

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: queryKeys.feedback.list(status),
    queryFn: () =>
      api.get<Feedback[]>(
        `/feedback${status && status !== 'all' ? `?status=${status}` : ''}`,
      ),
  })

  const filteredFeedback = feedback.filter((f) =>
    f.description.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleStatusChange(id: string, newStatus: FeedbackStatus) {
    try {
      await api.put(`/feedback/${id}/status`, { status: newStatus })
      toast.success('Status updated successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all })
      if (selectedFeedback?._id === id) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus })
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Feedback Management
          </h1>
          <p className="text-muted-foreground">
            Review and manage user feedback submissions
          </p>
        </div>
        <MessageSquare className="size-8 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="mb-4 size-12" />
          <p className="text-lg font-medium">No feedback found</p>
          <p className="text-sm">
            {search
              ? 'Try adjusting your search terms'
              : 'No feedback submissions match the current filter'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Screenshot</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        categoryConfig[item.category ?? 'other']?.className
                      }
                    >
                      {categoryConfig[item.category ?? 'other']?.label ??
                        'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status ?? 'open'}
                      onValueChange={(value: FeedbackStatus) =>
                        handleStatusChange(item._id, value)
                      }
                    >
                      <SelectTrigger size="sm" className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusConfig[s]?.label ?? s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item._creationTime), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {item.screenshotUrl ? (
                      <a
                        href={item.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={item.screenshotUrl}
                          alt="Screenshot"
                          className="size-10 rounded border object-cover"
                        />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <Eye className="mr-1 size-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => !open && setSelectedFeedback(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      statusConfig[selectedFeedback.status ?? 'open']?.className
                    }
                  >
                    {statusConfig[selectedFeedback.status ?? 'open']?.label}
                  </Badge>
                  <Badge
                    className={
                      categoryConfig[selectedFeedback.category ?? 'other']
                        ?.className
                    }
                  >
                    {categoryConfig[selectedFeedback.category ?? 'other']
                      ?.label ?? 'Unknown'}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">
                  {selectedFeedback.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Submitted</p>
                  <p>
                    {format(
                      new Date(selectedFeedback._creationTime),
                      'MMM d, yyyy HH:mm',
                    )}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Screen Resolution
                  </p>
                  <p>{selectedFeedback.screenResolution ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">URL</p>
                  {selectedFeedback.url ? (
                    <a
                      href={selectedFeedback.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      {selectedFeedback.url.length > 40
                        ? `${selectedFeedback.url.slice(0, 40)}...`
                        : selectedFeedback.url}
                    </a>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    User Agent
                  </p>
                  <p className="truncate" title={selectedFeedback.userAgent}>
                    {selectedFeedback.userAgent ?? 'N/A'}
                  </p>
                </div>
              </div>

              {selectedFeedback.screenshotUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    <Image className="mr-1 inline size-4" />
                    Screenshot
                  </p>
                  <a
                    href={selectedFeedback.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={selectedFeedback.screenshotUrl}
                      alt="Feedback screenshot"
                      className="w-full rounded-lg border"
                    />
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 border-t pt-4">
                <p className="text-sm font-medium">Change status:</p>
                {statusOptions.map((s) => (
                  <Button
                    key={s}
                    variant={
                      selectedFeedback.status === s ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleStatusChange(selectedFeedback._id, s)}
                  >
                    {statusConfig[s]?.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
