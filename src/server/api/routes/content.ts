import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
} from '../../../services/contentManagerService.js'

/**
 * Content Management endpoint
 * GET/POST/PUT/DELETE /api/content
 */
export const contentHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all content requests
  try {
    const context = createContext(req)
    requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const contentType = url.searchParams.get('contentType')
  const id = url.searchParams.get('id')
  const method = req.method

  if (!contentType) {
    sendJson(res, 400, errorResponse('Content type parameter is required'))
    return
  }

  // GET - Find entries or a specific entry
  if (method === 'GET') {
    try {
      if (id) {
        const entryId = parseInt(id, 10)
        if (isNaN(entryId)) {
          sendJson(res, 400, errorResponse('Invalid ID parameter'))
          return
        }

        const entry = await findOne(contentType, entryId)
        if (!entry) {
          sendJson(res, 404, errorResponse('Entry not found'))
          return
        }

        sendJson(res, 200, successResponse(entry))
        return
      }

      // Get all entries
      const entries = await findMany(contentType)
      sendJson(res, 200, successResponse(entries))
      return
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
      return
    }
  }

  // POST - Create new entry
  if (method === 'POST') {
    try {
      const data = await parseRequestBody(req)
      const entry = await create(contentType, { data })
      sendJson(res, 201, successResponse(entry))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT - Update existing entry
  if (method === 'PUT') {
    if (!id) {
      sendJson(res, 400, errorResponse('ID parameter is required for updates'))
      return
    }

    const entryId = parseInt(id, 10)
    if (isNaN(entryId)) {
      sendJson(res, 400, errorResponse('Invalid ID parameter'))
      return
    }

    try {
      const data = await parseRequestBody(req)
      const entry = await update(contentType, {
        where: { id: entryId },
        data,
      })
      sendJson(res, 200, successResponse(entry))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // DELETE - Delete entry
  if (method === 'DELETE') {
    if (!id) {
      sendJson(res, 400, errorResponse('ID parameter is required for deletion'))
      return
    }

    const entryId = parseInt(id, 10)
    if (isNaN(entryId)) {
      sendJson(res, 400, errorResponse('Invalid ID parameter'))
      return
    }

    try {
      await deleteOne(contentType, {
        where: { id: entryId },
      })
      sendJson(res, 200, successResponse({ message: 'Entry deleted successfully' }))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 405, errorResponse('Method not allowed'))
}
