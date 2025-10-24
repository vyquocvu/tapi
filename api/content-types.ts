import type { VercelRequest, VercelResponse } from '@vercel/node'
import { 
  getAllContentTypes, 
  getContentType, 
  createContentType, 
  updateContentType, 
  deleteContentType 
} from '../src/services/contentTypeService.js'
import { verifyToken } from '../src/server/auth.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'
import { 
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  HTTP_STATUS
} from '../src/utils/apiResponse.js'
import type { ContentTypeDefinition } from '../src/content-type-builder/types.js'

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

  let user: any
  try {
    user = verifyToken(token)
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      unauthorizedResponse('Invalid or expired token')
    )
  }

  try {
    // GET all content types or a specific one
    if (req.method === 'GET') {
      // Check permission
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
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          forbiddenResponse(permissionCheck.error)
        )
      }

      const { uid } = req.query
      
      if (uid && typeof uid === 'string') {
        const contentType = await getContentType(uid)
        if (!contentType) {
          return res.status(HTTP_STATUS.NOT_FOUND).json(
            notFoundResponse('Content type')
          )
        }
        return res.status(HTTP_STATUS.OK).json(successResponse(contentType))
      }
      
      const contentTypes = await getAllContentTypes()
      return res.status(HTTP_STATUS.OK).json(successResponse(contentTypes))
    }

    // CREATE new content type
    if (req.method === 'POST') {
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
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          forbiddenResponse(permissionCheck.error)
        )
      }

      const definition = req.body as ContentTypeDefinition
      const created = await createContentType(definition)
      return res.status(HTTP_STATUS.CREATED).json(successResponse(created))
    }

    // UPDATE existing content type
    if (req.method === 'PUT') {
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
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          forbiddenResponse(permissionCheck.error)
        )
      }

      const { uid } = req.query
      if (!uid || typeof uid !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('UID is required')
        )
      }
      
      const definition = req.body as ContentTypeDefinition
      const updated = await updateContentType(uid, definition)
      return res.status(HTTP_STATUS.OK).json(successResponse(updated))
    }

    // DELETE content type
    if (req.method === 'DELETE') {
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
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          forbiddenResponse(permissionCheck.error)
        )
      }

      const { uid } = req.query
      if (!uid || typeof uid !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('UID is required')
        )
      }
      
      const deleted = await deleteContentType(uid)
      if (!deleted) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          notFoundResponse('Content type')
        )
      }
      
      return res.status(HTTP_STATUS.OK).json(
        successResponse({ message: 'Content type deleted successfully' })
      )
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('[API /content-types] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
