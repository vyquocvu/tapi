import type { RouteHandler } from '../types.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  uploadFile,
  deleteFile,
  listFiles,
  getFileMetadata,
  getProviderInfo
} from '../../../services/mediaService.js'

/**
 * Media Management endpoint
 * GET/POST/DELETE /api/media
 */
export const mediaHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication for all media requests
  try {
    const context = createContext(req)
    requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const action = url.searchParams.get('action')
  const folder = url.searchParams.get('folder')
  const id = url.searchParams.get('id')
  const method = req.method

  // GET - List files or get provider info
  if (method === 'GET') {
    try {
      if (action === 'provider-info') {
        const info = getProviderInfo()
        sendJson(res, 200, successResponse(info))
        return
      }

      const files = await listFiles(folder || undefined)
      sendJson(res, 200, successResponse(files))
      return
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
      return
    }
  }

  // POST - Upload file
  if (method === 'POST') {
    try {
      // Set up multer for memory storage
      const multer = (await import('multer')).default
      const storage = multer.memoryStorage()
      const upload = multer({ storage }).single('file')

      // Wrap multer in a promise
      await new Promise<void>((resolve, reject) => {
        upload(req as any, res as any, (err: any) => {
          if (err) reject(err)
          else resolve()
        })
      })

      const file = (req as any).file
      if (!file) {
        sendJson(res, 400, errorResponse('No file provided'))
        return
      }

      const uploadedFile = await uploadFile(
        file.buffer,
        file.originalname,
        {
          contentType: file.mimetype,
          folder: folder || undefined,
        }
      )

      sendJson(res, 201, successResponse(uploadedFile))
      return
    } catch (error) {
      console.error('[API /media] Error uploading file:', error)
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
      return
    }
  }

  // DELETE - Delete file
  if (method === 'DELETE') {
    try {
      if (!id) {
        sendJson(res, 400, errorResponse('File ID is required'))
        return
      }

      const result = await deleteFile(id)
      
      if (!result) {
        sendJson(res, 404, errorResponse('File not found or could not be deleted'))
        return
      }

      sendJson(res, 200, successResponse({ message: 'File deleted successfully' }))
      return
    } catch (error) {
      console.error('[API /media] Error deleting file:', error)
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
      return
    }
  }

  sendJson(res, 405, errorResponse('Method not allowed'))
}
