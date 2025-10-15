import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from '../src/server/auth.js'
import { 
  getAPIEndpoints, 
  getAPIStatistics, 
  getRecentActivityLogs,
  getEndpointDocumentation 
} from '../src/services/apiAnalyticsService.js'
import {
  getAllEndpointConfigs,
  getEndpointConfig,
  updateEndpointConfig,
  generateAPIDocumentation,
  generateOpenAPISpec
} from '../src/services/apiEndpointConfigService.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
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
    // GET dashboard data
    if (req.method === 'GET') {
      const { action, contentType } = req.query

      // Get all API endpoints
      if (action === 'endpoints') {
        const endpoints = getAPIEndpoints()
        return res.status(200).json({
          success: true,
          data: endpoints,
        })
      }

      // Get API statistics
      if (action === 'statistics') {
        const stats = getAPIStatistics()
        return res.status(200).json({
          success: true,
          data: stats,
        })
      }

      // Get activity logs
      if (action === 'activity') {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
        const logs = getRecentActivityLogs(limit)
        return res.status(200).json({
          success: true,
          data: logs,
        })
      }

      // Get endpoint documentation
      if (action === 'documentation') {
        const docs = getEndpointDocumentation()
        return res.status(200).json({
          success: true,
          data: docs,
        })
      }

      // Get endpoint configurations for content types
      if (action === 'configs') {
        const configs = await getAllEndpointConfigs()
        return res.status(200).json({
          success: true,
          data: configs,
        })
      }

      // Get specific content type endpoint config
      if (action === 'config' && contentType && typeof contentType === 'string') {
        const config = await getEndpointConfig(contentType)
        if (!config) {
          return res.status(404).json({
            success: false,
            error: 'Content type not found',
          })
        }
        return res.status(200).json({
          success: true,
          data: config,
        })
      }

      // Generate API documentation for content type
      if (action === 'generate-docs' && contentType && typeof contentType === 'string') {
        const docs = await generateAPIDocumentation(contentType)
        return res.status(200).json({
          success: true,
          data: { markdown: docs },
        })
      }

      // Generate OpenAPI spec for content type
      if (action === 'openapi' && contentType && typeof contentType === 'string') {
        const spec = await generateOpenAPISpec(contentType)
        return res.status(200).json({
          success: true,
          data: spec,
        })
      }

      // Default: return overview data
      const stats = getAPIStatistics()
      const recentActivity = getRecentActivityLogs(5)
      const endpoints = getAPIEndpoints()

      return res.status(200).json({
        success: true,
        data: {
          statistics: stats,
          recentActivity,
          endpoints,
        },
      })
    }

    // PUT - Update endpoint configuration
    if (req.method === 'PUT') {
      const { contentType } = req.query

      if (!contentType || typeof contentType !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Content type parameter is required',
        })
      }

      const config = req.body

      if (!config || typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Request body must be an object',
        })
      }

      const updated = await updateEndpointConfig(contentType, config)

      return res.status(200).json({
        success: true,
        data: updated,
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('[API /api-dashboard] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
