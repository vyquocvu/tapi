# API Refactoring - DRY Principles

## Overview
The `/api` directory has been refactored to follow DRY (Don't Repeat Yourself) principles with better code organization and reusability.

## New Shared Utilities (`/api/_lib/`)

### 1. **cors.ts** - CORS Middleware
Handles Cross-Origin Resource Sharing headers consistently across all endpoints.

```typescript
import { applyCors, handlePreflight } from './_lib/cors.js'

// Apply CORS headers
applyCors(res, { origin: '*', methods: ['GET', 'POST'] })

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return handlePreflight(res)
}
```

### 2. **auth.ts** - Authentication Utilities
Provides authentication helpers for required and optional authentication.

```typescript
import { requireAuthentication, optionalAuthentication } from './_lib/auth.js'

// Require authentication (throws if not authenticated)
const user = requireAuthentication(req)

// Optional authentication (returns null if not authenticated)
const user = optionalAuthentication(req)
```

### 3. **response.ts** - Standard Response Helpers
Provides consistent response formatting across all endpoints.

```typescript
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  HTTP_STATUS,
} from './_lib/response.js'

// Success response
res.status(HTTP_STATUS.OK).json(successResponse(data))

// Error responses
res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('User'))
res.status(HTTP_STATUS.BAD_REQUEST).json(badRequestResponse('Invalid input'))
```

### 4. **handler.ts** - Request Handler Wrapper
Wraps endpoints with common functionality: CORS, auth, method validation, error handling.

```typescript
import { createHandler, createGetHandler, createPostHandler, createAuthHandler } from './_lib/handler.js'

// Basic handler with auto CORS, error handling
export default createHandler(async ({ req, res, user, params }) => {
  // Your logic here
})

// GET-only handler
export default createGetHandler(async ({ req, res }) => {
  // GET logic
})

// POST-only handler
export default createPostHandler(async ({ req, res }) => {
  // POST logic
})

// Authenticated handler (requires JWT token)
export default createAuthHandler(async ({ req, res, user }) => {
  // user is guaranteed to be present
  console.log('User:', user.email)
})
```

### 5. **crud.ts** - CRUD Helper (Optional)
Provides utilities for standard CRUD operations (can be used for simple resources).

```typescript
import { handleCrud } from './_lib/crud.js'

// For resources with standard CRUD operations
await handleCrud(ctx, {
  service: myService,
  resourceName: 'Resource',
  validate: (data) => data.name ? null : 'Name is required',
})
```

## Refactored Endpoints

### Before & After Examples

#### Before (login.ts)
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers (10+ lines)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // ... more headers

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Method validation
  if (req.method !== 'POST') return res.status(405).json(...)

  try {
    // Logic
  } catch (error) {
    // Error handling
  }
}
```

#### After (login.ts)
```typescript
export default createPostHandler(async ({ req, res }) => {
  // Just the logic!
  const credentials = req.body
  const result = await loginUser(credentials)
  res.status(HTTP_STATUS.OK).json(result)
})
```

## Benefits

1. **Reduced Code Duplication**: 
   - CORS headers: ~15 lines → 1 line
   - Auth logic: ~20 lines → 1 line
   - Error handling: ~10 lines → automatic

2. **Consistent Patterns**:
   - All endpoints use same response format
   - Authentication handled uniformly
   - Error handling standardized

3. **Better Maintainability**:
   - Changes to CORS/auth logic in one place
   - Easier to add new endpoints
   - Type-safe with TypeScript

4. **Cleaner Code**:
   - Endpoints focus on business logic
   - Less boilerplate
   - Easier to read and understand

## Migration Status

✅ **Completed:**
- `login.ts` - Authentication endpoint
- `me.ts` - Current user endpoint
- `health.ts` - Health check endpoint
- `permissions.ts` - Permissions CRUD

⏳ **Remaining:**
- `users.ts` - User management
- `roles.ts` - Role management
- `content.ts` - Content management
- `content-types.ts` - Content types
- `media.ts` - Media management
- `posts.ts` - Posts endpoint
- `api-dashboard.ts` - Dashboard stats

## Usage Guidelines

### For Simple GET endpoints
```typescript
export default createGetHandler(async ({ res }) => {
  const data = await fetchData()
  res.status(HTTP_STATUS.OK).json(successResponse(data))
})
```

### For Authenticated endpoints
```typescript
export default createAuthHandler(async ({ req, res, user }) => {
  // user.userId, user.email available
  const data = await fetchUserData(user.userId)
  res.status(HTTP_STATUS.OK).json(successResponse(data))
})
```

### For CRUD endpoints
```typescript
export default createAuthHandler(async ({ req, res, user, params }) => {
  const id = params.id ? parseInt(params.id as string) : null

  if (req.method === 'GET') {
    // List or get by ID
  } else if (req.method === 'POST') {
    // Create
  } else if (req.method === 'PUT' && id) {
    // Update
  } else if (req.method === 'DELETE' && id) {
    // Delete
  }
})
```

## Configuration Options

Handler options can customize behavior:

```typescript
createHandler(handler, {
  methods: ['GET', 'POST'],        // Allowed HTTP methods
  requireAuth: true,               // Require authentication
  optionalAuth: false,             // Optional authentication
  cors: { origin: '*' },           // Custom CORS config
  logging: true,                   // Enable request logging
})
```

## Next Steps

1. Migrate remaining endpoints to use new utilities
2. Remove old CORS/auth code duplication
3. Standardize error responses across all endpoints
4. Add integration tests for shared utilities
5. Document API patterns in main README
