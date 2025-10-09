import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import type { Connect } from 'vite'

// Mock user database
const MOCK_USERS = {
  'demo@user.com': {
    id: 1,
    email: 'demo@user.com',
    password: 'password',
    name: 'Demo User',
  },
}

// API middleware plugin for handling login
function apiPlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use('/api', (req: Connect.IncomingMessage, res: any, next) => {
        // Handle POST /api/login
        if (req.url === '/login' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body)

              // Validate request body
              if (!email || !password) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'Email and password are required',
                }))
                return
              }

              // Check if user exists and password matches
              const user = MOCK_USERS[email as keyof typeof MOCK_USERS]
              if (user && user.password === password) {
                // Generate mock token
                const token = `mock-token-${Date.now()}`
                
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  token,
                  user: {
                    id: user.id,
                    email: user.email,
                  },
                }))
                return
              }

              // Invalid credentials
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Invalid credentials',
              }))
            } catch (error) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Invalid request body',
              }))
            }
          })
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
