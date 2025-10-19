import type { VercelRequest, VercelResponse } from '@vercel/node'
import { 
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count
} from '../src/services/contentManagerService.js'
import { verifyToken } from '../src/server/auth.js'
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
  HTTP_STATUS
} from '../src/utils/apiResponse.js'
import {
  validateId,
  validateContentTypeUID,
  validatePaginationParams
} from '../src/middleware/validation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Verify authentication for all requests
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(unauthorizedResponse())
  }

  try {
    verifyToken(token)
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      unauthorizedResponse('Invalid or expired token')
    )
  }

  try {
    const { contentType, id } = req.query

    // Validate contentType parameter
    if (!contentType || typeof contentType !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        badRequestResponse('Content type parameter is required')
      )
    }

    // Validate content type UID format
    const uidValidation = validateContentTypeUID(contentType)
    if (!uidValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        validationErrorResponse(uidValidation.errors)
      )
    }

    // GET - Find entries or a specific entry
    if (req.method === 'GET') {
      // Get specific entry by ID
      if (id && typeof id === 'string') {
        const idValidation = validateId(id)
        if (!idValidation.isValid) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json(
            validationErrorResponse(idValidation.errors)
          )
        }

        const entryId = parseInt(id, 10)
        const entry = await findOne(contentType, entryId)
        if (!entry) {
          return res.status(HTTP_STATUS.NOT_FOUND).json(
            notFoundResponse('Entry')
          )
        }

        return res.status(HTTP_STATUS.OK).json(successResponse(entry))
      }

      // Validate pagination parameters
      const paginationValidation = validatePaginationParams(
        req.query.skip,
        req.query.take
      )
      if (!paginationValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          validationErrorResponse(paginationValidation.errors)
        )
      }

      // Get all entries with optional filters
      const entries = await findMany(contentType, {
        where: req.query.where ? JSON.parse(req.query.where as string) : undefined,
        orderBy: req.query.orderBy ? JSON.parse(req.query.orderBy as string) : undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string, 10) : undefined,
        take: req.query.take ? parseInt(req.query.take as string, 10) : undefined,
      })

      // Get total count if requested
      let total: number | undefined
      if (req.query.count === 'true') {
        total = await count(
          contentType,
          req.query.where ? JSON.parse(req.query.where as string) : undefined
        )
      }

      return res.status(HTTP_STATUS.OK).json(
        successResponse(entries, total !== undefined ? { total } : undefined)
      )
    }

    // POST - Create new entry
    if (req.method === 'POST') {
      const data = req.body

      if (!data || typeof data !== 'object') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('Request body must be an object')
        )
      }

      const entry = await create(contentType, { data })

      return res.status(HTTP_STATUS.CREATED).json(successResponse(entry))
    }

    // PUT - Update existing entry
    if (req.method === 'PUT') {
      if (!id || typeof id !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('ID parameter is required for updates')
        )
      }

      const idValidation = validateId(id)
      if (!idValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          validationErrorResponse(idValidation.errors)
        )
      }

      const entryId = parseInt(id, 10)
      const data = req.body

      if (!data || typeof data !== 'object') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('Request body must be an object')
        )
      }

      const entry = await update(contentType, {
        where: { id: entryId },
        data,
      })

      return res.status(HTTP_STATUS.OK).json(successResponse(entry))
    }

    // DELETE - Delete entry
    if (req.method === 'DELETE') {
      if (!id || typeof id !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('ID parameter is required for deletion')
        )
      }

      const idValidation = validateId(id)
      if (!idValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          validationErrorResponse(idValidation.errors)
        )
      }

      const entryId = parseInt(id, 10)

      await deleteOne(contentType, {
        where: { id: entryId },
      })

      return res.status(HTTP_STATUS.OK).json(
        successResponse({ message: 'Entry deleted successfully' })
      )
    }

    return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json(
      badRequestResponse('Method not allowed')
    )
  } catch (error) {
    console.error('[API /content] Error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      serverErrorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      )
    )
  }
}
