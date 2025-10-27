# Query Functions Quick Reference

## Import

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  // Functions you need
  fetchUsers, 
  createUser,
  // Types you need
  type User,
  // Query keys & helpers
  queryKeys,
  invalidateDomain 
} from '@/services'
```

## Common Patterns

### 📖 Fetch Data (GET)

```typescript
// List all
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
})

// Get single item
const { data } = useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
})

// With parameters
const { data } = useQuery({
  queryKey: queryKeys.roles.detail(roleId, true),
  queryFn: () => fetchRole(roleId, true), // includePermissions
})
```

### ✏️ Create/Update/Delete (POST/PUT/DELETE)

```typescript
const queryClient = useQueryClient()

// Create
const createMutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
  },
})
createMutation.mutate({ email: 'user@example.com', name: 'John', password: 'pass' })

// Update
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
  },
})
updateMutation.mutate({ id: 1, data: { name: 'New Name' } })

// Delete
const deleteMutation = useMutation({
  mutationFn: deleteUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
  },
})
deleteMutation.mutate(userId)
```

## Available Functions by Domain

### 🔐 Authentication
- `login(credentials)` → `LoginResponse`
- `getCurrentUser()` → `User`

### 📝 Content Types
- `fetchContentTypesRegistry()` → `ContentTypeRegistry`
- `fetchContentTypesArray()` → `ContentTypeDefinition[]`
- `fetchContentType(uid)` → `ContentTypeDefinition`
- `updateContentType(id, definition)` → `ContentTypeDefinition`
- `deleteContentType(id)` → `void`

### 📄 Content Entries
- `fetchContentEntries(contentType)` → `ContentEntry[]`
- `createContentEntry(contentType, data)` → `ContentEntry`
- `updateContentEntry(contentType, id, data)` → `ContentEntry`
- `deleteContentEntry(contentType, id)` → `void`

### 👥 Users
- `fetchUsers()` → `User[]`
- `fetchUser(id, includeRoles?)` → `User`
- `createUser(data)` → `User`
- `updateUser(id, data)` → `User`
- `deleteUser(id)` → `void`
- `assignRoleToUser(userId, roleId)` → `void`
- `removeRoleFromUser(userId, roleId)` → `void`

### 🛡️ Roles
- `fetchRoles()` → `Role[]`
- `fetchRole(id, includePermissions?)` → `Role`
- `createRole(data)` → `Role`
- `updateRole(id, data)` → `Role`
- `deleteRole(id)` → `void`
- `setRolePermissions(roleId, permissionIds)` → `void`
- `assignPermissionToRole(roleId, permissionId)` → `void`
- `removePermissionFromRole(roleId, permissionId)` → `void`

### 🔑 Permissions
- `fetchPermissions()` → `Permission[]`
- `fetchPermission(id)` → `Permission`
- `createPermission(data)` → `Permission`
- `updatePermission(id, data)` → `Permission`
- `deletePermission(id)` → `void`

### 🖼️ Media
- `fetchMediaFiles()` → `MediaFile[]`
- `fetchMediaProviderInfo()` → `MediaProviderInfo`
- `uploadMediaFile(formData)` → `MediaFile`
- `deleteMediaFile(fileId)` → `void`

## Query Keys Reference

```typescript
// Authentication
queryKeys.auth.currentUser()

// Content Types
queryKeys.contentTypes.lists()
queryKeys.contentTypes.detail(uid)

// Content Entries
queryKeys.content.byType(contentType)
queryKeys.content.detail(contentType, id)

// Users
queryKeys.users.lists()
queryKeys.users.detail(id, includeRoles?)

// Roles
queryKeys.roles.lists()
queryKeys.roles.detail(id, includePermissions?)

// Permissions
queryKeys.permissions.lists()
queryKeys.permissions.detail(id)

// Media
queryKeys.media.lists()
queryKeys.media.providerInfo()
```

## Cache Invalidation

```typescript
// Invalidate all queries of a type
queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
queryClient.invalidateQueries({ queryKey: invalidateDomain.permissions() })
queryClient.invalidateQueries({ queryKey: invalidateDomain.media() })
queryClient.invalidateQueries({ queryKey: invalidateDomain.content('article') })

// Invalidate specific item
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(roleId) })
```

## Types Reference

```typescript
type User = {
  id: number
  email: string
  name: string
  createdAt: string
  updatedAt: string
  roles?: Role[]
  permissions?: Permission[]
}

type Role = {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

type Permission = {
  id: number
  name: string
  action: string
  resource: string
  description: string | null
  createdAt: string
  updatedAt: string
}

type ContentEntry = {
  id: number
  [key: string]: any
}

type MediaFile = {
  id: string
  name: string
  size: number
  mimeType: string
  url: string
  createdAt: string
  updatedAt: string
}
```

## Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
})

if (isError) {
  return <div>Error: {error.message}</div>
}
```

## Loading States

```typescript
const { data, isLoading, isFetching } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
})

if (isLoading) return <div>Loading...</div>
if (isFetching) return <div>Refreshing...</div>
```

## Migration Checklist

- [ ] Import query functions and keys
- [ ] Replace `fetch()` with query functions
- [ ] Update query keys to use `queryKeys.*`
- [ ] Update mutation invalidations to use `invalidateDomain.*`
- [ ] Remove inline type definitions (use imported types)
- [ ] Test loading, error, and success states
- [ ] Verify cache invalidation works

## Need More Help?

- 📚 Complete Guide: `/docs/QUERY_FUNCTIONS_GUIDE.md`
- 🔄 Migration Guide: `/docs/QUERY_MIGRATION_GUIDE.md`
- 📋 Full Summary: `/docs/QUERY_FUNCTIONS_SUMMARY.md`
- 💻 Example: `/src/routes/permissions.tsx`
