import { createHandler } from './_lib/handler.js'
import { createRouter } from './_lib/router.js'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
  HTTP_STATUS,
} from './_lib/response.js'
import { 
  getAllContentTypes, 
  getContentType, 
  createContentType, 
  updateContentType, 
  deleteContentType 
} from '../src/services/contentTypeService.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'
import type { ContentTypeDefinition } from '../src/content-type-builder/types.js'

const router = createRouter()

// GET - List all content types or get specific content type
router.get(async ({ req, res, user, params }) => {
  // Check permission only if user is authenticated
  if (user) {
    const permissionCheck = await checkPermission(
      user.userId,
      'content-types:read',
      {
        resource: 'content-types',
        action: 'read',
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
      }
    )

    if (!permissionCheck.allowed) {
      res.status(HTTP_STATUS.FORBIDDEN).json(
        forbiddenResponse(permissionCheck.error)
      )
      return
    }
  }

  const { uid } = params
  
  if (uid && typeof uid === 'string') {
    const contentType = await getContentType(uid)
    if (!contentType) {
      res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Content type'))
      return
    }
    res.status(HTTP_STATUS.OK).json(successResponse(contentType))
    return
  }
  
  const contentTypes = await getAllContentTypes()
  res.status(HTTP_STATUS.OK).json(successResponse(contentTypes))
})

// POST - Create new content type
router.post(async ({ req, res, user }) => {
  // Require authentication for create operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content-types:create',
    {
      resource: 'content-types',
      action: 'create',
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
    }
  )

  if (!permissionCheck.allowed) {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      forbiddenResponse(permissionCheck.error)
    )
    return
  }

  const definition = req.body as ContentTypeDefinition
  const created = await createContentType(definition)
  res.status(HTTP_STATUS.CREATED).json(successResponse(created))
})

// PUT - Update existing content type
router.put(async ({ req, res, user, params }) => {
  // Require authentication for update operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content-types:update',
    {
      resource: 'content-types',
      action: 'update',
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
    }
  )

  if (!permissionCheck.allowed) {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      forbiddenResponse(permissionCheck.error)
    )
    return
  }

  const { uid } = params
  if (!uid || typeof uid !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('UID is required')
    )
    return
  }
  
  const definition = req.body as ContentTypeDefinition
  const updated = await updateContentType(uid, definition)
  res.status(HTTP_STATUS.OK).json(successResponse(updated))
})

// DELETE - Delete content type
router.delete(async ({ req, res, user, params }) => {
  // Require authentication for delete operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content-types:delete',
    {
      resource: 'content-types',
      action: 'delete',
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
    }
  )

  if (!permissionCheck.allowed) {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      forbiddenResponse(permissionCheck.error)
    )
    return
  }

  const { uid } = params
  if (!uid || typeof uid !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('UID is required')
    )
    return
  }
  
  const deleted = await deleteContentType(uid)
  res.status(HTTP_STATUS.OK).json(successResponse(deleted))
})

export default createHandler(async (context) => {
  await router.handle(context)
}, { optionalAuth: true })
