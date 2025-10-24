import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as roleService from '../src/services/roleService.js'
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
    // GET /api/roles - List all roles
    if (req.method === 'GET' && !req.query.id) {
      const roles = await roleService.getAllRoles()
      
      return res.status(200).json({
        success: true,
        data: roles
      })
    }

    // GET /api/roles?id=123 - Get role by ID
    if (req.method === 'GET' && req.query.id) {
      const roleId = parseInt(req.query.id as string)
      const includePermissions = req.query.includePermissions === 'true'
      
      let roleData
      if (includePermissions) {
        roleData = await roleService.getRoleWithPermissions(roleId)
      } else {
        roleData = await roleService.getRoleById(roleId)
      }

      if (!roleData) {
        return res.status(404).json({
          success: false,
          error: 'Role not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: roleData
      })
    }

    // POST /api/roles - Create role
    if (req.method === 'POST' && !req.url?.includes('/assign-permission') && !req.url?.includes('/remove-permission') && !req.url?.includes('/set-permissions')) {
      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Role name is required'
        })
      }

      const newRole = await roleService.createRole({
        name,
        description
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'create',
        resource: 'role',
        resourceId: newRole.id,
        details: { name: newRole.name, description: newRole.description },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(201).json({
        success: true,
        data: newRole
      })
    }

    // PUT /api/roles?id=123 - Update role
    if (req.method === 'PUT' && req.query.id) {
      const roleId = parseInt(req.query.id as string)
      const { name, description } = req.body

      const updatedRole = await roleService.updateRole(roleId, {
        name,
        description
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'update',
        resource: 'role',
        resourceId: roleId,
        details: req.body,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        data: updatedRole
      })
    }

    // DELETE /api/roles?id=123 - Delete role
    if (req.method === 'DELETE' && req.query.id) {
      const roleId = parseInt(req.query.id as string)
      
      await roleService.deleteRole(roleId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'delete',
        resource: 'role',
        resourceId: roleId,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      })
    }

    // POST /api/roles/assign-permission - Assign permission to role
    if (req.method === 'POST' && req.url?.includes('/assign-permission')) {
      const { roleId, permissionId } = req.body

      if (!roleId || !permissionId) {
        return res.status(400).json({
          success: false,
          error: 'roleId and permissionId are required'
        })
      }

      await roleService.assignPermissionToRole(roleId, permissionId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'assign',
        resource: 'role_permission',
        resourceId: roleId,
        details: { permissionId },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Permission assigned successfully'
      })
    }

    // POST /api/roles/remove-permission - Remove permission from role
    if (req.method === 'POST' && req.url?.includes('/remove-permission')) {
      const { roleId, permissionId } = req.body

      if (!roleId || !permissionId) {
        return res.status(400).json({
          success: false,
          error: 'roleId and permissionId are required'
        })
      }

      await roleService.removePermissionFromRole(roleId, permissionId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'revoke',
        resource: 'role_permission',
        resourceId: roleId,
        details: { permissionId },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Permission removed successfully'
      })
    }

    // POST /api/roles/set-permissions - Set all permissions for a role
    if (req.method === 'POST' && req.url?.includes('/set-permissions')) {
      const { roleId, permissionIds } = req.body

      if (!roleId || !Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          error: 'roleId and permissionIds array are required'
        })
      }

      await roleService.setRolePermissions(roleId, permissionIds)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'update',
        resource: 'role_permissions',
        resourceId: roleId,
        details: { permissionIds },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Role permissions updated successfully'
      })
    }

    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    })
  } catch (error: any) {
    console.error('Roles API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
