/**
 * Query Functions for TanStack Query
 * Centralized data fetching functions that ensure consistency across components
 * 
 * Organization:
 * - Authentication
 * - Content Types
 * - Content Entries
 * - Users
 * - Roles
 * - Permissions
 * - Media
 */

import type { ContentTypeDefinition } from '../content-type-builder/types'
import type {
  ApiResponse,
  ContentTypeRegistry,
  ContentEntry,
  User,
  Role,
  Permission,
  MediaFile,
  MediaProviderInfo,
  LoginCredentials,
  LoginResponse,
  APIStatistics,
  ActivityLog,
  EndpointInfo,
  EndpointDocumentation,
  EndpointConfig,
  DashboardOverview,
} from './types'

// Re-export types for backward compatibility
export type {
  ApiResponse,
  ContentTypeRegistry,
  ContentEntry,
  User,
  Role,
  Permission,
  MediaFile,
  MediaProviderInfo,
  LoginCredentials,
  LoginResponse,
  APIStatistics,
  ActivityLog,
  EndpointInfo,
  EndpointDocumentation,
  EndpointConfig,
  DashboardOverview,
}

// ============================================================================
// HELPERS
// ============================================================================

const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken')
}

const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

async function fetchAPI<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  const result: ApiResponse<T> = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed')
  }

  return result.data as T
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(error.error || 'Login failed')
  }

  const result: ApiResponse<LoginResponse> = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Login failed')
  }

  return result.data!
}

export async function getCurrentUser(): Promise<User> {
  return fetchAPI<User>('/api/me')
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export async function fetchContentTypesRegistry(): Promise<ContentTypeRegistry> {
  const data = await fetchAPI<ContentTypeRegistry>('/api/content-types')
  return data || {}
}

export async function fetchContentTypesArray(): Promise<ContentTypeDefinition[]> {
  const registry = await fetchContentTypesRegistry()
  return Object.values(registry)
}

export async function fetchContentType(uid: string): Promise<ContentTypeDefinition | null> {
  const registry = await fetchContentTypesRegistry()
  return registry[uid] || null
}

export async function deleteContentType(id: string): Promise<void> {
  await fetchAPI<void>(`/api/content-types/${id}`, {
    method: 'DELETE',
  })
}

export async function updateContentType(
  id: string,
  definition: ContentTypeDefinition
): Promise<ContentTypeDefinition> {
  return fetchAPI<ContentTypeDefinition>(`/api/content-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(definition),
  })
}

export async function createContentType(
  definition: ContentTypeDefinition
): Promise<ContentTypeDefinition> {
  return fetchAPI<ContentTypeDefinition>('/api/content-types', {
    method: 'POST',
    body: JSON.stringify(definition),
  })
}

// ============================================================================
// CONTENT ENTRIES
// ============================================================================

export async function fetchContentEntries(contentType: string): Promise<ContentEntry[]> {
  return fetchAPI<ContentEntry[]>(`/api/content?contentType=${encodeURIComponent(contentType)}`)
}

export async function createContentEntry(
  contentType: string,
  data: Record<string, any>
): Promise<ContentEntry> {
  return fetchAPI<ContentEntry>(`/api/content?contentType=${encodeURIComponent(contentType)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateContentEntry(
  contentType: string,
  id: number,
  data: Record<string, any>
): Promise<ContentEntry> {
  return fetchAPI<ContentEntry>(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function deleteContentEntry(
  contentType: string,
  id: number
): Promise<void> {
  await fetchAPI<void>(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'DELETE',
    }
  )
}

// ============================================================================
// USERS
// ============================================================================

export async function fetchUsers(): Promise<User[]> {
  return fetchAPI<User[]>('/api/users')
}

export async function fetchUser(id: number, includeRoles = false): Promise<User> {
  const url = `/api/users?id=${id}${includeRoles ? '&includeRoles=true' : ''}`
  return fetchAPI<User>(url)
}

export async function createUser(data: {
  email: string
  password: string
  name: string
}): Promise<User> {
  return fetchAPI<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(
  id: number,
  data: Partial<{ email: string; name: string; password: string }>
): Promise<User> {
  return fetchAPI<User>(`/api/users?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: number): Promise<void> {
  await fetchAPI<void>(`/api/users?id=${id}`, {
    method: 'DELETE',
  })
}

export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  await fetchAPI<void>('/api/users/assign-role', {
    method: 'POST',
    body: JSON.stringify({ userId, roleId }),
  })
}

export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  await fetchAPI<void>('/api/users/remove-role', {
    method: 'POST',
    body: JSON.stringify({ userId, roleId }),
  })
}

// ============================================================================
// ROLES
// ============================================================================

export async function fetchRoles(): Promise<Role[]> {
  return fetchAPI<Role[]>('/api/roles')
}

export async function fetchRole(id: number, includePermissions = false): Promise<Role> {
  const url = `/api/roles?id=${id}${includePermissions ? '&includePermissions=true' : ''}`
  return fetchAPI<Role>(url)
}

export async function createRole(data: {
  name: string
  description?: string
}): Promise<Role> {
  return fetchAPI<Role>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRole(
  id: number,
  data: Partial<{ name: string; description: string }>
): Promise<Role> {
  return fetchAPI<Role>(`/api/roles?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteRole(id: number): Promise<void> {
  await fetchAPI<void>(`/api/roles?id=${id}`, {
    method: 'DELETE',
  })
}

export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  await fetchAPI<void>('/api/roles/set-permissions', {
    method: 'POST',
    body: JSON.stringify({ roleId, permissionIds }),
  })
}

export async function assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
  await fetchAPI<void>('/api/roles/assign-permission', {
    method: 'POST',
    body: JSON.stringify({ roleId, permissionId }),
  })
}

export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  await fetchAPI<void>('/api/roles/remove-permission', {
    method: 'POST',
    body: JSON.stringify({ roleId, permissionId }),
  })
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export async function fetchPermissions(): Promise<Permission[]> {
  return fetchAPI<Permission[]>('/api/permissions')
}

export async function fetchPermission(id: number): Promise<Permission> {
  return fetchAPI<Permission>(`/api/permissions?id=${id}`)
}

export async function createPermission(data: {
  name: string
  resource: string
  action: string
  description?: string
}): Promise<Permission> {
  return fetchAPI<Permission>('/api/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePermission(
  id: number,
  data: Partial<{ name: string; resource: string; action: string; description: string }>
): Promise<Permission> {
  return fetchAPI<Permission>(`/api/permissions?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePermission(id: number): Promise<void> {
  await fetchAPI<void>(`/api/permissions?id=${id}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// MEDIA
// ============================================================================

export async function fetchMediaProviderInfo(): Promise<MediaProviderInfo> {
  return fetchAPI<MediaProviderInfo>('/api/media?action=provider-info')
}

export async function fetchMediaFiles(): Promise<MediaFile[]> {
  return fetchAPI<MediaFile[]>('/api/media')
}

export async function uploadMediaFile(formData: FormData): Promise<MediaFile> {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch('/api/media', {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || 'Upload failed')
  }

  const result: ApiResponse<MediaFile> = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed')
  }

  return result.data!
}

export async function deleteMediaFile(fileId: string): Promise<void> {
  await fetchAPI<void>(`/api/media?id=${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// API DASHBOARD
// ============================================================================

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return fetchAPI<DashboardOverview>('/api/api-dashboard')
}

export async function fetchEndpointDocumentation(): Promise<EndpointDocumentation[]> {
  return fetchAPI<EndpointDocumentation[]>('/api/api-dashboard?action=documentation')
}

export async function fetchEndpointConfigs(): Promise<EndpointConfig[]> {
  return fetchAPI<EndpointConfig[]>('/api/api-dashboard?action=configs')
}

export async function generateContentTypeDocumentation(contentType: string): Promise<string> {
  const result = await fetchAPI<{ markdown: string }>(
    `/api/api-dashboard?action=generate-docs&contentType=${encodeURIComponent(contentType)}`
  )
  return result.markdown
}
