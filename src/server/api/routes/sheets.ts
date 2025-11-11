import type { RouteHandler } from '../types.js'
import { parseRequestBody } from '../utils/request.js'
import { sendJson, successResponse, errorResponse } from '../utils/response.js'
import { createContext } from '../../context.js'
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count,
  CreateSheetData,
  UpdateSheetData,
} from '../../../services/sheetService.js'
import { checkPermission } from '../../../middleware/permissionEnforcement.js'

/**
 * Sheets endpoint
 * GET/POST/PUT/DELETE /api/sheets
 */
export const sheetsHandler: RouteHandler = async ({ req, res, url }) => {
  const id = url.searchParams.get('id')
  const method = req.method

  // Create context (optionally authenticated)
  const context = createContext(req)
  const user = context.user

  // GET - Find sheets or a specific sheet
  if (method === 'GET') {
    try {
      // Get specific sheet by ID
      if (id) {
        const sheetId = parseInt(id, 10)
        if (isNaN(sheetId)) {
          sendJson(res, 400, errorResponse('Invalid ID parameter'))
          return
        }

        const sheet = await findOne(sheetId)
        if (!sheet) {
          sendJson(res, 404, errorResponse('Sheet not found'))
          return
        }

        // Check access: user must be owner or sheet must be public
        if (!sheet.isPublic && (!user || sheet.ownerId !== user.userId)) {
          sendJson(res, 403, errorResponse('You do not have access to this sheet'))
          return
        }

        sendJson(res, 200, successResponse(sheet))
        return
      }

      // List all sheets
      const skip = url.searchParams.get('skip')
      const take = url.searchParams.get('take')
      const orderBy = url.searchParams.get('orderBy')
      const ownerId = url.searchParams.get('ownerId')
      const includeCount = url.searchParams.get('count') === 'true'

      // Build where clause based on user and filters
      const where: any = {}

      if (user) {
        // Check permission
        const permissionCheck = await checkPermission(
          user.userId,
          'sheets:read',
          {
            resource: 'sheets',
            action: 'read',
            ipAddress: req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'] as string,
          }
        )

        if (!permissionCheck.allowed) {
          // If no permission, only show public sheets
          where.isPublic = true
        } else {
          // Has permission, show owned sheets plus public sheets
          if (ownerId === 'me') {
            where.ownerId = user.userId
          } else {
            // Show all accessible sheets (owned or public)
            where.OR = [
              { ownerId: user.userId },
              { isPublic: true }
            ]
          }
        }
      } else {
        // Not authenticated, only public sheets
        where.isPublic = true
      }

      const sheets = await findMany({
        where,
        orderBy: orderBy ? JSON.parse(orderBy) : { createdAt: 'desc' },
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
      })

      // Get total count if requested
      let total: number | undefined
      if (includeCount) {
        total = await count(where)
      }

      const response = total !== undefined ? { data: sheets, total } : sheets
      sendJson(res, 200, successResponse(response))
    } catch (error: any) {
      console.error('[Sheets] Error:', error)
      sendJson(res, 500, errorResponse(error.message || 'Internal server error'))
    }
    return
  }

  // POST - Create new sheet
  if (method === 'POST') {
    if (!user) {
      sendJson(res, 401, errorResponse('Authentication required'))
      return
    }

    // Check permission
    const permissionCheck = await checkPermission(
      user.userId,
      'sheets:create',
      {
        resource: 'sheets',
        action: 'create',
        ipAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
      }
    )

    if (!permissionCheck.allowed) {
      sendJson(res, 403, errorResponse(permissionCheck.error || 'Insufficient permissions'))
      return
    }

    try {
      const body = await parseRequestBody(req)

      if (!body || typeof body !== 'object') {
        sendJson(res, 400, errorResponse('Request body must be an object'))
        return
      }

      // Validate required fields
      if (!body.title || typeof body.title !== 'string') {
        sendJson(res, 400, errorResponse('Title is required and must be a string'))
        return
      }

      if (!body.columns || !Array.isArray(body.columns)) {
        sendJson(res, 400, errorResponse('Columns are required and must be an array'))
        return
      }

      const createData: CreateSheetData = {
        title: body.title,
        description: body.description,
        columns: body.columns,
        rows: body.rows || [],
        ownerId: user.userId,
        isPublic: body.isPublic || false,
      }

      const sheet = await create(createData)
      sendJson(res, 201, successResponse(sheet))
    } catch (error: any) {
      console.error('[Sheets] Create error:', error)
      sendJson(res, 400, errorResponse(error.message || 'Failed to create sheet'))
    }
    return
  }

  // PUT - Update existing sheet
  if (method === 'PUT') {
    if (!user) {
      sendJson(res, 401, errorResponse('Authentication required'))
      return
    }

    if (!id) {
      sendJson(res, 400, errorResponse('ID parameter is required for updates'))
      return
    }

    const sheetId = parseInt(id, 10)
    if (isNaN(sheetId)) {
      sendJson(res, 400, errorResponse('Invalid ID parameter'))
      return
    }

    try {
      // Check if sheet exists and user has access
      const existingSheet = await findOne(sheetId)
      if (!existingSheet) {
        sendJson(res, 404, errorResponse('Sheet not found'))
        return
      }

      // Only owner can update
      if (existingSheet.ownerId !== user.userId) {
        sendJson(res, 403, errorResponse('You do not have permission to update this sheet'))
        return
      }

      // Check permission
      const permissionCheck = await checkPermission(
        user.userId,
        'sheets:update',
        {
          resource: 'sheets',
          action: 'update',
          resourceId: sheetId,
          ipAddress: req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'] as string,
        }
      )

      if (!permissionCheck.allowed) {
        sendJson(res, 403, errorResponse(permissionCheck.error || 'Insufficient permissions'))
        return
      }

      const body = await parseRequestBody(req)

      if (!body || typeof body !== 'object') {
        sendJson(res, 400, errorResponse('Request body must be an object'))
        return
      }

      const updateData: UpdateSheetData = {}
      if (body.title !== undefined) updateData.title = body.title
      if (body.description !== undefined) updateData.description = body.description
      if (body.columns !== undefined) updateData.columns = body.columns
      if (body.rows !== undefined) updateData.rows = body.rows
      if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

      const sheet = await update(sheetId, updateData)
      sendJson(res, 200, successResponse(sheet))
    } catch (error: any) {
      console.error('[Sheets] Update error:', error)
      sendJson(res, 400, errorResponse(error.message || 'Failed to update sheet'))
    }
    return
  }

  // DELETE - Delete sheet
  if (method === 'DELETE') {
    if (!user) {
      sendJson(res, 401, errorResponse('Authentication required'))
      return
    }

    if (!id) {
      sendJson(res, 400, errorResponse('ID parameter is required for deletion'))
      return
    }

    const sheetId = parseInt(id, 10)
    if (isNaN(sheetId)) {
      sendJson(res, 400, errorResponse('Invalid ID parameter'))
      return
    }

    try {
      // Check if sheet exists and user has access
      const existingSheet = await findOne(sheetId)
      if (!existingSheet) {
        sendJson(res, 404, errorResponse('Sheet not found'))
        return
      }

      // Only owner can delete
      if (existingSheet.ownerId !== user.userId) {
        sendJson(res, 403, errorResponse('You do not have permission to delete this sheet'))
        return
      }

      // Check permission
      const permissionCheck = await checkPermission(
        user.userId,
        'sheets:delete',
        {
          resource: 'sheets',
          action: 'delete',
          resourceId: sheetId,
          ipAddress: req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'] as string,
        }
      )

      if (!permissionCheck.allowed) {
        sendJson(res, 403, errorResponse(permissionCheck.error || 'Insufficient permissions'))
        return
      }

      await deleteOne(sheetId)
      sendJson(res, 200, successResponse({ message: 'Sheet deleted successfully' }))
    } catch (error: any) {
      console.error('[Sheets] Delete error:', error)
      sendJson(res, 400, errorResponse(error.message || 'Failed to delete sheet'))
    }
    return
  }

  // Method not allowed
  sendJson(res, 405, errorResponse('Method not allowed'))
}
