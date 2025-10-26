import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import type { Connect } from 'vite'
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
      server.middlewares.use('/api', async (req: Connect.IncomingMessage, res: any, next) => {
        // Dynamically import services (ESM modules)
        const { loginUser } = await import('./src/services/authService.js')
        const { getAllPosts } = await import('./src/services/postService.js')
        const { 
          getAllContentTypes,
          getContentType, 
          createContentType, 
          updateContentType, 
          deleteContentType 
        } = await import('./src/services/contentTypeService.js')
        const {
          findMany,
          findOne,
          create,
          update,
          deleteOne,
          count
        } = await import('./src/services/contentManagerService.js')
        const {
          getAPIEndpoints,
          getAPIStatistics,
          getRecentActivityLogs,
          getEndpointDocumentation
        } = await import('./src/services/apiAnalyticsService.js')
        const {
          getAllEndpointConfigs,
          getEndpointConfig,
          updateEndpointConfig,
          generateAPIDocumentation,
          generateOpenAPISpec
        } = await import('./src/services/apiEndpointConfigService.js')
        const { createContext, requireAuth } = await import('./src/server/context.js')
        const {
          uploadFile,
          deleteFile,
          listFiles,
          getFileMetadata,
          getProviderInfo
        } = await import('./src/services/mediaService.js')
        const {
          getAllUsers,
          getUserById,
          getUserWithRolesAndPermissions,
          createUser,
          updateUser,
          deleteUser,
          assignRoleToUser,
          removeRoleFromUser
        } = await import('./src/services/userManagementService.js')
        const {
          getAllRoles,
          getRoleById,
          getRoleWithPermissions,
          createRole,
          updateRole,
          deleteRole,
          assignPermissionToRole,
          removePermissionFromRole,
          setRolePermissions
        } = await import('./src/services/roleService.js')
        const {
          getAllPermissions,
          getPermissionById,
          createPermission,
          updatePermission,
          deletePermission
        } = await import('./src/services/permissionService.js')
        const { createAuditLog } = await import('./src/services/auditLogService.js')
        const multer = (await import('multer')).default

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

        // Handle /api/content-types endpoints
        if (req.url?.startsWith('/content-types')) {
          // Verify authentication for all content-types requests
          try {
            const context = createContext(req)
            requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          // GET all content types or specific one
          if (req.method === 'GET') {
            try {
              const url = new URL(req.url, `http://${req.headers.host}`)
              const uid = url.searchParams.get('uid')
              
              if (uid) {
                const contentType = await getContentType(uid)
                if (!contentType) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Content type not found',
                  }))
                  return
                }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: contentType,
                }))
              } else {
                const contentTypes = await getAllContentTypes()
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: contentTypes,
                }))
              }
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // POST - Create new content type
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const definition = JSON.parse(body)
                const created = await createContentType(definition)
                res.statusCode = 201
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: created,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // PUT - Update content type
          if (req.method === 'PUT') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const url = new URL(req.url!, `http://${req.headers.host}`)
                const uid = url.searchParams.get('uid')
                if (!uid) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'UID is required',
                  }))
                  return
                }
                const definition = JSON.parse(body)
                const updated = await updateContentType(uid, definition)
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: updated,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // DELETE - Delete content type
          if (req.method === 'DELETE') {
            try {
              const url = new URL(req.url!, `http://${req.headers.host}`)
              const uid = url.searchParams.get('uid')
              if (!uid) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'UID is required',
                }))
                return
              }
              const deleted = await deleteContentType(uid)
              if (!deleted) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'Content type not found',
                }))
                return
              }
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'Content type deleted successfully',
              }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }
        }

        // Handle /api/content endpoints for content management
        if (req.url?.startsWith('/content')) {
          // Verify authentication for all content requests
          try {
            const context = createContext(req)
            requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const contentType = url.searchParams.get('contentType')
          const id = url.searchParams.get('id')

          if (!contentType) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Content type parameter is required',
            }))
            return
          }

          // GET - Find entries or a specific entry
          if (req.method === 'GET') {
            try {
              if (id) {
                const entryId = parseInt(id, 10)
                if (isNaN(entryId)) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid ID parameter',
                  }))
                  return
                }

                const entry = await findOne(contentType, entryId)
                if (!entry) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Entry not found',
                  }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: entry,
                }))
                return
              }

              // Get all entries
              const entries = await findMany(contentType)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                data: entries,
              }))
              return
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
              return
            }
          }

          // POST - Create new entry
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body)
                const entry = await create(contentType, { data })
                res.statusCode = 201
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: entry,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // PUT - Update existing entry
          if (req.method === 'PUT') {
            if (!id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'ID parameter is required for updates',
              }))
              return
            }

            const entryId = parseInt(id, 10)
            if (isNaN(entryId)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Invalid ID parameter',
              }))
              return
            }

            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body)
                const entry = await update(contentType, {
                  where: { id: entryId },
                  data,
                })
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: entry,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // DELETE - Delete entry
          if (req.method === 'DELETE') {
            if (!id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'ID parameter is required for deletion',
              }))
              return
            }

            const entryId = parseInt(id, 10)
            if (isNaN(entryId)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Invalid ID parameter',
              }))
              return
            }

            try {
              await deleteOne(contentType, {
                where: { id: entryId },
              })
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'Entry deleted successfully',
              }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }
        }

        // Handle /api/api-dashboard (API Controller Dashboard)
        if (req.url?.startsWith('/api-dashboard') && req.method === 'GET') {
          try {
            const context = createContext(req)
            requireAuth(context)
            
            const url = new URL(req.url!, `http://${req.headers.host}`)
            const action = url.searchParams.get('action')
            const contentType = url.searchParams.get('contentType')
            const limit = url.searchParams.get('limit')

            let data: any

            if (action === 'endpoints') {
              data = getAPIEndpoints()
            } else if (action === 'statistics') {
              data = getAPIStatistics()
            } else if (action === 'activity') {
              data = getRecentActivityLogs(limit ? parseInt(limit, 10) : 10)
            } else if (action === 'documentation') {
              data = getEndpointDocumentation()
            } else if (action === 'configs') {
              data = await getAllEndpointConfigs()
            } else if (action === 'config' && contentType) {
              data = await getEndpointConfig(contentType)
              if (!data) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'Content type not found',
                }))
                return
              }
            } else if (action === 'generate-docs' && contentType) {
              const docs = await generateAPIDocumentation(contentType)
              data = { markdown: docs }
            } else if (action === 'openapi' && contentType) {
              data = await generateOpenAPISpec(contentType)
            } else {
              // Default: return overview
              data = {
                statistics: getAPIStatistics(),
                recentActivity: getRecentActivityLogs(5),
                endpoints: getAPIEndpoints(),
              }
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              data,
            }))
          } catch (error) {
            console.error('[Vite API /api-dashboard] Error:', error)
            res.statusCode = error instanceof Error && error.message === 'Unauthorized' ? 401 : 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Internal server error',
            }))
          }
          return
        }

        // Handle PUT /api/api-dashboard (Update endpoint config)
        if (req.url?.startsWith('/api-dashboard') && req.method === 'PUT') {
          try {
            const context = createContext(req)
            requireAuth(context)
            
            const url = new URL(req.url!, `http://${req.headers.host}`)
            const contentType = url.searchParams.get('contentType')

            if (!contentType) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: 'Content type parameter is required',
              }))
              return
            }

            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const config = JSON.parse(body)
                const updated = await updateEndpointConfig(contentType, config)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: updated,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
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

        // Handle /api/media endpoints
        if (req.url?.startsWith('/media')) {
          // Verify authentication for all media requests
          try {
            const context = createContext(req)
            requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const action = url.searchParams.get('action')
          const folder = url.searchParams.get('folder')
          const id = url.searchParams.get('id')

          // GET - List files or get provider info
          if (req.method === 'GET') {
            try {
              if (action === 'provider-info') {
                const info = getProviderInfo()
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: info,
                }))
                return
              }

              const files = await listFiles(folder || undefined)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                data: files,
              }))
              return
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
              return
            }
          }

          // POST - Upload file
          if (req.method === 'POST') {
            try {
              // Set up multer for memory storage
              const storage = multer.memoryStorage()
              const upload = multer({ storage }).single('file')

              // Wrap multer in a promise
              await new Promise<void>((resolve, reject) => {
                upload(req as any, res as any, (err: any) => {
                  if (err) reject(err)
                  else resolve()
                })
              })

              const file = (req as any).file
              if (!file) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'No file provided',
                }))
                return
              }

              const uploadedFile = await uploadFile(
                file.buffer,
                file.originalname,
                {
                  contentType: file.mimetype,
                  folder: folder || undefined,
                }
              )

              res.statusCode = 201
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                data: uploadedFile,
              }))
              return
            } catch (error) {
              console.error('[Vite API /media] Error uploading file:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
              return
            }
          }

          // DELETE - Delete file
          if (req.method === 'DELETE') {
            try {
              if (!id) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'File ID is required',
                }))
                return
              }

              const result = await deleteFile(id)
              
              if (!result) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: 'File not found or could not be deleted',
                }))
                return
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'File deleted successfully',
              }))
              return
            } catch (error) {
              console.error('[Vite API /media] Error deleting file:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
              return
            }
          }
        }

        // Handle /api/users endpoints
        if (req.url?.startsWith('/users')) {
          // Verify authentication for all users requests
          let authenticatedUser: any
          try {
            const context = createContext(req)
            authenticatedUser = requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const userId = url.searchParams.get('id')

          // GET /api/users - List all users or get specific user
          if (req.method === 'GET') {
            try {
              if (userId) {
                const id = parseInt(userId)
                const includeRoles = url.searchParams.get('includeRoles') === 'true'
                
                let userData
                if (includeRoles) {
                  userData = await getUserWithRolesAndPermissions(id)
                } else {
                  userData = await getUserById(id)
                }

                if (!userData) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'User not found',
                  }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: userData,
                }))
              } else {
                const includeInactive = url.searchParams.get('includeInactive') === 'true'
                const users = await getAllUsers(includeInactive)
                
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: users,
                }))
              }
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // POST /api/users - Create user or handle special actions
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                // Check if it's a special action endpoint
                if (req.url?.includes('/assign-role')) {
                  const { userId, roleId } = JSON.parse(body)

                  if (!userId || !roleId) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                      success: false,
                      error: 'userId and roleId are required',
                    }))
                    return
                  }

                  await assignRoleToUser(userId, roleId, authenticatedUser.userId)

                  // Audit log
                  await createAuditLog({
                    userId: authenticatedUser.userId,
                    action: 'assign',
                    resource: 'user_role',
                    resourceId: userId,
                    details: { roleId },
                    ipAddress: req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent']
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Role assigned successfully',
                  }))
                  return
                }

                if (req.url?.includes('/remove-role')) {
                  const { userId, roleId } = JSON.parse(body)

                  if (!userId || !roleId) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                      success: false,
                      error: 'userId and roleId are required',
                    }))
                    return
                  }

                  await removeRoleFromUser(userId, roleId)

                  // Audit log
                  await createAuditLog({
                    userId: authenticatedUser.userId,
                    action: 'revoke',
                    resource: 'user_role',
                    resourceId: userId,
                    details: { roleId },
                    ipAddress: req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent']
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Role removed successfully',
                  }))
                  return
                }

                // Regular user creation
                const { email, password, name, bio, avatar, isActive } = JSON.parse(body)

                if (!email || !password || !name) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Email, password, and name are required',
                  }))
                  return
                }

                const newUser = await createUser({
                  email,
                  password,
                  name,
                  bio,
                  avatar,
                  isActive
                })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'create',
                  resource: 'user',
                  resourceId: newUser.id,
                  details: { email: newUser.email, name: newUser.name },
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 201
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: newUser,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // PUT /api/users?id=123 - Update user
          if (req.method === 'PUT' && userId) {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const id = parseInt(userId)
                const { email, password, name, bio, avatar, isActive } = JSON.parse(body)

                const updatedUser = await updateUser(id, {
                  email,
                  password,
                  name,
                  bio,
                  avatar,
                  isActive
                })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'update',
                  resource: 'user',
                  resourceId: id,
                  details: JSON.parse(body),
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: updatedUser,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // DELETE /api/users?id=123 - Delete user
          if (req.method === 'DELETE' && userId) {
            try {
              const id = parseInt(userId)
              
              await deleteUser(id)

              // Audit log
              await createAuditLog({
                userId: authenticatedUser.userId,
                action: 'delete',
                resource: 'user',
                resourceId: id,
                ipAddress: req.socket?.remoteAddress,
                userAgent: req.headers['user-agent']
              })

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'User deleted successfully',
              }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // If we get here, the endpoint wasn't recognized
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
          }))
          return
        }

        // Handle /api/roles endpoints
        if (req.url?.startsWith('/roles')) {
          // Verify authentication for all roles requests
          let authenticatedUser: any
          try {
            const context = createContext(req)
            authenticatedUser = requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const roleId = url.searchParams.get('id')

          // GET /api/roles - List all roles or get specific role
          if (req.method === 'GET') {
            try {
              if (roleId) {
                const id = parseInt(roleId)
                const includePermissions = url.searchParams.get('includePermissions') === 'true'
                
                let roleData
                if (includePermissions) {
                  roleData = await getRoleWithPermissions(id)
                } else {
                  roleData = await getRoleById(id)
                }

                if (!roleData) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Role not found',
                  }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: roleData,
                }))
              } else {
                const roles = await getAllRoles()
                
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: roles,
                }))
              }
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // POST /api/roles - Create role or handle special actions
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                // Check if it's a special action endpoint
                if (req.url?.includes('/assign-permission')) {
                  const { roleId, permissionId } = JSON.parse(body)

                  if (!roleId || !permissionId) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                      success: false,
                      error: 'roleId and permissionId are required',
                    }))
                    return
                  }

                  await assignPermissionToRole(roleId, permissionId)

                  // Audit log
                  await createAuditLog({
                    userId: authenticatedUser.userId,
                    action: 'assign',
                    resource: 'role_permission',
                    resourceId: roleId,
                    details: { permissionId },
                    ipAddress: req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent']
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Permission assigned successfully',
                  }))
                  return
                }

                if (req.url?.includes('/remove-permission')) {
                  const { roleId, permissionId } = JSON.parse(body)

                  if (!roleId || !permissionId) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                      success: false,
                      error: 'roleId and permissionId are required',
                    }))
                    return
                  }

                  await removePermissionFromRole(roleId, permissionId)

                  // Audit log
                  await createAuditLog({
                    userId: authenticatedUser.userId,
                    action: 'revoke',
                    resource: 'role_permission',
                    resourceId: roleId,
                    details: { permissionId },
                    ipAddress: req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent']
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Permission removed successfully',
                  }))
                  return
                }

                if (req.url?.includes('/set-permissions')) {
                  const { roleId, permissionIds } = JSON.parse(body)

                  if (!roleId || !permissionIds) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                      success: false,
                      error: 'roleId and permissionIds are required',
                    }))
                    return
                  }

                  await setRolePermissions(roleId, permissionIds)

                  // Audit log
                  await createAuditLog({
                    userId: authenticatedUser.userId,
                    action: 'update',
                    resource: 'role_permissions',
                    resourceId: roleId,
                    details: { permissionIds },
                    ipAddress: req.socket?.remoteAddress,
                    userAgent: req.headers['user-agent']
                  })

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Permissions updated successfully',
                  }))
                  return
                }

                // Regular role creation
                const { name, description } = JSON.parse(body)

                if (!name) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Name is required',
                  }))
                  return
                }

                const newRole = await createRole({ name, description })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'create',
                  resource: 'role',
                  resourceId: newRole.id,
                  details: { name: newRole.name },
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 201
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: newRole,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // PUT /api/roles?id=123 - Update role
          if (req.method === 'PUT' && roleId) {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const id = parseInt(roleId)
                const { name, description } = JSON.parse(body)

                const updatedRole = await updateRole(id, { name, description })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'update',
                  resource: 'role',
                  resourceId: id,
                  details: JSON.parse(body),
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: updatedRole,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // DELETE /api/roles?id=123 - Delete role
          if (req.method === 'DELETE' && roleId) {
            try {
              const id = parseInt(roleId)
              
              await deleteRole(id)

              // Audit log
              await createAuditLog({
                userId: authenticatedUser.userId,
                action: 'delete',
                resource: 'role',
                resourceId: id,
                ipAddress: req.socket?.remoteAddress,
                userAgent: req.headers['user-agent']
              })

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'Role deleted successfully',
              }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // If we get here, the endpoint wasn't recognized
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
          }))
          return
        }

        // Handle /api/permissions
        if (req.url?.startsWith('/permissions')) {
          // Verify authentication for all permissions requests
          let authenticatedUser: any
          try {
            const context = createContext(req)
            authenticatedUser = requireAuth(context)
          } catch (error) {
            res.statusCode = 401
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Unauthorized',
            }))
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const permissionId = url.searchParams.get('id')

          // GET /api/permissions - List all permissions or get specific permission
          if (req.method === 'GET') {
            try {
              if (permissionId) {
                const id = parseInt(permissionId)
                const permissionData = await getPermissionById(id)

                if (!permissionData) {
                  res.statusCode = 404
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Permission not found',
                  }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: permissionData,
                }))
              } else {
                const permissions = await getAllPermissions()
                
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: permissions,
                }))
              }
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // POST /api/permissions - Create permission
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const { name, resource, action, description } = JSON.parse(body)

                if (!name || !resource || !action) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    success: false,
                    error: 'name, resource, and action are required',
                  }))
                  return
                }

                const newPermission = await createPermission({ name, resource, action, description })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'create',
                  resource: 'permission',
                  resourceId: newPermission.id,
                  details: { name, resource, action, description },
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 201
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: newPermission,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // PUT /api/permissions?id=123 - Update permission
          if (req.method === 'PUT' && permissionId) {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const id = parseInt(permissionId)
                const { name, resource, action, description } = JSON.parse(body)

                const updatedPermission = await updatePermission(id, { name, resource, action, description })

                // Audit log
                await createAuditLog({
                  userId: authenticatedUser.userId,
                  action: 'update',
                  resource: 'permission',
                  resourceId: id,
                  details: JSON.parse(body),
                  ipAddress: req.socket?.remoteAddress,
                  userAgent: req.headers['user-agent']
                })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  data: updatedPermission,
                }))
              } catch (error) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error',
                }))
              }
            })
            return
          }

          // DELETE /api/permissions?id=123 - Delete permission
          if (req.method === 'DELETE' && permissionId) {
            try {
              const id = parseInt(permissionId)
              
              await deletePermission(id)

              // Audit log
              await createAuditLog({
                userId: authenticatedUser.userId,
                action: 'delete',
                resource: 'permission',
                resourceId: id,
                ipAddress: req.socket?.remoteAddress,
                userAgent: req.headers['user-agent']
              })

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                message: 'Permission deleted successfully',
              }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
              }))
            }
            return
          }

          // If we get here, the endpoint wasn't recognized
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
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
