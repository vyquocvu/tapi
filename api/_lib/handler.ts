import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, handlePreflight, type CorsOptions } from './cors.js'
import {
  requireAuthentication,
  optionalAuthentication,
  type AuthenticatedUser,
} from './auth.js'
import {
  methodNotAllowedResponse,
  unauthorizedResponse,
  serverErrorResponse,
  HTTP_STATUS,
} from './response.js'

/**
 * Handler context passed to route handlers
 */
export interface HandlerContext {
  req: VercelRequest
  res: VercelResponse
  user: AuthenticatedUser | null
  params: Record<string, any>
}

/**
 * Route handler function type
 */
export type RouteHandler = (ctx: HandlerContext) => Promise<void> | void

/**
 * Handler configuration options
 */
export interface HandlerOptions {
  /** Allowed HTTP methods */
  methods?: string[]
  /** Require authentication */
  requireAuth?: boolean
  /** Optional authentication */
  optionalAuth?: boolean
  /** CORS configuration */
  cors?: CorsOptions
  /** Enable logging */
  logging?: boolean
}

/**
 * Default handler options
 */
const DEFAULT_OPTIONS: HandlerOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  requireAuth: false,
  optionalAuth: false,
  logging: true,
}

/**
 * Create a wrapped API handler with common functionality
 * Handles: CORS, OPTIONS preflight, auth, method validation, error handling
 */
export function createHandler(
  handler: RouteHandler,
  options: HandlerOptions = {}
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    // Apply CORS headers
    applyCors(res, config.cors)

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return handlePreflight(res)
    }

    // Validate HTTP method
    if (config.methods && !config.methods.includes(req.method || '')) {
      res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json(
        methodNotAllowedResponse(config.methods)
      )
      return
    }

    try {
      // Handle authentication
      let user: AuthenticatedUser | null = null

      if (config.requireAuth) {
        try {
          user = requireAuthentication(req)
        } catch (error) {
          if (config.logging) {
            console.warn('[API] Authentication failed:', error instanceof Error ? error.message : 'Unknown error')
          }
          res.status(HTTP_STATUS.UNAUTHORIZED).json(
            unauthorizedResponse(error instanceof Error ? error.message : 'Authentication required')
          )
          return
        }
      } else if (config.optionalAuth) {
        user = optionalAuthentication(req)
      }

      // Log request
      if (config.logging) {
        console.log(`[API] ${req.method} ${req.url}`, user ? `(User: ${user.email})` : '(Anonymous)')
      }

      // Extract query parameters
      const params = { ...req.query }

      // Create context
      const ctx: HandlerContext = {
        req,
        res,
        user,
        params,
      }

      // Execute handler
      await handler(ctx)
    } catch (error) {
      // Log error
      if (config.logging) {
        console.error('[API] Handler error:', error)
      }

      // Return error response if not already sent
      if (!res.headersSent) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
          serverErrorResponse(error instanceof Error ? error.message : 'Internal server error')
        )
      }
    }
  }
}

/**
 * Create a GET-only handler
 */
export function createGetHandler(handler: RouteHandler, options: Omit<HandlerOptions, 'methods'> = {}) {
  return createHandler(handler, { ...options, methods: ['GET'] })
}

/**
 * Create a POST-only handler
 */
export function createPostHandler(handler: RouteHandler, options: Omit<HandlerOptions, 'methods'> = {}) {
  return createHandler(handler, { ...options, methods: ['POST'] })
}

/**
 * Create an authenticated handler (requires auth)
 */
export function createAuthHandler(handler: RouteHandler, options: Omit<HandlerOptions, 'requireAuth'> = {}) {
  return createHandler(handler, { ...options, requireAuth: true })
}
