# Query Functions Usage Guide

This guide shows how to use the centralized query functions with TanStack Query.

## Architecture Overview

The query system consists of three main files:

1. **`queryFunctions.ts`** - All API fetch functions organized by domain
2. **`queryKeys.ts`** - Centralized query keys for cache management
3. **Component usage** - How to use them in React components

## Benefits

✅ **Type Safety** - All functions are fully typed
✅ **Consistency** - Single source of truth for API calls
✅ **Maintainability** - Easy to update API calls in one place
✅ **Cache Management** - Structured query keys for precise invalidation
✅ **Error Handling** - Consistent error handling across all requests
✅ **Authentication** - Automatic token handling

## Basic Usage

### Fetching Data (Queries)

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

function UsersComponent() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: fetchUsers,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Fetching Single Item with Parameters

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchUser } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

function UserDetailComponent({ userId }: { userId: number }) {
  const { data: user } = useQuery({
    queryKey: queryKeys.users.detail(userId, true), // includeRoles = true
    queryFn: () => fetchUser(userId, true),
  })

  return <div>{user?.name}</div>
}
```

### Creating/Updating Data (Mutations)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

function CreateUserForm() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: invalidateDomain.users() })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {createMutation.isError && (
        <div>Error: {createMutation.error.message}</div>
      )}
    </form>
  )
}
```

## Complete Examples by Domain

### Authentication

```tsx
// Login
import { useMutation } from '@tanstack/react-query'
import { login } from '@/services/queryFunctions'

const loginMutation = useMutation({
  mutationFn: login,
  onSuccess: (data) => {
    sessionStorage.setItem('authToken', data.token)
    // Redirect or update UI
  },
})

loginMutation.mutate({
  email: 'user@example.com',
  password: 'password123',
})

// Get current user
import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/services/queryFunctions'
import { queryKeys } from '@/services/queryKeys'

const { data: currentUser } = useQuery({
  queryKey: queryKeys.auth.currentUser(),
  queryFn: getCurrentUser,
})
```

### Roles Management

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchRoles, 
  fetchRole, 
  createRole, 
  updateRole, 
  deleteRole,
  setRolePermissions 
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

function RolesComponent() {
  const queryClient = useQueryClient()

  // List all roles
  const { data: roles } = useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: fetchRoles,
  })

  // Get role with permissions
  const { data: role } = useQuery({
    queryKey: queryKeys.roles.detail(1, true),
    queryFn: () => fetchRole(1, true),
  })

  // Create role
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
    },
  })

  // Update role
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
    },
  })

  // Delete role
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
    },
  })

  // Set role permissions
  const setPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { 
      roleId: number; 
      permissionIds: number[] 
    }) => setRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.roles() })
    },
  })

  return (
    <div>
      <button onClick={() => createMutation.mutate({ name: 'Editor' })}>
        Create Role
      </button>
      
      <button onClick={() => updateMutation.mutate({ 
        id: 1, 
        data: { name: 'Updated Name' } 
      })}>
        Update Role
      </button>
      
      <button onClick={() => deleteMutation.mutate(1)}>
        Delete Role
      </button>
      
      <button onClick={() => setPermissionsMutation.mutate({ 
        roleId: 1, 
        permissionIds: [1, 2, 3] 
      })}>
        Set Permissions
      </button>
    </div>
  )
}
```

### Content Management

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchContentEntries, 
  createContentEntry, 
  updateContentEntry, 
  deleteContentEntry 
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

function ContentComponent() {
  const queryClient = useQueryClient()
  const contentType = 'article'

  // List content entries
  const { data: entries } = useQuery({
    queryKey: queryKeys.content.byType(contentType),
    queryFn: () => fetchContentEntries(contentType),
  })

  // Create entry
  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => 
      createContentEntry(contentType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: invalidateDomain.content(contentType) 
      })
    },
  })

  // Update entry
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) => 
      updateContentEntry(contentType, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: invalidateDomain.content(contentType) 
      })
    },
  })

  // Delete entry
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContentEntry(contentType, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: invalidateDomain.content(contentType) 
      })
    },
  })

  return <div>...</div>
}
```

### Media Management

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchMediaFiles, 
  fetchMediaProviderInfo,
  uploadMediaFile, 
  deleteMediaFile 
} from '@/services/queryFunctions'
import { queryKeys, invalidateDomain } from '@/services/queryKeys'

function MediaComponent() {
  const queryClient = useQueryClient()

  // List media files
  const { data: files } = useQuery({
    queryKey: queryKeys.media.lists(),
    queryFn: fetchMediaFiles,
  })

  // Get provider info
  const { data: providerInfo } = useQuery({
    queryKey: queryKeys.media.providerInfo(),
    queryFn: fetchMediaProviderInfo,
  })

  // Upload file
  const uploadMutation = useMutation({
    mutationFn: uploadMediaFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.media() })
    },
  })

  // Delete file
  const deleteMutation = useMutation({
    mutationFn: deleteMediaFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.media() })
    },
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      uploadMutation.mutate(formData)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {uploadMutation.isPending && <div>Uploading...</div>}
    </div>
  )
}
```

## Cache Invalidation Strategies

### Invalidate Specific Item

```tsx
// Invalidate specific user
queryClient.invalidateQueries({ 
  queryKey: queryKeys.users.detail(userId) 
})

// Invalidate specific role with permissions
queryClient.invalidateQueries({ 
  queryKey: queryKeys.roles.detail(roleId, true) 
})
```

### Invalidate All Items of a Type

```tsx
// Invalidate all user queries
queryClient.invalidateQueries({ 
  queryKey: invalidateDomain.users() 
})

// Invalidate all role queries
queryClient.invalidateQueries({ 
  queryKey: invalidateDomain.roles() 
})

// Invalidate all content entries of a specific type
queryClient.invalidateQueries({ 
  queryKey: invalidateDomain.content('article') 
})
```

### Optimistic Updates

```tsx
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: any }) => 
    updateUser(id, data),
  onMutate: async ({ id, data }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: queryKeys.users.detail(id) 
    })

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(
      queryKeys.users.detail(id)
    )

    // Optimistically update
    queryClient.setQueryData(queryKeys.users.detail(id), (old: any) => ({
      ...old,
      ...data,
    }))

    return { previousUser }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousUser) {
      queryClient.setQueryData(
        queryKeys.users.detail(variables.id),
        context.previousUser
      )
    }
  },
  onSettled: (data, error, variables) => {
    // Refetch after error or success
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.users.detail(variables.id) 
    })
  },
})
```

## Best Practices

1. **Always use query keys from `queryKeys.ts`** - Never hardcode query keys
2. **Invalidate queries after mutations** - Keep cache in sync
3. **Use appropriate cache time** - Configure in `__root.tsx`
4. **Handle loading and error states** - Provide good UX
5. **Type your data** - Use the exported types from `queryFunctions.ts`
6. **Optimistic updates for better UX** - When appropriate
7. **Batch related invalidations** - Invalidate related queries together

## Migration from Direct Fetch

### Before (Direct fetch)

```tsx
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const token = sessionStorage.getItem('authToken')
    const response = await fetch('/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch')
    const result = await response.json()
    return result.data
  },
})
```

### After (Using query functions)

```tsx
const { data: users } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
})
```

Much cleaner! 🎉
