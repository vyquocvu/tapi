import type { Connect } from 'vite'
import type { RouteHandler } from './types.js'
import { healthHandler } from './routes/health.js'
import { loginHandler } from './routes/login.js'
import { meHandler } from './routes/me.js'
import { contentTypesHandler } from './routes/content-types.js'
import { contentHandler } from './routes/content.js'
import { apiDashboardHandler } from './routes/api-dashboard.js'
import { mediaHandler } from './routes/media.js'
import { usersHandler } from './routes/users.js'
import { rolesHandler } from './routes/roles.js'
import { permissionsHandler } from './routes/permissions.js'
import { exportHandler } from './routes/export.js'

interface RouteDefinition {
  path: string
  handler: RouteHandler
}

const routes: RouteDefinition[] = [
  { path: '/login', handler: loginHandler },
  { path: '/me', handler: meHandler },
  { path: '/health', handler: healthHandler },
  { path: '/content-types', handler: contentTypesHandler },
  { path: '/content', handler: contentHandler },
  { path: '/api-dashboard', handler: apiDashboardHandler },
  { path: '/media', handler: mediaHandler },
  { path: '/users', handler: usersHandler },
  { path: '/roles', handler: rolesHandler },
  { path: '/permissions', handler: permissionsHandler },
  { path: '/export', handler: exportHandler },
]

/**
 * Main API router middleware for Connect/Vite
 */
export async function apiRouter(
  req: Connect.IncomingMessage,
  res: any,
  next: () => void
): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const pathname = url.pathname

  // Find matching route
  for (const route of routes) {
    if (pathname === `/api${route.path}` || pathname.startsWith(`/api${route.path}/`)) {
      try {
        await route.handler({ req, res, url })
        return
      } catch (error) {
        console.error(`[API Router] Error handling ${pathname}:`, error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: 'Internal server error',
        }))
        return
      }
    }
  }

  // No route matched, pass to next middleware
  next()
}
