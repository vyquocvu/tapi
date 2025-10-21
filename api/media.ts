import type { VercelRequest, VercelResponse } from '@vercel/node'
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
        const { filename } = req.query
        if (!filename || typeof filename !== 'string') {
          return res.status(400).json({ success: false, error: 'filename query param is required' })
        }

        try {
          // Return token directly for @vercel/blob/client compatibility
          const token = process.env.BLOB_READ_WRITE_TOKEN
          if (!token) {
            return res.status(500).json({ success: false, error: 'BLOB_READ_WRITE_TOKEN not configured' })
          }

          // Return in the format expected by @vercel/blob/client
          return res.status(200).json({
            url: `https://blob.vercel-storage.com/${filename}`,
            token,
          })
        } catch (err) {
          console.error('[API /media] Vercel upload token generation failed', err)
          return res.status(500).json({ success: false, error: 'Failed to generate upload token' })
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
