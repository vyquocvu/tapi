import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  getAllRoles,
  getRoleById,
  getRoleWithPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
  setRolePermissions
} from '../../../services/roleService.js'
import { createAuditLog } from '../../../services/auditLogService.js'

/**
 * Role Management endpoint
 * GET/POST/PUT/DELETE /api/roles
 */
export const rolesHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all roles requests
  let authenticatedUser: any
  try {
    const context = createContext(req)
    authenticatedUser = requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const roleId = url.searchParams.get('id')
  const method = req.method

  // GET /api/roles - List all roles or get specific role
  if (method === 'GET') {
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
          sendJson(res, 404, errorResponse('Role not found'))
          return
        }

        sendJson(res, 200, successResponse(roleData))
      } else {
        const roles = await getAllRoles()
        sendJson(res, 200, successResponse(roles))
      }
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // POST /api/roles - Create role or handle special actions
  if (method === 'POST') {
    try {
      const body = await parseRequestBody(req)

      // Check if it's a special action endpoint
      if (req.url?.includes('/assign-permission')) {
        const { roleId, permissionId } = body

        if (!roleId || !permissionId) {
          sendJson(res, 400, errorResponse('roleId and permissionId are required'))
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

        sendJson(res, 200, successResponse({ message: 'Permission assigned successfully' }))
        return
      }

      if (req.url?.includes('/remove-permission')) {
        const { roleId, permissionId } = body

        if (!roleId || !permissionId) {
          sendJson(res, 400, errorResponse('roleId and permissionId are required'))
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

        sendJson(res, 200, successResponse({ message: 'Permission removed successfully' }))
        return
      }

      if (req.url?.includes('/set-permissions')) {
        const { roleId, permissionIds } = body

        if (!roleId || !permissionIds) {
          sendJson(res, 400, errorResponse('roleId and permissionIds are required'))
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

        sendJson(res, 200, successResponse({ message: 'Permissions updated successfully' }))
        return
      }

      // Regular role creation
      const { name, description } = body

      if (!name) {
        sendJson(res, 400, errorResponse('Name is required'))
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

      sendJson(res, 201, successResponse(newRole))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT /api/roles?id=123 - Update role
  if (method === 'PUT' && roleId) {
    try {
      const id = parseInt(roleId)
      const body = await parseRequestBody(req)
      const { name, description } = body

      const updatedRole = await updateRole(id, { name, description })

      // Audit log
      await createAuditLog({
        userId: authenticatedUser.userId,
        action: 'update',
        resource: 'role',
        resourceId: id,
        details: body,
        ipAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      sendJson(res, 200, successResponse(updatedRole))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // DELETE /api/roles?id=123 - Delete role
  if (method === 'DELETE' && roleId) {
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

      sendJson(res, 200, successResponse({ message: 'Role deleted successfully' }))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 404, errorResponse('Endpoint not found'))
}
