/**
 * Plugin System Integration Example
 * 
 * This file demonstrates how to integrate the plugin system with your API routes.
 * Copy the relevant parts into your vite.config.ts or server/index.ts
 */

import { pluginManager, withPlugins } from '../src/lib/plugin-system'
import { requestLoggerPlugin } from '../src/plugins/examples/logger'
import { requestIdPlugin } from '../src/plugins/examples/request-id'
import { performanceMonitorPlugin } from '../src/plugins/examples/performance-monitor'
import { responseTransformerPlugin } from '../src/plugins/examples/response-transformer'
import type { Connect } from 'vite'

/**
 * Example 1: Register plugins on application startup
 */
export async function setupPlugins() {
  // Register request ID plugin (runs first - lowest priority)
  await pluginManager.register(requestIdPlugin, {
    priority: 1,
    routes: ['/api/*'],
  })

  // Register performance monitor plugin
  await pluginManager.register(performanceMonitorPlugin, {
    priority: 10,
    routes: ['/api/*'],
    options: {
      slowRequestThreshold: 1000, // 1 second
      trackMemory: true,
    },
  })

  // Register logger plugin
  await pluginManager.register(requestLoggerPlugin, {
    priority: 20,
    routes: ['/api/*'],
    excludeRoutes: ['/api/health'], // Don't log health checks
    options: {
      logHeaders: false,
      logResponse: false,
      logBody: false,
    },
  })

  // Register response transformer plugin (runs last)
  await pluginManager.register(responseTransformerPlugin, {
    priority: 90,
    routes: ['/api/*'],
    options: {
      wrapData: false, // Don't wrap data (already wrapped in API responses)
      addMetadata: true,
      apiVersion: 'v1',
    },
  })

  console.log('[Plugin System] All plugins registered')
}

/**
 * Example 2: Wrap existing API handler with plugins
 */
export function createPluginEnabledHandler(
  handler: (req: Connect.IncomingMessage, res: any) => Promise<void>
) {
  return withPlugins(handler)
}

/**
 * Example 3: Integration in vite.config.ts
 * 
 * Add this to your vite.config.ts:
 */
export const viteConfigExample = `
import { defineConfig } from 'vite'
import { pluginManager, withPlugins } from './src/lib/plugin-system'
import { setupPlugins } from './examples/plugin-integration-example'

// Initialize plugins before server starts
let pluginsInitialized = false

export default defineConfig({
  plugins: [
    {
      name: 'api-middleware',
      async configureServer(server) {
        // Initialize plugins once
        if (!pluginsInitialized) {
          await setupPlugins()
          pluginsInitialized = true
        }

        // Wrap your API middleware with plugin execution
        server.middlewares.use('/api', withPlugins(async (req, res) => {
          // Your existing API logic here
          // All registered plugins will automatically execute
          
          // Example: Handle login
          if (req.url === '/login' && req.method === 'POST') {
            // ... existing login logic
          }
          
          // Example: Handle content
          if (req.url?.startsWith('/content')) {
            // ... existing content logic
          }
          
          // If no route matched, pass to next middleware
        }))
      }
    }
  ]
})
`

/**
 * Example 4: Integration in server/index.ts (Express server)
 */
export const expressServerExample = `
import express from 'express'
import { pluginManager, withPlugins } from './src/lib/plugin-system'
import { setupPlugins } from './examples/plugin-integration-example'

const app = express()

// Initialize plugins
await setupPlugins()

// Wrap Express route handler with plugins
app.post('/api/login', withPlugins(async (req, res) => {
  // Your login logic
  res.json({ success: true, token: 'xxx' })
}))

// Or wrap entire router
const apiRouter = express.Router()
apiRouter.use(withPlugins(async (req, res) => {
  // Handle all API routes
}))
app.use('/api', apiRouter)
`

/**
 * Example 5: Selective plugin application
 */
export async function setupConditionalPlugins() {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    await pluginManager.register(requestLoggerPlugin, {
      priority: 20,
      options: {
        logHeaders: true,
        logResponse: true,
      },
    })
  }

  // Only monitor performance in production
  if (process.env.NODE_ENV === 'production') {
    await pluginManager.register(performanceMonitorPlugin, {
      priority: 10,
      options: {
        slowRequestThreshold: 500,
        trackMemory: false,
      },
    })
  }

  // Always add request IDs
  await pluginManager.register(requestIdPlugin, {
    priority: 1,
  })
}

/**
 * Example 6: Register custom middleware
 */
export function setupCustomMiddleware() {
  // Custom CORS middleware
  pluginManager.registerMiddleware({
    name: 'cors',
    handler: async (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }
      
      next()
    },
    priority: 1,
    routes: ['/api/*'],
  })

  // Custom rate limiting middleware
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
  
  pluginManager.registerMiddleware({
    name: 'rate-limit',
    handler: async (req, res, next) => {
      const ip = req.socket?.remoteAddress || 'unknown'
      const now = Date.now()
      const windowMs = 60000 // 1 minute
      const maxRequests = 100
      
      let record = rateLimitStore.get(ip)
      
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + windowMs }
        rateLimitStore.set(ip, record)
        next()
        return
      }
      
      record.count++
      
      if (record.count > maxRequests) {
        res.statusCode = 429
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Too many requests' }))
        return
      }
      
      next()
    },
    priority: 5,
    routes: ['/api/*'],
    excludeRoutes: ['/api/health'],
  })
}

/**
 * Example 7: Dynamic plugin management
 */
export async function managePluginsAtRuntime() {
  // Check if plugin is registered
  if (pluginManager.hasPlugin('request-logger')) {
    console.log('Logger plugin is active')
  }

  // Get plugin info
  const plugin = pluginManager.getPlugin('request-logger')
  if (plugin) {
    console.log('Plugin version:', plugin.plugin.version)
  }

  // List all registered plugins
  const allPlugins = pluginManager.getPlugins()
  console.log('Registered plugins:', allPlugins.map(p => p.plugin.name))

  // Unregister plugin
  await pluginManager.unregister('request-logger')

  // Re-register with different config
  await pluginManager.register(requestLoggerPlugin, {
    priority: 50,
    options: {
      logHeaders: true,
    },
  })
}

/**
 * Example 8: Testing with plugins
 */
export async function setupTestEnvironment() {
  // Clear all plugins before tests
  pluginManager.clear()

  // Register only necessary plugins for testing
  await pluginManager.register(requestIdPlugin, {
    priority: 1,
  })

  // Mock plugins can be registered for testing
  await pluginManager.register({
    name: 'test-mock',
    onBeforeRequest: async (context) => {
      // Mock authentication
      context.user = { id: 1, email: 'test@example.com' }
      return true
    },
  })
}

/**
 * Example 9: Error handling with plugins
 */
export async function setupErrorHandling() {
  await pluginManager.register({
    name: 'error-handler',
    version: '1.0.0',
    description: 'Handles and logs errors',

    onError: async (context, error) => {
      // Log error to external service
      console.error('[Error Handler]', {
        requestId: context.requestId,
        url: context.req.url,
        method: context.req.method,
        error: error.message,
        stack: error.stack,
        user: context.user,
      })

      // Send notification for critical errors
      if (error.message.includes('CRITICAL')) {
        // await sendAlertToSlack(error)
      }

      // Store error in database
      // await saveErrorLog(error, context)
    },
  }, {
    priority: 100, // Run after all other plugins
  })
}

/**
 * Example 10: Custom authentication plugin
 */
export async function setupAuthPlugin() {
  await pluginManager.register({
    name: 'custom-auth',
    version: '1.0.0',
    description: 'Custom authentication logic',

    onBeforeRequest: async (context) => {
      // Skip auth for public routes
      const publicRoutes = ['/api/login', '/api/health', '/api/public']
      const isPublic = publicRoutes.some(route => context.req.url?.startsWith(route))
      
      if (isPublic) {
        return true
      }

      // Check for auth token
      const authHeader = context.req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        context.res.statusCode = 401
        context.res.setHeader('Content-Type', 'application/json')
        context.res.end(JSON.stringify({
          success: false,
          error: 'No authentication token provided',
        }))
        return false // Stop processing
      }

      try {
        // Validate token (implement your validation logic)
        const token = authHeader.substring(7)
        const user = await validateToken(token)
        
        // Store user in context
        context.user = user
        context.state.set('authenticated', true)
        
        return true
      } catch (error) {
        context.res.statusCode = 401
        context.res.setHeader('Content-Type', 'application/json')
        context.res.end(JSON.stringify({
          success: false,
          error: 'Invalid authentication token',
        }))
        return false
      }
    },
  }, {
    priority: 5, // Run early in the pipeline
    routes: ['/api/*'],
  })
}

// Mock function for example
async function validateToken(_token: string): Promise<any> {
  // Implement your token validation
  return { id: 1, email: 'user@example.com' }
}
