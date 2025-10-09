import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loginUser } from '../src/services/authService.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const credentials = req.body

    if (!credentials || !credentials.email || !credentials.password) {
      console.error('[API /login] Missing credentials:', { 
        hasEmail: !!credentials?.email, 
        hasPassword: !!credentials?.password 
      })
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    console.log('[API /login] Attempting login for:', credentials.email)
    const result = await loginUser(credentials)

    if (result.success) {
      console.log('[API /login] Login successful for:', credentials.email)
      return res.status(200).json(result)
    } else {
      console.warn('[API /login] Login failed for:', credentials.email, 'Error:', result.error)
      return res.status(401).json(result)
    }
  } catch (error) {
    console.error('[API /login] Unexpected error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
