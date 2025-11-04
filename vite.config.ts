import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import dotenv from 'dotenv'
import path from 'path'
import { contentTypeWatcherPlugin } from './scripts/content-types/vite-plugin.js'

// Load environment variables
dotenv.config()

// API middleware plugin for handling API routes
function apiPlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle /api routes
        if (!req.url?.startsWith('/api/')) {
          return next()
        }
        
        console.log('[API Middleware] Request:', req.method, req.url)
        
        // Skip requests for static files/modules (Vite dev server trying to load TS files)
        if (req.url?.includes('.ts') || req.url?.includes('.js') || req.url?.includes('/@') || req.headers.accept?.includes('text/javascript')) {
          console.log('[API Middleware] Skipping module/static request')
          return next()
        }
        
        // Dynamically import the API router
        const { apiRouter } = await import('./src/server/api/router.js')
        await apiRouter(req, res, next)
      })
    },
  }
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), apiPlugin(), contentTypeWatcherPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@tanstack/router-devtools'],
  },
  server: {
    fs: {
      // Allow serving files from uploads directory
      allow: ['.', './uploads'],
      // Deny serving from api directory to prevent Vite from serving Vercel serverless 
      // functions as ES modules during development. Dev mode uses src/server/api/* instead.
      deny: ['api'],
    },
  },
  publicDir: 'uploads',
})
