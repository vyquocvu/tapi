import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import type { Connect } from 'vite'
import dotenv from 'dotenv'
import { contentTypeWatcherPlugin } from './scripts/content-types/vite-plugin.js'

// Load environment variables
dotenv.config()

// API middleware plugin for handling API routes
function apiPlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use('/api', async (req: Connect.IncomingMessage, res: any, next) => {
        // Dynamically import services (ESM modules)
        const { loginUser } = await import('./src/services/authService.js')
        const { getAllPosts } = await import('./src/services/postService.js')
        const { createContext, requireAuth } = await import('./src/server/context.js')

        // Handle POST /api/login
        if (req.url === '/login' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', async () => {
            try {
              const credentials = JSON.parse(body)
              console.log('[Vite API /login] Attempting login for:', credentials.email)
              const result = await loginUser(credentials)

              if (result.success) {
                console.log('[Vite API /login] Login successful for:', credentials.email)
              } else {
                console.warn('[Vite API /login] Login failed for:', credentials.email, 'Error:', result.error)
              }

              res.statusCode = result.success ? 200 : 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(result))
            } catch (error) {
              console.error('[Vite API /login] Unexpected error:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
              }))
            }
          })
          return
        }

        // Handle GET /api/posts
        if (req.url === '/posts' && req.method === 'GET') {
          try {
            console.log('[Vite API /posts] Fetching all posts')
            const posts = await getAllPosts()
            console.log(`[Vite API /posts] Successfully fetched ${posts.length} posts`)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data: posts,
            }))
          } catch (error) {
            console.error('[Vite API /posts] Error fetching posts:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Failed to fetch posts',
              details: error instanceof Error ? error.message : 'Unknown error',
            }))
          }
          return
        }

        // Handle GET /api/me (protected route example)
        if (req.url === '/me' && req.method === 'GET') {
          try {
            console.log('[Vite API /me] Authenticating user')
            const context = createContext(req)
            const user = requireAuth(context)
            
            console.log('[Vite API /me] User authenticated:', user.email)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data: { user },
            }))
          } catch (error) {
            console.warn('[Vite API /me] Unauthorized access attempt')
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
              details: error instanceof Error ? error.message : 'Authentication required',
            }))
          }
          return
        }

        // Handle GET /api/health
        if (req.url === '/health' && req.method === 'GET') {
          console.log('[Vite API /health] Health check requested')
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
          }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), apiPlugin(), contentTypeWatcherPlugin()],
})
