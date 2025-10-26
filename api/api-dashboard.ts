import { createAuthHandler } from './_lib/handler.js'
import { createRouter } from './_lib/router.js'
import { successResponse, badRequestResponse, notFoundResponse, HTTP_STATUS } from './_lib/response.js'
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

const router = createRouter()

// GET - Dashboard data and endpoint information
router.get(async ({ res, params }) => {
  const { action, contentType } = params

  // Get all API endpoints
  if (action === 'endpoints') {
    const endpoints = getAPIEndpoints()
    res.status(HTTP_STATUS.OK).json(successResponse(endpoints))
    return
  }

  // Get API statistics
  if (action === 'statistics') {
    const stats = getAPIStatistics()
    res.status(HTTP_STATUS.OK).json(successResponse(stats))
    return
  }

  // Get activity logs
  if (action === 'activity') {
    const limit = params.limit ? parseInt(params.limit as string, 10) : 10
    const logs = getRecentActivityLogs(limit)
    res.status(HTTP_STATUS.OK).json(successResponse(logs))
    return
  }

  // Get endpoint documentation
  if (action === 'documentation') {
    const docs = getEndpointDocumentation()
    res.status(HTTP_STATUS.OK).json(successResponse(docs))
    return
  }

  // Get endpoint configurations for content types
  if (action === 'configs') {
    const configs = await getAllEndpointConfigs()
    res.status(HTTP_STATUS.OK).json(successResponse(configs))
    return
  }

  // Get specific content type endpoint config
  if (action === 'config' && contentType && typeof contentType === 'string') {
    const config = await getEndpointConfig(contentType)
    if (!config) {
      res.status(HTTP_STATUS.NOT_FOUND).json(notFoundResponse('Content type'))
      return
    }
    res.status(HTTP_STATUS.OK).json(successResponse(config))
    return
  }

  // Generate API documentation for content type
  if (action === 'generate-docs' && contentType && typeof contentType === 'string') {
    const docs = await generateAPIDocumentation(contentType)
    res.status(HTTP_STATUS.OK).json(successResponse({ markdown: docs }))
    return
  }

  // Generate OpenAPI spec for content type
  if (action === 'openapi' && contentType && typeof contentType === 'string') {
    const spec = await generateOpenAPISpec(contentType)
    res.status(HTTP_STATUS.OK).json(successResponse(spec))
    return
  }

  // Default: return overview data
  const stats = getAPIStatistics()
  const recentActivity = getRecentActivityLogs(5)
  const endpoints = getAPIEndpoints()

  res.status(HTTP_STATUS.OK).json(successResponse({
    statistics: stats,
    recentActivity,
    endpoints,
  }))
})

// PUT - Update endpoint configuration
router.put(async ({ req, res, params }) => {
  const { contentType } = params

  if (!contentType || typeof contentType !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Content type parameter is required')
    )
    return
  }

  const config = req.body

  if (!config || typeof config !== 'object') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Request body must be an object')
    )
    return
  }

  const updated = await updateEndpointConfig(contentType, config)
  res.status(HTTP_STATUS.OK).json(successResponse(updated))
})

export default createAuthHandler(async (context) => {
  await router.handle(context)
}, { methods: ['GET', 'PUT'] })
