import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, errorResponse } from '../utils/response.js'
import { loginUser } from '../../../services/authService.js'

/**
 * Login endpoint
 * POST /api/login
 */
export const loginHandler: RouteHandler = async ({ req, res }) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, {
      success: false,
      error: 'Method not allowed',
    })
    return
  }

  try {
    const credentials = await parseRequestBody(req)
    console.log('[API /login] Attempting login for:', credentials.email)
    const result = await loginUser(credentials)

    if (result.success) {
      console.log('[API /login] Login successful for:', credentials.email)
    } else {
      console.warn('[API /login] Login failed for:', credentials.email, 'Error:', result.error)
    }

    sendJson(res, result.success ? 200 : 401, result)
  } catch (error) {
    console.error('[API /login] Unexpected error:', error)
    sendJson(res, 500, errorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    ))
  }
}
