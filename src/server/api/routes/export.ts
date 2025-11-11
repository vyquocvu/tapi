/**
 * Export API Route
 * Handles exporting content entries to various formats
 */

import type { RouteHandler } from '../types.js'
import { sendJson, errorResponse } from '../utils/response.js'
import { createContext } from '../../context.js'
import { 
  exportContentEntries, 
  getExportMimeType, 
  generateExportFilename,
  type ExportFormat 
} from '../../../services/exportService.js'
import { validateContentTypeUID } from '../../../middleware/validation.js'
import { checkPermission } from '../../../middleware/permissionEnforcement.js'

export const exportHandler: RouteHandler = async ({ req, res, url }) => {
  try {
    const searchParams = url.searchParams
    const contentType = searchParams.get('contentType')
    const format = searchParams.get('format') || 'csv'
    const idsParam = searchParams.get('ids')
    
    // Validate content type
    if (!contentType) {
      sendJson(res, 400, errorResponse('Content type parameter is required'))
      return
    }

    const uidValidation = validateContentTypeUID(contentType)
    if (!uidValidation.isValid) {
      sendJson(res, 400, errorResponse(
        'Invalid content type UID',
        uidValidation.errors.map((e: any) => e.message)
      ))
      return
    }

    // Validate format
    if (format !== 'csv' && format !== 'xlsx') {
      sendJson(res, 400, errorResponse('Format must be either "csv" or "xlsx"'))
      return
    }

    // Get context (optionally authenticated)
    const context = createContext(req)
    const user = context.user

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
        sendJson(res, 403, errorResponse(permissionCheck.error || 'Permission denied'))
        return
      }
    }

    // Parse IDs if provided
    let parsedIds: number[] | undefined
    if (idsParam) {
      parsedIds = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    }

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
    res.statusCode = 200
    res.end(buffer)
  } catch (error) {
    console.error('Export error:', error)
    sendJson(res, 500, errorResponse(
      error instanceof Error ? error.message : 'Export failed'
    ))
  }
}
