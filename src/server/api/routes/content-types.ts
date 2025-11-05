import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  getAllContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType
} from '../../../services/contentTypeService.js'

/**
 * Content Types endpoint
 * GET/POST/PUT/DELETE /api/content-types
 */
export const contentTypesHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all content-types requests
  try {
    const context = createContext(req)
    requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const method = req.method

  // GET all content types or specific one
  if (method === 'GET') {
    try {
      const uid = url.searchParams.get('uid')
      
      if (uid) {
        const contentType = await getContentType(uid)
        if (!contentType) {
          sendJson(res, 404, errorResponse('Content type not found'))
          return
        }
        sendJson(res, 200, successResponse(contentType))
      } else {
        const contentTypes = await getAllContentTypes()
        sendJson(res, 200, successResponse(contentTypes))
      }
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // POST - Create new content type
  if (method === 'POST') {
    try {
      const definition = await parseRequestBody(req)
      const created = await createContentType(definition)
      sendJson(res, 201, successResponse(created))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT - Update content type
  if (method === 'PUT') {
    try {
      const uid = url.searchParams.get('uid')
      if (!uid) {
        sendJson(res, 400, errorResponse('UID is required'))
        return
      }
      const definition = await parseRequestBody(req)
      const updated = await updateContentType(uid, definition)
      sendJson(res, 200, successResponse(updated))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // DELETE - Delete content type
  if (method === 'DELETE') {
    try {
      const uid = url.searchParams.get('uid')
      if (!uid) {
        sendJson(res, 400, errorResponse('UID is required'))
        return
      }
      const deleted = await deleteContentType(uid)
      if (!deleted) {
        sendJson(res, 404, errorResponse('Content type not found'))
        return
      }
      sendJson(res, 200, successResponse({ message: 'Content type deleted successfully' }))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 405, errorResponse('Method not allowed'))
}
