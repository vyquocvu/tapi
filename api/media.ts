import type { VercelRequest, VercelResponse } from '@vercel/node'
import { 
  uploadFile, 
  deleteFile, 
  listFiles, 
  getFileMetadata,
  getProviderInfo 
} from '../src/services/mediaService.js'

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

    // POST - Upload file
    if (req.method === 'POST') {
      // Note: In Vercel serverless, we'd need to handle multipart/form-data differently
      // This is a simplified version - see Vite middleware for full implementation
      return res.status(501).json({
        success: false,
        error: 'File upload in Vercel requires different handling. Use Vite dev server or Node server.',
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
