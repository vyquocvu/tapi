import type { VercelRequest } from '@vercel/node'
import { verifyToken } from '../../src/server/auth.js'
import { createContext, requireAuth as contextRequireAuth } from '../../src/server/context.js'

/**
 * User object from JWT token
 */
export interface AuthenticatedUser {
  userId: number
  email: string
  [key: string]: any
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: AuthenticatedUser | null
  error?: string
}

/**
 * Extract and verify JWT token from request headers
 * Returns user object if valid, null if invalid or missing
 */
export function authenticateRequest(req: VercelRequest): AuthResult {
  const authHeader = req.headers.authorization as string
  
  if (!authHeader) {
    return { user: null, error: 'No authorization header provided' }
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Invalid authorization header format' }
  }

  const token = authHeader.substring(7)
  
  try {
    const user = verifyToken(token) as AuthenticatedUser
    return { user }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Invalid or expired token',
    }
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuthentication(req: VercelRequest): AuthenticatedUser {
  const { user, error } = authenticateRequest(req)
  
  if (!user) {
    throw new Error(error || 'Authentication required')
  }
  
  return user
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export function optionalAuthentication(req: VercelRequest): AuthenticatedUser | null {
  const { user } = authenticateRequest(req)
  return user
}

/**
 * Create a compatible request object for context creation (for /me endpoint)
 */
export function adaptVercelRequest(req: VercelRequest): any {
  return {
    headers: req.headers,
  }
}

/**
 * Get authenticated user using context system
 */
export function getAuthenticatedUser(req: VercelRequest): AuthenticatedUser {
  const context = createContext(adaptVercelRequest(req))
  return contextRequireAuth(context) as AuthenticatedUser
}
