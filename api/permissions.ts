import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as permissionService from '../src/services/permissionService.js'
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
    // GET /api/permissions - List all permissions
    if (req.method === 'GET' && !req.query.id) {
      const permissions = await permissionService.getAllPermissions()
      
      return res.status(200).json({
        success: true,
        data: permissions
      })
    }

    // GET /api/permissions?id=123 - Get permission by ID
    if (req.method === 'GET' && req.query.id) {
      const permissionId = parseInt(req.query.id as string)
      const permission = await permissionService.getPermissionById(permissionId)

      if (!permission) {
        return res.status(404).json({
          success: false,
          error: 'Permission not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: permission
      })
    }

    // POST /api/permissions - Create permission
    if (req.method === 'POST') {
      const { name, resource, action, description } = req.body

      if (!name || !resource || !action) {
        return res.status(400).json({
          success: false,
          error: 'name, resource, and action are required'
        })
      }

      const newPermission = await permissionService.createPermission({
        name,
        resource,
        action,
        description
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'create',
        resource: 'permission',
        resourceId: newPermission.id,
        details: { name: newPermission.name, resource: newPermission.resource, action: newPermission.action },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(201).json({
        success: true,
        data: newPermission
      })
    }

    // PUT /api/permissions?id=123 - Update permission
    if (req.method === 'PUT' && req.query.id) {
      const permissionId = parseInt(req.query.id as string)
      const { name, resource, action, description } = req.body

      const updatedPermission = await permissionService.updatePermission(permissionId, {
        name,
        resource,
        action,
        description
      })

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'update',
        resource: 'permission',
        resourceId: permissionId,
        details: req.body,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        data: updatedPermission
      })
    }

    // DELETE /api/permissions?id=123 - Delete permission
    if (req.method === 'DELETE' && req.query.id) {
      const permissionId = parseInt(req.query.id as string)
      
      await permissionService.deletePermission(permissionId)

      // Audit log
      await auditLogService.createAuditLog({
        userId: user.userId,
        action: 'delete',
        resource: 'permission',
        resourceId: permissionId,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return res.status(200).json({
        success: true,
        message: 'Permission deleted successfully'
      })
    }

    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    })
  } catch (error: any) {
    console.error('Permissions API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
