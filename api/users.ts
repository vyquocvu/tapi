import { createAuthHandler, type HandlerContext } from './_lib/handler.js'
import { successResponse, badRequestResponse, notFoundResponse, HTTP_STATUS } from './_lib/response.js'
import { createRouter } from './_lib/router.js'
import * as userManagementService from '../src/services/userManagementService.js'
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

// POST /api/users/assign-role - Assign role to user
router.post('/assign-role', async ({ req, res, user }) => {
  const { userId, roleId } = req.body

  if (!userId || !roleId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('userId and roleId are required')
    )
    return
  }

  await userManagementService.assignRoleToUser(userId, roleId, user!.userId)
  await audit(user!, 'assign', 'user_role', userId, { roleId }, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Role assigned successfully' }))
})

// POST /api/users/remove-role - Remove role from user
router.post('/remove-role', async ({ req, res, user }) => {
  const { userId, roleId } = req.body

  if (!userId || !roleId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('userId and roleId are required')
    )
    return
  }

  await userManagementService.removeRoleFromUser(userId, roleId)
  await audit(user!, 'revoke', 'user_role', userId, { roleId }, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Role removed successfully' }))
})

// GET /api/users - List all users or get user by ID
router.get(async ({ res, params }) => {
  if (!params.id) {
    const includeInactive = params.includeInactive === 'true'
    const users = await userManagementService.getAllUsers(includeInactive)
    res.status(HTTP_STATUS.OK).json(successResponse(users))
    return
  }

  const userId = parseInt(params.id as string)
  const includeRoles = params.includeRoles === 'true'
  
  let userData
  if (includeRoles) {
    userData = await userManagementService.getUserWithRolesAndPermissions(userId)
  } else {
    userData = await userManagementService.getUserById(userId)
  }

  if (!userData) {
    res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('User'))
    return
  }

  res.status(HTTP_STATUS.OK).json(successResponse(userData))
})

// POST /api/users - Create user
router.post(async ({ req, res, user }) => {
  const { email, password, name, bio, avatar, isActive } = req.body

  if (!email || !password || !name) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Email, password, and name are required')
    )
    return
  }

  const newUser = await userManagementService.createUser({
    email,
    password,
    name,
    bio,
    avatar,
    isActive
  })

  await audit(user!, 'create', 'user', newUser.id, { email: newUser.email, name: newUser.name }, req)

  res.status(HTTP_STATUS.CREATED).json(successResponse(newUser))
})

// PUT /api/users - Update user
router.put(async ({ req, res, user, params }) => {
  if (!params.id) return

  const userId = parseInt(params.id as string)
  const { email, password, name, bio, avatar, isActive } = req.body

  const updatedUser = await userManagementService.updateUser(userId, {
    email,
    password,
    name,
    bio,
    avatar,
    isActive
  })

  await audit(user!, 'update', 'user', userId, req.body, req)

  res.status(HTTP_STATUS.OK).json(successResponse(updatedUser))
})

// DELETE /api/users - Delete user
router.delete(async ({ req, res, user, params }) => {
  if (!params.id) return

  const userId = parseInt(params.id as string)
  
  await userManagementService.deleteUser(userId)
  await audit(user!, 'delete', 'user', userId, {}, req)

  res.status(HTTP_STATUS.OK).json(successResponse({ message: 'User deleted successfully' }))
})

export default createAuthHandler(async (context) => {
  await router.handle(context)
})
