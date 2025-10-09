import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import type { Connect } from 'vite'
import dotenv from 'dotenv'

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
              const result = await loginUser(credentials)

              res.statusCode = result.success ? 200 : 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(result))
            } catch (error) {
              console.error('Login error:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Internal server error',
              }))
            }
          })
          return
        }

        // Handle GET /api/posts
        if (req.url === '/posts' && req.method === 'GET') {
          try {
            const posts = await getAllPosts()
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data: posts,
            }))
          } catch (error) {
            console.error('Posts fetch error:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Failed to fetch posts',
            }))
          }
          return
        }

        // Handle GET /api/me (protected route example)
        if (req.url === '/me' && req.method === 'GET') {
          try {
            const context = createContext(req)
            const user = requireAuth(context)
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data: { user },
            }))
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
          }
          return
        }

        // Handle GET /api/health
        if (req.url === '/health' && req.method === 'GET') {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
          }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), apiPlugin()],
})
