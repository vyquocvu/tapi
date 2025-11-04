import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
} from '../../../services/permissionService.js'
import { createAuditLog } from '../../../services/auditLogService.js'

/**
 * Permission Management endpoint
 * GET/POST/PUT/DELETE /api/permissions
 */
export const permissionsHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all permissions requests
  let authenticatedUser: any
  try {
    const context = createContext(req)
    authenticatedUser = requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const permissionId = url.searchParams.get('id')
  const method = req.method

  // GET /api/permissions - List all permissions or get specific permission
  if (method === 'GET') {
    try {
      if (permissionId) {
        const id = parseInt(permissionId)
        const permissionData = await getPermissionById(id)

        if (!permissionData) {
          sendJson(res, 404, errorResponse('Permission not found'))
          return
        }

        sendJson(res, 200, successResponse(permissionData))
      } else {
        const permissions = await getAllPermissions()
        sendJson(res, 200, successResponse(permissions))
      }
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // POST /api/permissions - Create permission
  if (method === 'POST') {
    try {
      const body = await parseRequestBody(req)
      const { name, resource, action, description } = body

      if (!name || !resource || !action) {
        sendJson(res, 400, errorResponse('name, resource, and action are required'))
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

      sendJson(res, 201, successResponse(newPermission))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT /api/permissions?id=123 - Update permission
  if (method === 'PUT' && permissionId) {
    try {
      const id = parseInt(permissionId)
      const body = await parseRequestBody(req)
      const { name, resource, action, description } = body

      const updatedPermission = await updatePermission(id, { name, resource, action, description })

      // Audit log
      await createAuditLog({
        userId: authenticatedUser.userId,
        action: 'update',
        resource: 'permission',
        resourceId: id,
        details: body,
        ipAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      sendJson(res, 200, successResponse(updatedPermission))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // DELETE /api/permissions?id=123 - Delete permission
  if (method === 'DELETE' && permissionId) {
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

      sendJson(res, 200, successResponse({ message: 'Permission deleted successfully' }))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 404, errorResponse('Endpoint not found'))
}
