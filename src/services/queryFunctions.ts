/**
 * Query Functions for TanStack Query
 * Centralized data fetching functions that ensure consistency across components
 */

import { httpClient } from '@/lib/http'
import { fetchJSON, authenticatedFetch } from '@/lib/auth-utils'
import type { ContentTypeDefinition } from '../content-type-builder/types'

export interface ContentTypeRegistry {
  [uid: string]: ContentTypeDefinition
}

/**
 * Fetch all content types as an object (Registry format)
 * This is the canonical format returned by the API
 */
export async function fetchContentTypesRegistry(): Promise<ContentTypeRegistry> {
  const response = await httpClient.get<any>('/api/content-types')
  
  console.log('[fetchContentTypesRegistry] Raw response:', response)
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch content types')
  }
  
  // httpClient returns: { success: true, data: <API response> }
  // API response is: { success: true, data: <content types> }
  // So we need to access response.data.data for the actual content types
  const apiResponse = response.data
  
  console.log('[fetchContentTypesRegistry] API response:', apiResponse)
  
  // Check if apiResponse has the expected structure
  if (apiResponse && typeof apiResponse === 'object' && 'data' in apiResponse) {
    console.log('[fetchContentTypesRegistry] Returning apiResponse.data:', apiResponse.data)
    return (apiResponse.data || {}) as ContentTypeRegistry
  }
  
  // Fallback: if response.data is already the content types object
  console.log('[fetchContentTypesRegistry] Fallback - returning apiResponse:', apiResponse)
  return (apiResponse || {}) as ContentTypeRegistry
}

/**
 * Fetch all content types as an array
 * Converts the registry format to an array for easier iteration
 */
export async function fetchContentTypesArray(): Promise<ContentTypeDefinition[]> {
  const registry = await fetchContentTypesRegistry()
  return Object.values(registry)
}

/**
 * Fetch a single content type by UID
 */
export async function fetchContentType(uid: string): Promise<ContentTypeDefinition | null> {
  const registry = await fetchContentTypesRegistry()
  return registry[uid] || null
}

/**
 * Content Entry type
 */
export interface ContentEntry {
  id: number
  [key: string]: any
}

/**
 * Fetch entries for a content type
 */
export async function fetchContentEntries(contentType: string): Promise<ContentEntry[]> {
  return fetchJSON<ContentEntry[]>(`/api/content?contentType=${encodeURIComponent(contentType)}`)
}

/**
 * Create a content entry
 */
export async function createContentEntry(
  contentType: string,
  data: Record<string, any>
): Promise<ContentEntry> {
  const response = await authenticatedFetch(`/api/content?contentType=${encodeURIComponent(contentType)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  return result.data
}

/**
 * Update a content entry
 */
export async function updateContentEntry(
  contentType: string,
  id: number,
  data: Record<string, any>
): Promise<ContentEntry> {
  const response = await authenticatedFetch(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
  
  const result = await response.json()
  return result.data
}

/**
 * Delete a content entry
 */
export async function deleteContentEntry(
  contentType: string,
  id: number
): Promise<void> {
  await authenticatedFetch(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'DELETE',
    }
  )
}
