import type { VercelRequest, VercelResponse } from '@vercel/node'
import busboy from 'busboy'
import { 
  uploadFile, 
  deleteFile, 
  listFiles, 
  getFileMetadata,
  getProviderInfo 
} from '../src/services/mediaService.js'
import { generateVercelUploadUrl } from '../src/storage/providers/vercelBlob.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - List files or get provider info
    if (req.method === 'GET') {
      const { action, folder } = req.query

      if (action === 'provider-info') {
        const info = getProviderInfo()
        return res.status(200).json({
          success: true,
          data: info,
        })
      }

      const files = await listFiles(folder as string)
      return res.status(200).json({
        success: true,
        data: files,
      })
    }

    // POST - Upload file or get upload token
    if (req.method === 'POST') {
      const provider = getProviderInfo()

      if (provider.name === 'vercel-blob') {
        // Extract filename and file data from FormData
        let filename: string | undefined
        let fileBuffer: Buffer | undefined
        let contentType: string | undefined
        
        const reqContentType = req.headers['content-type'] || ''
        if (reqContentType.includes('multipart/form-data')) {
          try {
            // Parse FormData using busboy to extract file and metadata
            const result = await new Promise<{ filename?: string; buffer?: Buffer; contentType?: string }>((resolve, reject) => {
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

              // Pipe the request to busboy
              // @ts-ignore - req is a Node.js IncomingMessage
              req.pipe(bb)
            })
            
            filename = result.filename
            fileBuffer = result.buffer
            contentType = result.contentType
          } catch (parseError) {
            console.error('[API /media] Error parsing FormData:', parseError)
            return res.status(400).json({ 
              success: false, 
              error: 'Failed to parse upload data' 
            })
          }
        }
        
        // Also check query param as fallback
        if (!filename) {
          filename = req.query.filename as string | undefined
        }
        
        if (!filename || typeof filename !== 'string') {
          return res.status(400).json({ 
            success: false, 
            error: 'filename is required' 
          })
        }
        
        if (!fileBuffer) {
          return res.status(400).json({ 
            success: false, 
            error: 'No file data provided' 
          })
        }

        try {
          // Upload the file using mediaService which will use Vercel Blob provider
          const uploadedFile = await uploadFile(fileBuffer, filename, {
            contentType: contentType,
          })
          
          return res.status(201).json({
            success: true,
            data: uploadedFile,
          })
        } catch (err) {
          console.error('[API /media] Vercel upload failed', err)
          return res.status(500).json({ success: false, error: 'Failed to upload file' })
        }
      }

      // Fallback: server-side upload (not supported in Vercel serverless for multipart)
      return res.status(501).json({
        success: false,
        error: 'Server-side file upload not supported on Vercel. Use direct upload via the provided upload URL.',
      })
    }

    // DELETE - Delete file
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'File ID is required',
        })
      }

      const result = await deleteFile(id)
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'File not found or could not be deleted',
        })
      }

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('[API /media] Error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
