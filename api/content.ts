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
    const { contentType, id } = req.query

    // Validate contentType parameter
    if (!contentType || typeof contentType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content type parameter is required',
      })
    }

    // GET - Find entries or a specific entry
    if (req.method === 'GET') {
      // Get specific entry by ID
      if (id && typeof id === 'string') {
        const entryId = parseInt(id, 10)
        if (isNaN(entryId)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid ID parameter',
          })
        }

        const entry = await findOne(contentType, entryId)
        if (!entry) {
          return res.status(404).json({
            success: false,
            error: 'Entry not found',
          })
        }

        return res.status(200).json({
          success: true,
          data: entry,
        })
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

      return res.status(200).json({
        success: true,
        data: entries,
        ...(total !== undefined && { meta: { total } }),
      })
    }

    // POST - Create new entry
    if (req.method === 'POST') {
      const data = req.body

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Request body must be an object',
        })
      }

      const entry = await create(contentType, { data })

      return res.status(201).json({
        success: true,
        data: entry,
      })
    }

    // PUT - Update existing entry
    if (req.method === 'PUT') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'ID parameter is required for updates',
        })
      }

      const entryId = parseInt(id, 10)
      if (isNaN(entryId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID parameter',
        })
      }

      const data = req.body

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Request body must be an object',
        })
      }

      const entry = await update(contentType, {
        where: { id: entryId },
        data,
      })

      return res.status(200).json({
        success: true,
        data: entry,
      })
    }

    // DELETE - Delete entry
    if (req.method === 'DELETE') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'ID parameter is required for deletion',
        })
      }

      const entryId = parseInt(id, 10)
      if (isNaN(entryId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID parameter',
        })
      }

      await deleteOne(contentType, {
        where: { id: entryId },
      })

      return res.status(200).json({
        success: true,
        message: 'Entry deleted successfully',
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('[API /content] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
