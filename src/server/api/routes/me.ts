import type { RouteHandler } from '../types.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'

/**
 * Get current user endpoint
 * GET /api/me
 */
export const meHandler: RouteHandler = async ({ req, res }) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, {
      success: false,
      error: 'Method not allowed',
    })
    return
  }

  try {
    console.log('[API /me] Authenticating user')
    const context = createContext(req)
    const user = requireAuth(context)
    
    console.log('[API /me] User authenticated:', user.email)
    sendJson(res, 200, successResponse({ user }))
  } catch (error) {
    console.warn('[API /me] Unauthorized access attempt')
    sendJson(res, 401, errorResponse(
      'Unauthorized',
      error instanceof Error ? error.message : 'Authentication required'
    ))
  }
}
