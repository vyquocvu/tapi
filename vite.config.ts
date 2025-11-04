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
      server.middlewares.use('/api', async (req, res, next) => {
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
    },
  },
  publicDir: 'uploads',
})
