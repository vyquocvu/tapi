import { redirect } from '@tanstack/react-router'

/**
 * Reusable authentication guard for protected routes
 * @param redirectTo - The route to redirect to after login
 * @returns Promise that throws redirect if not authenticated
 */
export async function requireAuth(redirectTo?: string) {
  const token = sessionStorage.getItem('authToken')
  if (!token) {
    throw redirect({
      to: '/login',
      search: redirectTo ? { redirect: redirectTo } : undefined,
    })
  }
  return token
}

/**
 * Get auth token from sessionStorage
 */
export function getAuthToken(): string | null {
  return sessionStorage.getItem('authToken')
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return token
    ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      }
}

/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

/**
 * Authenticated JSON fetch - returns parsed JSON
 */
export async function fetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options)
  const data = await response.json()
  
  // Handle common API response format
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data
  }
  
  return data
}
