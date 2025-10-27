import type { VercelResponse } from '@vercel/node'

/**
 * CORS configuration options
 */
export interface CorsOptions {
  origin?: string
  methods?: string[]
  headers?: string[]
  credentials?: boolean
}

/**
 * Default CORS configuration
 */
const DEFAULT_CORS: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
  ],
  credentials: true,
}

/**
 * Apply CORS headers to a response
 */
export function applyCors(res: VercelResponse, options: CorsOptions = {}): void {
  const config = { ...DEFAULT_CORS, ...options }

  if (config.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  if (config.origin) {
    res.setHeader('Access-Control-Allow-Origin', config.origin)
  }

  if (config.methods && config.methods.length > 0) {
    res.setHeader('Access-Control-Allow-Methods', config.methods.join(','))
  }

  if (config.headers && config.headers.length > 0) {
    res.setHeader('Access-Control-Allow-Headers', config.headers.join(', '))
  }
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(res: VercelResponse): void {
  res.status(200).end()
}
