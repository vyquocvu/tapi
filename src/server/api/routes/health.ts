import type { RouteHandler } from '../types.js'
import { sendJson } from '../utils/response.js'

/**
 * Health check endpoint
 * GET /api/health
 */
export const healthHandler: RouteHandler = async ({ req, res }) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, {
      success: false,
      error: 'Method not allowed',
    })
    return
  }

  console.log('[API /health] Health check requested')
  sendJson(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
}
