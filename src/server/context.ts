import type { Connect } from 'vite'
import { verifyToken, extractTokenFromHeader, type JWTPayload } from './auth'

export interface RequestContext {
  user: JWTPayload | null
  isAuthenticated: boolean
}

export function createContext(req: Connect.IncomingMessage): RequestContext {
  const authHeader = req.headers.authorization as string | undefined
  const token = extractTokenFromHeader(authHeader)
  
  if (token) {
    const user = verifyToken(token)
    return {
      user,
      isAuthenticated: !!user,
    }
  }
  
  return {
    user: null,
    isAuthenticated: false,
  }
}

export function requireAuth(context: RequestContext): JWTPayload {
  if (!context.isAuthenticated || !context.user) {
    throw new Error('Unauthorized')
  }
  return context.user
}
