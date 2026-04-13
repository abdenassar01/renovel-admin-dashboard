export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    list: (status?: string) => ['organizations', 'list', status] as const,
    detail: (id: string) => ['organizations', 'detail', id] as const,
    stats: (id: string) => ['organizations', 'stats', id] as const,
    members: (id: string) => ['organizations', 'members', id] as const,
  },
  feedback: {
    all: ['feedback'] as const,
    list: (status?: string) => ['feedback', 'list', status] as const,
    detail: (id: string) => ['feedback', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  licenses: {
    types: ['licenses', 'types'] as const,
    usage: ['licenses', 'usage'] as const,
  },
  registrations: {
    all: ['registrations'] as const,
    list: (status?: string) => ['registrations', 'list', status] as const,
    detail: (id: string) => ['registrations', 'detail', id] as const,
  },
  activities: {
    list: (filters?: Record<string, unknown>) =>
      ['activities', 'list', filters] as const,
  },
  system: {
    deployment: ['system', 'deployment'] as const,
    database: ['system', 'database'] as const,
    idleTimeout: ['system', 'idle-timeout'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  leadTypes: {
    all: ['lead-types'] as const,
  },
  priceSuggestions: {
    all: ['price-suggestions'] as const,
  },
  planTemplates: {
    all: ['plan-templates'] as const,
  },
  deletedLeads: {
    all: ['deleted-leads'] as const,
  },
}
