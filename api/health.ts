import { createGetHandler } from './_lib/handler.js'
import { HTTP_STATUS } from './_lib/response.js'

export default createGetHandler(async ({ res }) => {
  console.log('[API /health] Health check requested')

  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
  })
}, { requireAuth: false, logging: false })
