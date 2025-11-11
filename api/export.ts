import { createHandler } from './_lib/handler.js'
import { createRouter } from './_lib/router.js'
import {
  successResponse,
  badRequestResponse,
  validationErrorResponse,
  forbiddenResponse,
  HTTP_STATUS,
} from './_lib/response.js'
import { 
  exportContentEntries, 
  getExportMimeType, 
  generateExportFilename,
  type ExportFormat 
} from '../src/services/exportService.js'
import { validateContentTypeUID } from '../src/middleware/validation.js'
import { checkPermission } from '../src/middleware/permissionEnforcement.js'

const router = createRouter()

// GET - Export entries
router.get(async ({ req, res, user, params }) => {
  const { contentType, format = 'csv', ids } = params

  // Validate content type
  if (!contentType || typeof contentType !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Content type parameter is required')
    )
    return
  }

  const uidValidation = validateContentTypeUID(contentType)
  if (!uidValidation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      validationErrorResponse(uidValidation.errors.map(e => e.message))
    )
    return
  }

  // Validate format
  if (format !== 'csv' && format !== 'xlsx') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      badRequestResponse('Format must be either "csv" or "xlsx"')
    )
    return
  }

  // Check permission if user is authenticated
  if (user) {
    const permissionCheck = await checkPermission(
      user.userId,
      'content:read',
      {
        resource: 'content',
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
  }

  // Parse IDs if provided
  let parsedIds: number[] | undefined
  if (ids) {
    if (typeof ids === 'string') {
      parsedIds = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    } else if (Array.isArray(ids)) {
      parsedIds = ids.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id))
    }
  }

  try {
    // Export entries
    const buffer = await exportContentEntries({
      contentType,
      format: format as ExportFormat,
      ids: parsedIds,
    })

    // Generate filename
    const filename = generateExportFilename(contentType, format as ExportFormat)

    // Set headers and send file
    res.setHeader('Content-Type', getExportMimeType(format as ExportFormat))
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    res.status(HTTP_STATUS.OK).send(buffer)
  } catch (error) {
    console.error('Export error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      badRequestResponse(error instanceof Error ? error.message : 'Export failed')
    )
  }
})

export default createHandler(async (context) => {
  await router.handle(context)
}, { optionalAuth: true })
