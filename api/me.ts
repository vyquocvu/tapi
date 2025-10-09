import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createContext, requireAuth } from '../src/server/context.js'

// Create a compatible request object for context creation
function adaptVercelRequest(req: VercelRequest): any {
  return {
    headers: req.headers,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    console.log('[API /me] Authenticating user')
    const context = createContext(adaptVercelRequest(req))
    const user = requireAuth(context)
    
    console.log('[API /me] User authenticated:', user.email)
    return res.status(200).json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.warn('[API /me] Unauthorized access attempt')
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: error instanceof Error ? error.message : 'Authentication required',
    })
  }
}
