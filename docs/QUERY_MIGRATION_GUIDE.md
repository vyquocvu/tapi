# Migration Guide: Moving to Centralized Query Functions

This guide helps you migrate existing components from direct fetch calls to the new centralized query functions system.

## Overview

**Goal**: Replace all direct `fetch()` calls in components with centralized query functions for better maintainability, consistency, and type safety.

## Migration Checklist

- [ ] Update imports
- [ ] Replace fetch calls with query functions
- [ ] Update query keys
- [ ] Update type definitions
- [ ] Test the component

## Step-by-Step Migration

### Example: Migrating Role Management Component

#### Step 1: Update Imports

**Before:**
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
```

**After:**
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchRoles, 
  fetchRole, 
  createRole, 
  updateRole, 
  deleteRole,
  fetchPermissions,
  setRolePermissions,
  type Role,
  type Permission
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'
```

#### Step 2: Replace Fetch Queries

**Before:**
```tsx
const { data: rolesData } = useQuery<{ success: boolean; data: Role[] }>({
  queryKey: ['roles'],
  queryFn: async () => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch('/api/roles', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch roles')
    }
    return response.json()
  },
})
```

**After:**
```tsx
const { data: roles } = useQuery({
  queryKey: queryKeys.roles.lists(),
  queryFn: fetchRoles,
})
```

#### Step 3: Replace Mutations

**Before:**
```tsx
const createRoleMutation = useMutation({
  mutationFn: async (data: { name: string; description?: string }) => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create role')
    }
    return response.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  },
})
```

**After:**
```tsx
const createRoleMutation = useMutation({
  mutationFn: createRole,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
  },
})
```

#### Step 4: Update Type Definitions

**Before:**
```tsx
interface Role {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}
```

**After:**
```tsx
// Just import the type!
import { type Role } from '@/services/queryFunctions'
```

#### Step 5: Update Data Access

**Before:**
```tsx
{rolesData?.data?.map((role) => (
  <div key={role.id}>{role.name}</div>
))}
```

**After:**
```tsx
{roles?.map((role) => (
  <div key={role.id}>{role.name}</div>
))}
```

## Common Patterns

### Pattern 1: Simple GET Request

**Before:**
```tsx
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await response.json()
    return result.data
  },
})
```

**After:**
```tsx
import { fetchUsers } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

const { data } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
})
```

### Pattern 2: GET with Parameters

**Before:**
```tsx
const { data } = useQuery({
  queryKey: ['user', userId, includeRoles],
  queryFn: async () => {
    const token = sessionStorage.getItem('authToken')
    const url = `/api/users?id=${userId}${includeRoles ? '&includeRoles=true' : ''}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await response.json()
    return result.data
  },
})
```

**After:**
```tsx
import { fetchUser } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

const { data } = useQuery({
  queryKey: queryKeys.users.detail(userId, includeRoles),
  queryFn: () => fetchUser(userId, includeRoles),
})
```

### Pattern 3: POST/PUT/DELETE Mutations

**Before:**
```tsx
const updateMutation = useMutation({
  mutationFn: async ({ id, data }: { id: number; data: any }) => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch(`/api/users?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

**After:**
```tsx
import { updateUser } from '@/services/queryFunctions'
import { invalidateDomain } from '@/services/queryKeys'

const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: any }) => 
    updateUser(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
  },
})
```

### Pattern 4: File Upload

**Before:**
```tsx
const uploadMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    const result = await response.json()
    return result.data
  },
})
```

**After:**
```tsx
import { uploadMediaFile } from '@/services/queryFunctions'

const uploadMutation = useMutation({
  mutationFn: uploadMediaFile,
})
```

## File-by-File Migration Priority

### High Priority (User-facing features)
1. ✅ `/src/routes/permissions.tsx` - Already migrated
2. `/src/routes/role-management.tsx`
3. `/src/routes/user-management/index.tsx`
4. `/src/routes/media/index.tsx`

### Medium Priority
5. `/src/components/content-type-builder/ContentTypeBuilder.tsx`
6. `/src/routes/content-manager/index.tsx`
7. `/src/routes/api-dashboard/index.tsx`

### Low Priority (If any)
8. Any remaining components with fetch calls

## Testing After Migration

### Checklist for Each Component

- [ ] Component renders without errors
- [ ] Data loads correctly
- [ ] Loading states work
- [ ] Error states work
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Cache invalidation works (data refreshes after mutations)
- [ ] Types are correct (no TypeScript errors)

### Manual Testing Steps

1. **Load the page** - Data should load
2. **Create an item** - Form should work, list should refresh
3. **Update an item** - Edit should work, changes should appear
4. **Delete an item** - Delete should work, item should disappear
5. **Refresh the page** - Data should load from cache or refetch

## Common Issues and Solutions

### Issue: Property 'data' does not exist

**Problem:**
```tsx
{users?.data?.map(...)} // ❌ Old API response structure
```

**Solution:**
```tsx
{users?.map(...)} // ✅ Query function returns data directly
```

### Issue: Type errors with mutations

**Problem:**
```tsx
mutation.mutate({ id: 1, data: { name: 'New Name' } })
// Type error: Argument type mismatch
```

**Solution:**
Check the function signature in `queryFunctions.ts`:
```tsx
// If function is: updateUser(id: number, data: any)
mutation.mutate({ id: 1, data: { name: 'New Name' } })

// Should be:
mutation.mutate({ id: 1, data: { name: 'New Name' } })
// Or destructure in mutationFn:
mutationFn: ({ id, data }) => updateUser(id, data)
```

### Issue: Query keys don't match

**Problem:**
Cache invalidation doesn't work.

**Solution:**
Always use query keys from `queryKeys.ts`:
```tsx
// ❌ Don't hardcode
queryKey: ['users', userId]

// ✅ Use from queryKeys
queryKey: queryKeys.users.detail(userId)
```

## Need Help?

- Check `/docs/QUERY_FUNCTIONS_GUIDE.md` for usage examples
- Look at migrated components for patterns
- Refer to `queryFunctions.ts` for available functions
- Check `queryKeys.ts` for proper query keys
