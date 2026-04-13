# Renovel Admin API Routes

This document lists all the HTTP API routes that need to be created in the main Renovel app to support the Admin Dashboard.

The admin dashboard calls these endpoints using React Query. All endpoints are prefixed with `/api` and expect/return JSON.

## Authentication

All endpoints (except auth) require a valid Bearer token in the `Authorization` header. Only users with the `master` role should be able to access these endpoints.

### SSO Login Flow

The admin dashboard uses **SSO-only authentication** via `renovel.se`. The flow is:

1. User clicks "Sign in with Renovel SSO" on `/login`
2. Dashboard redirects to `https://db.renovel.se/api/auth/sign-in?callbackURL=https://admin.renovel.se/login/callback`
3. User authenticates on `db.renovel.se` (using better-auth + OIDC provider)
4. On success, `db.renovel.se` redirects back to `https://admin.renovel.se/login/callback?token=<jwt>`
5. Dashboard calls `POST /api/auth/sso/verify` with the token to validate and get the session
6. If user role is `master`, access is granted; otherwise access is denied

### `POST /api/auth/sign-in`

SSO entry point on `db.renovel.se`. Authenticates the user and redirects back to the admin dashboard with a JWT token.

**Query Parameters:**

- `callbackURL` (required): The URL to redirect back to after authentication (e.g., `https://admin.renovel.se/login/callback`)

**Response:** Redirect to `callbackURL?token=<jwt>`

### `POST /api/auth/sso/verify`

Verify the SSO token received from the callback and create a session. Returns session token and user data.

**Request:**

```json
{ "token": "string (jwt from callback)" }
```

**Response:**

```json
{
  "user": { "_id": "string", "email": "string", "role": "master", "fullName": "string", ... },
  "token": "string"
}
```

### `POST /api/auth/logout`

Invalidate the current session.

### `GET /api/auth/session`

Get the current authenticated user. Returns the user object or 401.

**Response:**

```json
{ "_id": "string", "email": "string", "role": "master", "fullName": "string", ... }
```

---

## Dashboard

### `GET /api/dashboard/stats`

Get aggregated dashboard statistics.

**Response:**

```json
{
  "totalOrganizations": "number",
  "pendingOrganizations": "number",
  "activeOrganizations": "number",
  "totalUsers": "number",
  "totalFeedback": "number",
  "openFeedback": "number",
  "totalRegistrations": "number",
  "pendingRegistrations": "number"
}
```

---

## Organizations

### `GET /api/organizations`

List all organizations. Maps to `organizations/listAll` query.

**Query Parameters:**

- `status` (optional): `pending` | `approved` | `denied` | `suspended`

**Response:**

```json
[
  {
    "_id": "string",
    "name": "string",
    "slug": "string | null",
    "email": "string",
    "orgNumber": "string | null",
    "subscriptionPlan": "free | starter | professional | enterprise | custom",
    "subscriptionStatus": "active | past_due | canceled | trialing | expired",
    "approvalStatus": "pending | approved | denied | suspended",
    "createdAt": "number",
    ...
  }
]
```

### `GET /api/organizations/:id`

Get organization by ID. Maps to `organizations/getById` query.

**Response:** Single organization object.

### `GET /api/organizations/:id/stats`

Get organization member statistics. Maps to `organizations/getOrganizationStats` query.

**Response:**

```json
{
  "totalMembers": "number",
  "owners": "number",
  "managers": "number",
  "sellers": "number"
}
```

### `GET /api/organizations/:id/members`

Get all members of an organization. Maps to `organizations/getMembers` query.

**Response:** Array of User objects.

### `PUT /api/organizations/:id/approve`

Approve a pending organization. Maps to `organizations/approveOrganization` mutation.

**Request:**

```json
{
  "notes": "string (optional)",
  "features": { ... FeatureFlags (optional) },
  "planLimits": { ... PlanLimits (optional) },
  "subscriptionPlan": "string (optional)"
}
```

### `PUT /api/organizations/:id/deny`

Deny a pending organization. Maps to `organizations/denyOrganization` mutation.

**Request:**

```json
{ "notes": "string (optional)" }
```

### `PUT /api/organizations/:id/suspend`

Suspend an organization. Maps to `organizations/suspendOrganization` mutation.

**Request:**

```json
{ "notes": "string (optional)" }
```

### `PUT /api/organizations/:id/reactivate`

Reactivate a suspended organization. Maps to `organizations/reactivateOrganization` mutation.

**Request:**

```json
{ "notes": "string (optional)" }
```

### `PUT /api/organizations/:id/features`

Update organization features and plan limits. Maps to `organizations/updateFeatures` mutation.

**Request:**

```json
{
  "features": { ... FeatureFlags },
  "planLimits": { ... PlanLimits (optional)" }
}
```

### `PUT /api/organizations/:id/notes`

Update organization approval notes.

**Request:**

```json
{ "notes": "string" }
```

---

## Plan Templates

### `GET /api/plan-templates`

List all plan templates. Maps to `organizations/listPlanTemplates` query.

**Query Parameters:**

- `activeOnly` (optional): `true` to only return active templates

**Response:** Array of PlanTemplate objects.

### `POST /api/plan-templates`

Create a plan template. Maps to `organizations/createPlanTemplate` mutation.

**Request:**

```json
{
  "name": "string",
  "slug": "string",
  "description": "string (optional)",
  "priceMonthly": "number (optional)",
  "priceYearly": "number (optional)",
  "features": { ... FeatureFlags },
  "limits": { ... PlanLimits (optional)" },
  "sortOrder": "number (optional)"
}
```

### `PUT /api/plan-templates/:id`

Update a plan template. Maps to `organizations/updatePlanTemplate` mutation.

### `DELETE /api/plan-templates/:id`

Delete a plan template.

### `POST /api/plan-templates/:id/apply/:orgId`

Apply a plan template to an organization. Maps to `organizations/applyPlanTemplate` mutation.

---

## Feedback

### `GET /api/feedback`

List all feedback. Maps to `feedback/listFeedback` query.

**Query Parameters:**

- `status` (optional): `open` | `in_progress` | `resolved` | `closed`

**Response:**

```json
[
  {
    "_id": "string",
    "description": "string",
    "category": "bug | feature | improvement | other",
    "status": "open | in_progress | resolved | closed",
    "timestamp": "number",
    "screenshotUrl": "string | null",
    "url": "string | null",
    "userAgent": "string | null",
    "screenResolution": "string | null",
    ...
  }
]
```

### `GET /api/feedback/:id`

Get single feedback with screenshot URL. Maps to `feedback/getFeedback` query.

### `PUT /api/feedback/:id/status`

Update feedback status. Maps to `feedback/updateFeedbackStatus` mutation.

**Request:**

```json
{ "status": "open | in_progress | resolved | closed" }
```

---

## Users / Team

### `GET /api/users`

List all users with avatar URLs. Maps to `users/listAllUsers` query.

**Response:** Array of User objects.

### `GET /api/users/:id`

Get user by ID. Maps to `users/getUserById` query.

### `POST /api/users`

Create a new user. Maps to `users/createUser` mutation.

**Request:**

```json
{
  "email": "string",
  "fullName": "string (optional)",
  "phone": "string (optional)",
  "role": "master | admin | user (optional, default: user)"
}
```

### `PUT /api/users/:id/role`

Update user role. Maps to `users/updateUserRole` mutation.

**Request:**

```json
{ "role": "master | admin | user" }
```

### `PUT /api/users/:id/permissions`

Update user permissions. Maps to `users/updateUserPermissions` mutation.

**Request:**

```json
{
  "permissions": {
    "manageLeads": "boolean",
    "viewStatistics": "boolean",
    "manageBookings": "boolean",
    "manageUsers": "boolean",
    "manageSettings": "boolean",
    "sendEmails": "boolean",
    "viewAllLeads": "boolean",
    "exportData": "boolean"
  }
}
```

### `PUT /api/users/:id/profile`

Update user profile. Maps to `users/updateUserProfile` mutation.

**Request:**

```json
{
  "name": "string (optional)",
  "fullName": "string (optional)",
  "phone": "string (optional)"
}
```

### `DELETE /api/users/:id`

Delete a user and all associated auth data. Maps to `users/deleteUser` mutation.

### `POST /api/users/:id/reset-password`

Reset user password. Maps to `users/resetUserPassword` mutation.

**Request:**

```json
{ "newPassword": "string" }
```

---

## Licenses

### `GET /api/licenses/types`

List all license types. Maps to `licenses/listAll` query.

**Response:**

```json
[
  {
    "_id": "string",
    "key": "string",
    "label": "string",
    "description": "string | null",
    "priceMonthly": "number",
    "priceYearly": "number",
    "isActive": "boolean",
    "order": "number"
  }
]
```

### `POST /api/licenses/types`

Create a license type. Maps to `licenses/createLicenseType` mutation. **Master only.**

**Request:**

```json
{
  "key": "string",
  "label": "string",
  "description": "string (optional)",
  "priceMonthly": "number",
  "priceYearly": "number",
  "isActive": "boolean",
  "order": "number"
}
```

### `PUT /api/licenses/types/:id`

Update a license type. Maps to `licenses/updateLicenseType` mutation. **Master only.**

### `DELETE /api/licenses/types/:id`

Delete a license type. Maps to `licenses/deleteLicenseType` mutation. **Master only.**

### `PUT /api/licenses/types/reorder`

Reorder license types. Maps to `licenses/reorderLicenseTypes` mutation.

**Request:**

```json
{ "ids": ["string"] }
```

---

## Registrations

### `GET /api/registrations`

List all registrations. Maps to `registrations/listAllRegistrations` query.

**Query Parameters:**

- `status` (optional): `pending` | `approved` | `rejected`

**Response:** Array of Registration objects.

### `GET /api/registrations/:id`

Get registration by ID. Maps to `registrations/getRegistrationById` query.

### `PUT /api/registrations/:id/status`

Update registration status. Maps to `registrations/updateRegistrationStatus` mutation.

**Request:**

```json
{ "status": "pending | approved | rejected" }
```

### `DELETE /api/registrations/:id`

Delete a registration. Maps to `registrations/deleteRegistration` mutation.

---

## Activities

### `GET /api/activities`

List all activities. Maps to `activities/listAll` query (needs to be created if not exists).

**Query Parameters:**

- `type` (optional): filter by activity type
- `userId` (optional): filter by user
- `limit` (optional): max results (default: 100)

**Response:**

```json
[
  {
    "_id": "string",
    "userId": "string",
    "type": "string",
    "content": "string",
    "createdAt": "number",
    "leadId": "string | null",
    "userName": "string | null",
    ...
  }
]
```

---

## System Settings

### `GET /api/system/deployment-info`

Get deployment information. Maps to `systemSettings/getDeploymentInfo` query.

**Response:**

```json
{
  "convexUrl": "string",
  "deploymentName": "string",
  "nodeEnv": "string",
  "appVersion": "string",
  "platform": "string"
}
```

### `GET /api/system/database-stats`

Get database table statistics. Maps to `systemSettings/getDatabaseStats` query.

**Response:**

```json
{
  "tables": [{ "key": "string", "count": "number" }],
  "totalRecords": "number"
}
```

### `GET /api/system/idle-timeout`

Get the idle timeout setting in minutes. Maps to `systemSettings/getIdleTimeout` query.

**Response:**

```json
{ "minutes": "number" }
```

### `PUT /api/system/idle-timeout`

Set the idle timeout. Maps to `systemSettings/setIdleTimeout` mutation. **Admin only.**

**Request:**

```json
{ "minutes": "number" }
```

### `POST /api/system/recalculate-stats`

Recalculate all table statistics. Maps to `systemSettings/recalculateStats` mutation. **Admin only.**

---

## Categories

### `GET /api/categories`

List all categories. Maps to `categories/list` query.

**Response:** Array of Category objects.

### `POST /api/categories`

Create a category. Maps to `categories/create` mutation.

**Request:**

```json
{
  "name": "string",
  "slug": "string (optional)",
  "color": "string",
  "order": "number"
}
```

### `PUT /api/categories/:id`

Update a category. Maps to `categories/update` mutation.

### `DELETE /api/categories/:id`

Delete a category. Maps to `categories/delete` mutation.

### `PUT /api/categories/reorder`

Reorder categories.

**Request:**

```json
{ "ids": ["string"] }
```

---

## Lead Types

### `GET /api/lead-types`

List all lead types. Maps to `leadTypes/list` query.

**Response:** Array of LeadType objects.

### `POST /api/lead-types`

Create a lead type. Maps to `leadTypes/create` mutation.

**Request:**

```json
{
  "label": "string",
  "bonusAmount": "number",
  "isActive": "boolean",
  "order": "number"
}
```

### `PUT /api/lead-types/:id`

Update a lead type. Maps to `leadTypes/update` mutation.

### `DELETE /api/lead-types/:id`

Delete a lead type. Maps to `leadTypes/delete` mutation.

---

## Deleted Leads

### `GET /api/leads/deleted`

List all soft-deleted leads. Maps to `leads/getDeletedLeads` query. **Admin only.**

**Response:** Array of lead objects with `isDeleted: true`.

### `POST /api/leads/:id/restore`

Restore a soft-deleted lead. Maps to `leads/restoreLead` mutation. **Admin only.**

### `DELETE /api/leads/:id/permanent`

Permanently delete a lead and all related data. Maps to `leads/permanentDeleteLead` mutation. **Admin only.**

---

## Implementation Notes

### Convex HTTP API Setup

Create these routes in your `convex/http.ts` file. Each route should:

1. **Authenticate** the request using the Bearer token from the `Authorization` header
2. **Authorize** by checking the user's role is `master`
3. **Map** to the corresponding Convex query/mutation
4. **Return** JSON responses

Example implementation pattern:

```typescript
// In convex/http.ts
import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'

const authenticate = async (request: Request) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) throw new Error('Unauthorized')
  // Validate token using better-auth
  const user = await validateAccessToken(token)
  if (user.role !== 'master') throw new Error('Forbidden')
  return user
}

// Example route
const getOrganizations = httpAction(async (ctx, request) => {
  try {
    const user = await authenticate(request)
    const status = new URL(request.url).searchParams.get('status')
    const orgs = await ctx.runQuery(api.organizations.index.listAll, {
      approvalStatus: status || undefined,
    })
    return new Response(JSON.stringify(orgs), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), {
      status: e.message === 'Unauthorized' ? 401 : 500,
    })
  }
})
```

### CORS Configuration

Ensure your Convex HTTP routes include CORS headers:

```
Access-Control-Allow-Origin: <admin-dashboard-origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Environment Variables

Set these in the admin dashboard:

- `VITE_RENOVEL_API_URL` - The base URL of the Renovel API (e.g., `https://renovel.se/api`)
