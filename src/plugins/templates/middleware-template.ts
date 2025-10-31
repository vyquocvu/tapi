/**
 * Middleware Template
 * Use this as a starting point for creating custom middleware
 */

import type { Connect } from 'vite'
import type { MiddlewareConfig } from '../../lib/plugin-system/types'

/**
 * Custom middleware function
 * Follows Express-style middleware pattern
 */
export const myMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
): Promise<void> => {
  try {
    // Access request data
    const { method, url } = req
    
    console.log(`[My Middleware] Processing request: ${method} ${url}`)
    
    // Perform your middleware logic here
    // Examples:
    // - Add custom headers
    // - Validate request
    // - Transform request data
    // - Log request information
    
    // Add custom header
    res.setHeader('X-Custom-Middleware', 'processed')
    
    // Call next() to continue to next middleware/handler
    next()
  } catch (error) {
    // Pass errors to next middleware/handler
    next(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Middleware configuration for registration
 */
export const myMiddlewareConfig: MiddlewareConfig = {
  name: 'my-middleware',
  handler: myMiddleware,
  priority: 50, // Lower numbers execute first
  routes: ['/api/*'], // Apply to specific routes
  // excludeRoutes: ['/api/health'], // Optionally exclude routes
}

// Usage example:
// import { pluginManager } from '@/lib/plugin-system'
// import { myMiddlewareConfig } from './path/to/my-middleware'
//
// pluginManager.registerMiddleware(myMiddlewareConfig)
