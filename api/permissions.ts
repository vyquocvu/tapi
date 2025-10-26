import { createAuthHandler, type HandlerContext } from './_lib/handler.js'
import { createRouter } from './_lib/router.js'
import * as permissionService from '../src/services/permissionService.js'
import * as auditLogService from '../src/services/auditLogService.js'
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  HTTP_STATUS,
} from './_lib/response.js'

// Helper to create audit log
const audit = async (
  user: NonNullable<HandlerContext['user']>,
  action: string,
  resource: string,
  resourceId: number,
  details: any,
  req: HandlerContext['req']
) => {
  await auditLogService.createAuditLog({
    userId: user.userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent']
  })
}

const router = createRouter()

// GET - List all permissions or get by ID
router.get(async ({ res, params }) => {
  const permissionId = params.id ? parseInt(params.id as string) : null

  if (permissionId) {
    const permission = await permissionService.getPermissionById(permissionId)
    if (!permission) {
      res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Permission'))
      return
    }
    res.status(HTTP_STATUS.OK).json(successResponse(permission))
  } else {
    const permissions = await permissionService.getAllPermissions()
    res.status(HTTP_STATUS.OK).json(successResponse(permissions))
  }
})

// POST - Create permission
router.post(async ({ req, res, user }) => {
  const { name, resource, action, description } = req.body

  if (!name || !resource || !action) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('name, resource, and action are required')
    )
    return
  }

  const newPermission = await permissionService.createPermission({
    name,
    resource,
    action,
    description,
  })

  await audit(user!, 'create', 'permission', newPermission.id, 
    { name: newPermission.name, resource: newPermission.resource, action: newPermission.action }, req)

  res.status(HTTP_STATUS.CREATED).json(successResponse(newPermission))
})

// PUT - Update permission
router.put(async ({ req, res, user, params }) => {
  if (!params.id) return

  const permissionId = parseInt(params.id as string)
  const { name, resource, action, description } = req.body

  const updatedPermission = await permissionService.updatePermission(permissionId, {
    name,
    resource,
    action,
    description,
  })

  await audit(user!, 'update', 'permission', permissionId, req.body, req)

  res.status(HTTP_STATUS.OK).json(successResponse(updatedPermission))
})

// DELETE - Delete permission
router.delete(async ({ req, res, user, params }) => {
  if (!params.id) return

  const permissionId = parseInt(params.id as string)
  
  await permissionService.deletePermission(permissionId)
  await audit(user!, 'delete', 'permission', permissionId, {}, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Permission deleted successfully' }))
})

export default createAuthHandler(async (context) => {
  await router.handle(context)
})
