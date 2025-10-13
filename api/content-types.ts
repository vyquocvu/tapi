import type { VercelRequest, VercelResponse } from '@vercel/node'
import { 
  getAllContentTypes, 
  getContentType, 
  createContentType, 
  updateContentType, 
  deleteContentType 
} from '../src/services/contentTypeService.js'
import { verifyToken } from '../src/server/auth.js'
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
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    })
  }

  try {
    verifyToken(token)
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    })
  }

  try {
    // GET all content types or a specific one
    if (req.method === 'GET') {
      const { uid } = req.query
      
      if (uid && typeof uid === 'string') {
        const contentType = await getContentType(uid)
        if (!contentType) {
          return res.status(404).json({
            success: false,
            error: 'Content type not found',
          })
        }
        return res.status(200).json({
          success: true,
          data: contentType,
        })
      }
      
      const contentTypes = await getAllContentTypes()
      return res.status(200).json({
        success: true,
        data: contentTypes,
      })
    }

    // CREATE new content type
    if (req.method === 'POST') {
      const definition = req.body as ContentTypeDefinition
      const created = await createContentType(definition)
      return res.status(201).json({
        success: true,
        data: created,
      })
    }

    // UPDATE existing content type
    if (req.method === 'PUT') {
      const { uid } = req.query
      if (!uid || typeof uid !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'UID is required',
        })
      }
      
      const definition = req.body as ContentTypeDefinition
      const updated = await updateContentType(uid, definition)
      return res.status(200).json({
        success: true,
        data: updated,
      })
    }

    // DELETE content type
    if (req.method === 'DELETE') {
      const { uid } = req.query
      if (!uid || typeof uid !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'UID is required',
        })
      }
      
      const deleted = await deleteContentType(uid)
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Content type not found',
        })
      }
      
      return res.status(200).json({
        success: true,
        message: 'Content type deleted successfully',
      })
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
