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
  count,
  addRow,
  updateCell,
  deleteRow,
  CreateSheetData,
  UpdateSheetData,
} from '../src/services/sheetService.js'
import { validateId, validatePaginationParams } from '../src/middleware/validation.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'

const router = createRouter()

// GET - Find sheets or a specific sheet
router.get(async ({ req, res, user, params }) => {
  const { id } = params

  // Get specific sheet by ID
  if (id && typeof id === 'string') {
    const idValidation = validateId(id)
    if (!idValidation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        validationErrorResponse(idValidation.errors.map(e => e.message))
      )
      return
    }

    const sheetId = parseInt(id, 10)
    const sheet = await findOne(sheetId)
    
    if (!sheet) {
      res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Sheet'))
      return
    }

    // Check access: user must be owner or sheet must be public
    if (!sheet.isPublic && (!user || sheet.ownerId !== user.userId)) {
      res.status(HTTP_STATUS.FORBIDDEN).json(
        forbiddenResponse('You do not have access to this sheet')
      )
      return
    }

    res.status(HTTP_STATUS.OK).json(successResponse(sheet))
    return
  }

  // List all sheets with optional filters
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

  // Build where clause based on user and filters
  const where: any = {}
  
  // If user is authenticated, show their sheets plus public sheets
  // If not authenticated, only show public sheets
  if (user) {
    // Check permission
    const permissionCheck = await checkPermission(
      user.userId,
      'sheets:read',
      {
        resource: 'sheets',
        action: 'read',
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
      }
    )

    if (!permissionCheck.allowed) {
      // If no permission, only show public sheets
      where.isPublic = true
    } else {
      // Has permission, show owned sheets plus public sheets
      if (params.ownerId === 'me') {
        where.ownerId = user.userId
      } else {
        // Show all accessible sheets (owned or public)
        where.OR = [
          { ownerId: user.userId },
          { isPublic: true }
        ]
      }
    }
  } else {
    // Not authenticated, only public sheets
    where.isPublic = true
  }

  const sheets = await findMany({
    where,
    orderBy: params.orderBy ? JSON.parse(params.orderBy as string) : { createdAt: 'desc' },
    skip: params.skip ? parseInt(params.skip as string, 10) : undefined,
    take: params.take ? parseInt(params.take as string, 10) : undefined,
  })

  // Get total count if requested
  let total: number | undefined
  if (params.count === 'true') {
    total = await count(where)
  }

  const response = total !== undefined ? { data: sheets, total } : sheets

  res.status(HTTP_STATUS.OK).json(successResponse(response))
})

// POST - Create new sheet
router.post(async ({ req, res, user, params }) => {
  // Require authentication for create operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'sheets:create',
    {
      resource: 'sheets',
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

  // Validate required fields
  if (!data.title || typeof data.title !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Title is required and must be a string')
    )
    return
  }

  if (!data.columns || !Array.isArray(data.columns)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Columns are required and must be an array')
    )
    return
  }

  try {
    const createData: CreateSheetData = {
      title: data.title,
      description: data.description,
      columns: data.columns,
      rows: data.rows || [],
      ownerId: user.userId,
      isPublic: data.isPublic || false,
    }

    const sheet = await create(createData)
    res.status(HTTP_STATUS.CREATED).json(successResponse(sheet))
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse(error.message)
    )
  }
})

// PUT - Update existing sheet
router.put(async ({ req, res, user, params }) => {
  const { id } = params

  // Require authentication for update operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
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

  const sheetId = parseInt(id, 10)
  
  // Check if sheet exists and user has access
  const existingSheet = await findOne(sheetId)
  if (!existingSheet) {
    res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Sheet'))
    return
  }

  // Only owner can update
  if (existingSheet.ownerId !== user.userId) {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      forbiddenResponse('You do not have permission to update this sheet')
    )
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'sheets:update',
    {
      resource: 'sheets',
      action: 'update',
      resourceId: sheetId,
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

  try {
    const updateData: UpdateSheetData = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.columns !== undefined) updateData.columns = data.columns
    if (data.rows !== undefined) updateData.rows = data.rows
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

    const sheet = await update(sheetId, updateData)
    res.status(HTTP_STATUS.OK).json(successResponse(sheet))
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse(error.message)
    )
  }
})

// DELETE - Delete sheet
router.delete(async ({ req, res, user, params }) => {
  const { id } = params

  // Require authentication for delete operations
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
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

  const sheetId = parseInt(id, 10)

  // Check if sheet exists and user has access
  const existingSheet = await findOne(sheetId)
  if (!existingSheet) {
    res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Sheet'))
    return
  }

  // Only owner can delete
  if (existingSheet.ownerId !== user.userId) {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      forbiddenResponse('You do not have permission to delete this sheet')
    )
    return
  }

  // Check permission
  const permissionCheck = await checkPermission(
    user.userId,
    'sheets:delete',
    {
      resource: 'sheets',
      action: 'delete',
      resourceId: sheetId,
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

  try {
    await deleteOne(sheetId)
    res.status(HTTP_STATUS.OK).json(
      successResponse({ message: 'Sheet deleted successfully' })
    )
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse(error.message)
    )
  }
})

export default createHandler(async (context) => {
  await router.handle(context)
}, { optionalAuth: true })
