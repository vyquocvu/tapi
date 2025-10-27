import busboy from 'busboy'
import { createAuthHandler, type HandlerContext } from './_lib/handler.js'
import {
  successResponse,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
  HTTP_STATUS,
} from './_lib/response.js'
import { createRouter } from './_lib/router.js'
import { 
  uploadFile, 
  deleteFile, 
  listFiles, 
  getProviderInfo 
} from '../src/services/mediaService.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'

/**
 * Parse multipart form data to extract file buffer and metadata
 */
async function parseMultipartFormData(req: any): Promise<{
  filename?: string
  buffer?: Buffer
  contentType?: string
}> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers as any })
    let foundFilename: string | undefined
    let foundBuffer: Buffer | undefined
    let foundContentType: string | undefined
    const chunks: Buffer[] = []

    bb.on('file', (fieldname, file, info) => {
      foundFilename = info.filename
      foundContentType = info.mimeType
      
      file.on('data', (data: Buffer) => {
        chunks.push(data)
      })
      
      file.on('end', () => {
        foundBuffer = Buffer.concat(chunks)
      })
    })

    bb.on('finish', () => {
      resolve({ 
        filename: foundFilename, 
        buffer: foundBuffer,
        contentType: foundContentType 
      })
    })

    bb.on('error', (err) => {
      reject(err)
    })

    // @ts-ignore - req is a Node.js IncomingMessage
    req.pipe(bb)
  })
}

const router = createRouter()

// GET - List files or get provider info
router.get(async ({ req, res, user, params }) => {
    // Check permission
    const permissionCheck = await checkPermission(
      user!.userId,
      'media:read',
      {
        resource: 'media',
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

    const { action, folder } = params

    if (action === 'provider-info') {
      const info = getProviderInfo()
      res.status(HTTP_STATUS.OK).json(successResponse(info))
      return
    }

    const files = await listFiles(folder as string)
    res.status(HTTP_STATUS.OK).json(successResponse(files))
})

// POST - Upload file
router.post(async ({ req, res, user, params }) => {
    // Check permission
    const permissionCheck = await checkPermission(
      user!.userId,
      'media:create',
      {
        resource: 'media',
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

    const provider = getProviderInfo()

    if (provider.name === 'vercel-blob') {
      // Extract filename and file data from FormData
      let filename: string | undefined
      let fileBuffer: Buffer | undefined
      let contentType: string | undefined
      
      const reqContentType = req.headers['content-type'] || ''
      if (reqContentType.includes('multipart/form-data')) {
        try {
          const result = await parseMultipartFormData(req)
          filename = result.filename
          fileBuffer = result.buffer
          contentType = result.contentType
        } catch (parseError) {
          console.error('[API /media] Error parsing FormData:', parseError)
          res.status(HTTP_STATUS.BAD_REQUEST).json(
            badRequestResponse('Failed to parse upload data')
          )
          return
        }
      }
      
      // Check query param as fallback
      if (!filename) {
        filename = params.filename as string | undefined
      }
      
      if (!filename || typeof filename !== 'string') {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('filename is required')
        )
        return
      }
      
      if (!fileBuffer) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          badRequestResponse('No file data provided')
        )
        return
      }

      try {
        // Upload the file using mediaService
        const uploadedFile = await uploadFile(fileBuffer, filename, {
          contentType: contentType,
        })
        
        res.status(HTTP_STATUS.CREATED).json(successResponse(uploadedFile))
        return
      } catch (err) {
        console.error('[API /media] Vercel upload failed', err)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
          badRequestResponse('Failed to upload file')
        )
        return
      }
    }

    // Fallback: server-side upload not supported
    res.status(501).json({
      success: false,
      error: 'Server-side file upload not supported on Vercel. Use direct upload via the provided upload URL.',
    })
})

// DELETE - Delete file
router.delete(async ({ req, res, user, params }) => {
    // Check permission
    const permissionCheck = await checkPermission(
      user!.userId,
      'media:delete',
      {
        resource: 'media',
        action: 'delete',
        resourceId: params.id ? parseInt(params.id as string, 10) : undefined,
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

    const { id } = params

    if (!id || typeof id !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        badRequestResponse('File ID is required')
      )
      return
    }

    const result = await deleteFile(id)
    
    if (!result) {
      res.status(HTTP_STATUS.NOT_FOUND).json(
        notFoundResponse('File')
      )
      return
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse({ message: 'File deleted successfully' })
    )
})

export default createAuthHandler(async (context) => {
  await router.handle(context)
}, { methods: ['GET', 'POST', 'DELETE'] })
