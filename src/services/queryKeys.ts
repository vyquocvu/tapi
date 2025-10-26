/**
 * Query Keys for TanStack Query
 * Centralized query key factory for consistent cache management
 * 
 * Usage:
 * - Use these keys with useQuery, useMutation, queryClient.invalidateQueries, etc.
 * - Keys are hierarchical: ['users'] invalidates all user queries
 * - Specific keys: ['users', 1] invalidates only user with ID 1
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'current-user'] as const,
  },

  // Content Types
  contentTypes: {
    all: ['content-types'] as const,
    registry: () => [...queryKeys.contentTypes.all, 'registry'] as const,
    list: () => [...queryKeys.contentTypes.all, 'list'] as const,
    detail: (uid: string) => [...queryKeys.contentTypes.all, 'detail', uid] as const,
  },

  // Content Entries
  content: {
    all: ['content'] as const,
    byType: (contentType: string) => [...queryKeys.content.all, contentType] as const,
    detail: (contentType: string, id: number) => 
      [...queryKeys.content.all, contentType, id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number, includeRoles = false) => 
      [...queryKeys.users.details(), id, { includeRoles }] as const,
  },

  // Roles
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.roles.lists(), filters] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: number, includePermissions = false) => 
      [...queryKeys.roles.details(), id, { includePermissions }] as const,
  },

  // Permissions
  permissions: {
    all: ['permissions'] as const,
    lists: () => [...queryKeys.permissions.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.permissions.lists(), filters] as const,
    details: () => [...queryKeys.permissions.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.permissions.details(), id] as const,
  },

  // Media
  media: {
    all: ['media'] as const,
    lists: () => [...queryKeys.media.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.media.lists(), filters] as const,
    providerInfo: () => [...queryKeys.media.all, 'provider-info'] as const,
  },

  // API Dashboard
  apiDashboard: {
    all: ['api-dashboard'] as const,
    overview: () => [...queryKeys.apiDashboard.all, 'overview'] as const,
    documentation: () => [...queryKeys.apiDashboard.all, 'documentation'] as const,
    configs: () => [...queryKeys.apiDashboard.all, 'configs'] as const,
    generatedDocs: (contentType: string) => 
      [...queryKeys.apiDashboard.all, 'generated-docs', contentType] as const,
  },
} as const

/**
 * Helper to invalidate all queries for a specific domain
 */
export const invalidateDomain = {
  auth: () => queryKeys.auth.all,
  contentTypes: () => queryKeys.contentTypes.all,
  content: (contentType?: string) => 
    contentType ? queryKeys.content.byType(contentType) : queryKeys.content.all,
  users: () => queryKeys.users.all,
  roles: () => queryKeys.roles.all,
  permissions: () => queryKeys.permissions.all,
  media: () => queryKeys.media.all,
  apiDashboard: () => queryKeys.apiDashboard.all,
} as const
