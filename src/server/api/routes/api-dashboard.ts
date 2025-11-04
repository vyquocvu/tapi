import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext, requireAuth } from '../../context.js'
import {
  getAPIEndpoints,
  getAPIStatistics,
  getRecentActivityLogs,
  getEndpointDocumentation
} from '../../../services/apiAnalyticsService.js'
import {
  getAllEndpointConfigs,
  getEndpointConfig,
  updateEndpointConfig,
  generateAPIDocumentation,
  generateOpenAPISpec
} from '../../../services/apiEndpointConfigService.js'

/**
 * API Dashboard endpoint
 * GET/PUT /api/api-dashboard
 */
export const apiDashboardHandler: RouteHandler = async ({ req, res, url }) => {
  // Verify authentication
  try {
    const context = createContext(req)
    requireAuth(context)
  } catch (error) {
    sendJson(res, 401, errorResponse('Unauthorized'))
    return
  }

  const method = req.method

  // GET - API Dashboard data
  if (method === 'GET') {
    try {
      const action = url.searchParams.get('action')
      const contentType = url.searchParams.get('contentType')
      const limit = url.searchParams.get('limit')

      let data: any

      if (action === 'endpoints') {
        data = getAPIEndpoints()
      } else if (action === 'statistics') {
        data = getAPIStatistics()
      } else if (action === 'activity') {
        data = getRecentActivityLogs(limit ? parseInt(limit, 10) : 10)
      } else if (action === 'documentation') {
        data = getEndpointDocumentation()
      } else if (action === 'configs') {
        data = await getAllEndpointConfigs()
      } else if (action === 'config' && contentType) {
        data = await getEndpointConfig(contentType)
        if (!data) {
          sendJson(res, 404, errorResponse('Content type not found'))
          return
        }
      } else if (action === 'generate-docs' && contentType) {
        const docs = await generateAPIDocumentation(contentType)
        data = { markdown: docs }
      } else if (action === 'openapi' && contentType) {
        data = await generateOpenAPISpec(contentType)
      } else {
        // Default: return overview
        data = {
          statistics: getAPIStatistics(),
          recentActivity: getRecentActivityLogs(5),
          endpoints: getAPIEndpoints(),
        }
      }

      sendJson(res, 200, successResponse(data))
    } catch (error) {
      console.error('[API /api-dashboard] Error:', error)
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  // PUT - Update endpoint config
  if (method === 'PUT') {
    try {
      const contentType = url.searchParams.get('contentType')

      if (!contentType) {
        sendJson(res, 400, errorResponse('Content type parameter is required'))
        return
      }

      const config = await parseRequestBody(req)
      const updated = await updateEndpointConfig(contentType, config)

      sendJson(res, 200, successResponse(updated))
    } catch (error) {
      sendJson(res, 500, errorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      ))
    }
    return
  }

  sendJson(res, 405, errorResponse('Method not allowed'))
}
