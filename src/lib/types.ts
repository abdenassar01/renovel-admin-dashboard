export type UserRole = 'master' | 'admin' | 'user'
export type OrgRole = 'owner' | 'manager' | 'seller'
export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'suspended'
export type SubscriptionPlan =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom'
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'expired'
export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other'
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'
export type OnboardingStep =
  | 'organization'
  | 'contact'
  | 'branding'
  | 'features'
  | 'completed'

export type FeatureFlags = {
  leadsManagement: boolean
  offerBuilder: boolean
  inventory: boolean
  registering: boolean
  bookingManagement: boolean
  teamChat: boolean
  aiIntegration: boolean
  statistics: boolean
  emailIntegration: boolean
  customBranding: boolean
  apiAccess: boolean
  multiUser: boolean
}

export type PlanLimits = {
  maxUsers?: number
  maxLeads?: number
  maxBookings?: number
  maxStorageMB?: number
}

export type OrgSettings = {
  primaryColor?: string
  secondaryColor?: string
  timezone?: string
  currency?: string
  locale?: string
}

export type ContactPerson = {
  name?: string
  email?: string
  phone?: string
  role?: string
}

export type PurchasedLicenses = {
  leadsManagement?: number
  offerBuilder?: number
  inventory?: number
  registering?: number
  bookingManagement?: number
  receivedEmails?: number
  statistics?: number
  teamChat?: number
  aiAssistant?: number
  schema?: number
}

export type LicenseTypeKey =
  | 'leadsManagement'
  | 'offerBuilder'
  | 'inventory'
  | 'registering'
  | 'bookingManagement'
  | 'receivedEmails'
  | 'statistics'
  | 'teamChat'
  | 'aiAssistant'
  | 'schema'

export interface User {
  _id: string
  name?: string
  email: string
  role: UserRole
  image?: string
  fullName?: string
  phone?: string
  userId?: string
  avatarFileId?: string
  notificationsEnabled?: boolean
  acceptEmails?: boolean
  organizationId?: string
  organizationRole?: OrgRole
  permissions?: {
    manageLeads?: boolean
    viewStatistics?: boolean
    manageBookings?: boolean
    manageUsers?: boolean
    manageSettings?: boolean
    sendEmails?: boolean
    viewAllLeads?: boolean
    exportData?: boolean
  }
  activeLicenses?: LicenseTypeKey[]
  _creationTime: number
}

export interface Organization {
  _id: string
  name: string
  slug?: string
  logoFileId?: string
  address?: string
  postalCode?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  orgNumber?: string
  vatNumber?: string
  contactPerson?: ContactPerson
  subscriptionPlan?: SubscriptionPlan
  subscriptionStatus?: SubscriptionStatus
  approvalStatus?: ApprovalStatus
  approvalNotes?: string
  approvedBy?: string
  approvedAt?: number
  features?: FeatureFlags
  planLimits?: PlanLimits
  trialEndsAt?: number
  settings?: OrgSettings
  onboardingCompleted?: boolean
  onboardingStep?: OnboardingStep
  createdAt: number
  createdBy?: string
  purchasedLicenses?: PurchasedLicenses
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  _creationTime: number
}

export interface OrganizationStats {
  totalMembers: number
  owners: number
  managers: number
  sellers: number
}

export interface PlanTemplate {
  _id: string
  name: string
  slug: string
  description?: string
  priceMonthly?: number
  priceYearly?: number
  features: FeatureFlags
  limits?: PlanLimits
  isActive: boolean
  sortOrder?: number
  _creationTime: number
}

export interface Feedback {
  _id: string
  userId?: string
  screenshotStorageId?: string
  description: string
  category?: FeedbackCategory
  url?: string
  userAgent?: string
  screenResolution?: string
  timestamp: number
  status?: FeedbackStatus
  screenshotUrl?: string
  userName?: string
  userEmail?: string
  _creationTime: number
}

export interface LicenseType {
  _id: string
  key: string
  label: string
  description?: string
  priceMonthly: number
  priceYearly: number
  isActive: boolean
  order: number
  _creationTime: number
}

export interface Registration {
  _id: string
  name: string
  email: string
  userId?: string
  createdAt: number
  ipAddress?: string
  userAgent?: string
  status: RegistrationStatus
  userName?: string
  userRole?: string
  _creationTime: number
}

export interface Activity {
  _id: string
  userId: string
  type: string
  content: string
  leadId?: string
  noteId?: string
  bookingId?: string
  categoryId?: string
  targetUserId?: string
  createdAt: number
  fromCategoryId?: string
  toCategoryId?: string
  metadata?: Record<string, unknown>
  organizationId?: string
  userName?: string
  _creationTime: number
}

export interface Category {
  _id: string
  name: string
  slug?: string
  color: string
  order: number
  organizationId?: string
  _creationTime: number
}

export interface LeadType {
  _id: string
  label: string
  bonusAmount: number
  isActive: boolean
  order: number
  organizationId?: string
  _creationTime: number
}

export interface PriceSuggestion {
  _id: string
  label: string
  text?: string
  isActive: boolean
  order: number
  organizationId?: string
  _creationTime: number
}

export interface BokadBesok {
  _id: string
  label: string
  text?: string
  description?: string
  date?: string
  time?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  notes?: string
  isActive: boolean
  order: number
  organizationId?: string
  _creationTime: number
}

export interface DeletedLead {
  _id: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  description?: string
  source?: string
  isDeleted: boolean
  organizationId?: string
  _creationTime: number
}

export interface DeploymentInfo {
  convexUrl: string
  deploymentName: string
  nodeEnv: string
  appVersion: string
  platform: string
}

export interface DatabaseStats {
  tables: { key: string; count: number }[]
  totalRecords: number
}

export interface DashboardStats {
  totalOrganizations: number
  pendingOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalFeedback: number
  openFeedback: number
  totalRegistrations: number
  pendingRegistrations: number
}

export interface AuthSession {
  user: User
  token: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  hasMore: boolean
  cursor?: string
}
