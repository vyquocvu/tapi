import { createHandler } from './_lib/handler.js'
import { createRouter } from './_lib/router.js'
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  validationErrorResponse,
  forbiddenResponse,
  HTTP_STATUS,
} from './_lib/response.js'
import { 
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count
} from '../src/services/contentManagerService.js'
import {
  validateId,
  validateContentTypeUID,
  validatePaginationParams
} from '../src/middleware/validation.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'

const validateContentType = (contentType: any, res: any) => {
  if (!contentType || typeof contentType !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Content type parameter is required')
    )
    return false
  }

  const uidValidation = validateContentTypeUID(contentType)
  if (!uidValidation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      validationErrorResponse(uidValidation.errors.map(e => e.message))
    )
    return false
  }

  return true
}

const router = createRouter()

// GET - Find entries or a specific entry
router.get(async ({ req, res, user, params }) => {
  const { contentType, id } = params
  
  if (!validateContentType(contentType, res)) return
    // Check permission only if user is authenticated
    if (user) {
      const permissionCheck = await checkPermission(
        user.userId,
        'content:read',
        {
          resource: 'content',
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

    // Get specific entry by ID
    if (id && typeof id === 'string') {
      const idValidation = validateId(id)
      if (!idValidation.isValid) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          validationErrorResponse(idValidation.errors.map(e => e.message))
        )
        return
      }

      const entryId = parseInt(id, 10)
      const entry = await findOne(contentType, entryId)
      if (!entry) {
        res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Entry'))
        return
      }

      res.status(HTTP_STATUS.OK).json(successResponse(entry))
      return
    }

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(
      params.skip as string | undefined,
      params.take as string | undefined
    )
    if (!paginationValidation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        validationErrorResponse(paginationValidation.errors.map(e => e.message))
      )
      return
    }

    // Get all entries with optional filters
    const entries = await findMany(contentType, {
      where: params.where ? JSON.parse(params.where as string) : undefined,
      orderBy: params.orderBy ? JSON.parse(params.orderBy as string) : undefined,
      skip: params.skip ? parseInt(params.skip as string, 10) : undefined,
      take: params.take ? parseInt(params.take as string, 10) : undefined,
    })

    // Get total count if requested
    let total: number | undefined
    if (params.count === 'true') {
      total = await count(
        contentType,
        params.where ? JSON.parse(params.where as string) : undefined
      )
    }

    const response = total !== undefined 
      ? { data: entries, total }
      : entries

    res.status(HTTP_STATUS.OK).json(successResponse(response))
})

// POST - Create new entry
router.post(async ({ req, res, user, params }) => {
  const { contentType } = params
  
  if (!validateContentType(contentType, res)) return

  // Require authentication for create operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content:create',
    {
      resource: 'content',
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

  const data = req.body

  if (!data || typeof data !== 'object') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Request body must be an object')
    )
    return
  }

  const entry = await create(contentType as string, { data })
  res.status(HTTP_STATUS.CREATED).json(successResponse(entry))
})

// PUT - Update existing entry
router.put(async ({ req, res, user, params }) => {
  const { contentType, id } = params
  
  if (!validateContentType(contentType, res)) return

  // Require authentication for update operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content:update',
    {
      resource: 'content',
      action: 'update',
      resourceId: id ? parseInt(id as string, 10) : undefined,
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

  if (!id || typeof id !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('ID parameter is required for updates')
    )
    return
  }

  const idValidation = validateId(id)
  if (!idValidation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      validationErrorResponse(idValidation.errors.map(e => e.message))
    )
    return
  }

  const entryId = parseInt(id, 10)
  const data = req.body

  if (!data || typeof data !== 'object') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Request body must be an object')
    )
    return
  }

  const entry = await update(contentType as string, {
    where: { id: entryId },
    data,
  })

  res.status(HTTP_STATUS.OK).json(successResponse(entry))
})

// DELETE - Delete entry
router.delete(async ({ req, res, user, params }) => {
  const { contentType, id } = params
  
  if (!validateContentType(contentType, res)) return

  // Require authentication for delete operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'content:delete',
    {
      resource: 'content',
      action: 'delete',
      resourceId: id ? parseInt(id as string, 10) : undefined,
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

  if (!id || typeof id !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('ID parameter is required for deletion')
    )
    return
  }

  const idValidation = validateId(id)
  if (!idValidation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      validationErrorResponse(idValidation.errors.map(e => e.message))
    )
    return
  }

  const entryId = parseInt(id, 10)

  await deleteOne(contentType as string, {
    where: { id: entryId },
  })

  res.status(HTTP_STATUS.OK).json(
    successResponse({ message: 'Entry deleted successfully' })
  )
})

export default createHandler(async (context) => {
  await router.handle(context)
}, { optionalAuth: true })
