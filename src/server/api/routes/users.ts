import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  getAllUsers,
  getUserById,
  getUserWithRolesAndPermissions,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser
} from '../../../services/userManagementService.js'
import { createAuditLog } from '../../../services/auditLogService.js'

/**
 * User Management endpoint
 * GET/POST/PUT/DELETE /api/users
 */
export const usersHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all users requests
  let authenticatedUser: any
  try {
    const context = createContext(req)
    authenticatedUser = requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const userId = url.searchParams.get('id')
  const method = req.method

  // GET /api/users - List all users or get specific user
  if (method === 'GET') {
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
          sendJson(res, 404, errorResponse('User not found'))
          return
        }

        sendJson(res, 200, successResponse(userData))
      } else {
        const includeInactive = url.searchParams.get('includeInactive') === 'true'
        const users = await getAllUsers(includeInactive)
        
        sendJson(res, 200, successResponse(users))
      }
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // POST /api/users - Create user or handle special actions
  if (method === 'POST') {
    try {
      const body = await parseRequestBody(req)
      
      // Check if it's a special action endpoint
      if (req.url?.includes('/assign-role')) {
        const { userId, roleId } = body

        if (!userId || !roleId) {
          sendJson(res, 400, errorResponse('userId and roleId are required'))
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

        sendJson(res, 200, successResponse({ message: 'Role assigned successfully' }))
        return
      }

      if (req.url?.includes('/remove-role')) {
        const { userId, roleId } = body

        if (!userId || !roleId) {
          sendJson(res, 400, errorResponse('userId and roleId are required'))
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

        sendJson(res, 200, successResponse({ message: 'Role removed successfully' }))
        return
      }

      // Regular user creation
      const { email, password, name, bio, avatar, isActive } = body

      if (!email || !password || !name) {
        sendJson(res, 400, errorResponse('Email, password, and name are required'))
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

      sendJson(res, 201, successResponse(newUser))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT /api/users?id=123 - Update user
  if (method === 'PUT' && userId) {
    try {
      const id = parseInt(userId)
      const body = await parseRequestBody(req)
      const { email, password, name, bio, avatar, isActive } = body

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
        details: body,
        ipAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      sendJson(res, 200, successResponse(updatedUser))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // DELETE /api/users?id=123 - Delete user
  if (method === 'DELETE' && userId) {
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

      sendJson(res, 200, successResponse({ message: 'User deleted successfully' }))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 404, errorResponse('Endpoint not found'))
}
