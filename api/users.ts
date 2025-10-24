import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as userManagementService from '../src/services/userManagementService.js'
import * as auditLogService from '../src/services/auditLogService.js'
import { verifyToken } from '../src/server/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Authenticate
  const authHeader = req.headers.authorization as string
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const token = authHeader.substring(7)
  let user: any
  
  try {
    user = verifyToken(token)
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }

  try {
    // GET /api/users - List all users
    if (req.method === 'GET' && !req.query.id) {
      const includeInactive = req.query.includeInactive === 'true'
      const users = await userManagementService.getAllUsers(includeInactive)
      
      return res.status(200).json({
        success: true,
        data: users
      })
    }

    // GET /api/users?id=123 - Get user by ID
    if (req.method === 'GET' && req.query.id) {
      const userId = parseInt(req.query.id as string)
      const includeRoles = req.query.includeRoles === 'true'
      
      let userData
      if (includeRoles) {
        userData = await userManagementService.getUserWithRolesAndPermissions(userId)
      } else {
        userData = await userManagementService.getUserById(userId)
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: userData
      })
    }

    // POST /api/users - Create user
    if (req.method === 'POST') {
      const { email, password, name, bio, avatar, isActive } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        })
      }

      const newUser = await userManagementService.createUser({
        email,
        password,
        name,
        bio,
        avatar,
        isActive
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'create',
        resource: 'user',
        resourceId: newUser.id,
        details: { email: newUser.email, name: newUser.name },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(201).json({
        success: true,
        data: newUser
      })
    }

    // PUT /api/users?id=123 - Update user
    if (req.method === 'PUT' && req.query.id) {
      const userId = parseInt(req.query.id as string)
      const { email, password, name, bio, avatar, isActive } = req.body

      const updatedUser = await userManagementService.updateUser(userId, {
        email,
        password,
        name,
        bio,
        avatar,
        isActive
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        details: req.body,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        data: updatedUser
      })
    }

    // DELETE /api/users?id=123 - Delete user
    if (req.method === 'DELETE' && req.query.id) {
      const userId = parseInt(req.query.id as string)
      
      await userManagementService.deleteUser(userId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'delete',
        resource: 'user',
        resourceId: userId,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      })
    }

    // POST /api/users/assign-role - Assign role to user
    if (req.method === 'POST' && req.url?.includes('/assign-role')) {
      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          error: 'userId and roleId are required'
        })
      }

      await userManagementService.assignRoleToUser(userId, roleId, user.userId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'assign',
        resource: 'user_role',
        resourceId: userId,
        details: { roleId },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Role assigned successfully'
      })
    }

    // POST /api/users/remove-role - Remove role from user
    if (req.method === 'POST' && req.url?.includes('/remove-role')) {
      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          error: 'userId and roleId are required'
        })
      }

      await userManagementService.removeRoleFromUser(userId, roleId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'revoke',
        resource: 'user_role',
        resourceId: userId,
        details: { roleId },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Role removed successfully'
      })
    }

    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    })
  } catch (error: any) {
    console.error('Users API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
