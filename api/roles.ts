import { createAuthHandler, type HandlerContext } from './_lib/handler.js'
import { successResponse, badRequestResponse, notFoundResponse, HTTP_STATUS } from './_lib/response.js'
import { createRouter } from './_lib/router.js'
import * as roleService from '../src/services/roleService.js'
import * as auditLogService from '../src/services/auditLogService.js'

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

// POST /api/roles/assign-permission - Assign permission to role
router.post('/assign-permission', async ({ req, res, user }) => {
  const { roleId, permissionId } = req.body

  if (!roleId || !permissionId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('roleId and permissionId are required')
    )
    return
  }

  await roleService.assignPermissionToRole(roleId, permissionId)
  await audit(user!, 'assign', 'role_permission', roleId, { permissionId }, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Permission assigned successfully' }))
})

// POST /api/roles/remove-permission - Remove permission from role
router.post('/remove-permission', async ({ req, res, user }) => {
  const { roleId, permissionId } = req.body

  if (!roleId || !permissionId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('roleId and permissionId are required')
    )
    return
  }

  await roleService.removePermissionFromRole(roleId, permissionId)
  await audit(user!, 'revoke', 'role_permission', roleId, { permissionId }, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Permission removed successfully' }))
})

// POST /api/roles/set-permissions - Set all permissions for a role
router.post('/set-permissions', async ({ req, res, user }) => {
  const { roleId, permissionIds } = req.body

  if (!roleId || !Array.isArray(permissionIds)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('roleId and permissionIds array are required')
    )
    return
  }

  await roleService.setRolePermissions(roleId, permissionIds)
  await audit(user!, 'update', 'role_permissions', roleId, { permissionIds }, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Role permissions updated successfully' }))
})

// GET /api/roles - List all roles or get role by ID
router.get(async ({ res, params }) => {
  if (!params.id) {
    const roles = await roleService.getAllRoles()
    res.status(HTTP_STATUS.OK).json(successResponse(roles))
    return
  }

  const roleId = parseInt(params.id as string)
  const includePermissions = params.includePermissions === 'true'
  
  let roleData
  if (includePermissions) {
    roleData = await roleService.getRoleWithPermissions(roleId)
  } else {
    roleData = await roleService.getRoleById(roleId)
  }

  if (!roleData) {
    res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Role'))
    return
  }

  res.status(HTTP_STATUS.OK).json(successResponse(roleData))
})

// POST /api/roles - Create role
router.post(async ({ req, res, user }) => {
  const { name, description } = req.body

  if (!name) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Role name is required')
    )
    return
  }

  const newRole = await roleService.createRole({
    name,
    description
  })

  await audit(user!, 'create', 'role', newRole.id, { name: newRole.name, description: newRole.description }, req)

  res.status(HTTP_STATUS.CREATED).json(successResponse(newRole))
})

// PUT /api/roles - Update role
router.put(async ({ req, res, user, params }) => {
  if (!params.id) return

  const roleId = parseInt(params.id as string)
  const { name, description } = req.body

  const updatedRole = await roleService.updateRole(roleId, {
    name,
    description
  })

  await audit(user!, 'update', 'role', roleId, req.body, req)

  res.status(HTTP_STATUS.OK).json(successResponse(updatedRole))
})

// DELETE /api/roles - Delete role
router.delete(async ({ req, res, user, params }) => {
  if (!params.id) return

  const roleId = parseInt(params.id as string)
  
  await roleService.deleteRole(roleId)
  await audit(user!, 'delete', 'role', roleId, {}, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Role deleted successfully' }))
})


export default createAuthHandler(async (context) => {
  await router.handle(context)
})
