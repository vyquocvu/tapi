/**
 * Export Service
 * Handles exporting data to various sheet formats (CSV, XLSX)
 */

import * as XLSX from '@e965/xlsx'
import { findMany } from './contentManagerService.js'
import { getContentType } from './contentTypeService.js'

export type ExportFormat = 'csv' | 'xlsx'

export interface ExportOptions {
  contentType: string
  format: ExportFormat
  ids?: number[]
  where?: Record<string, any>
}

/**
 * Export content entries to sheet format
 */
export async function exportContentEntries(options: ExportOptions): Promise<Buffer> {
  const { contentType, format, ids, where } = options

  // Get content type definition to understand fields
  const contentTypeDef = await getContentType(contentType)
  if (!contentTypeDef) {
    throw new Error(`Content type ${contentType} not found`)
  }

  // Build query filter
  let queryWhere = where
  if (ids && ids.length > 0) {
    queryWhere = {
      ...where,
      id: { in: ids }
    }
  }

  // Fetch entries
  const entries = await findMany(contentType, {
    where: queryWhere,
  })

  if (!entries || entries.length === 0) {
    throw new Error('No entries found to export')
  }

  // Get all unique keys from entries
  const allKeys = new Set<string>()
  entries.forEach(entry => {
    Object.keys(entry).forEach(key => allKeys.add(key))
  })

  // Convert entries to array of arrays for xlsx
  const headers = Array.from(allKeys)
  const data = entries.map(entry => 
    headers.map(header => {
      const value = entry[header]
      
      // Handle different value types for export
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      if (value instanceof Date) {
        return value.toISOString()
      }
      return String(value)
    })
  )

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  // Generate buffer based on format
  const writeOptions = { bookType: format === 'csv' ? 'csv' : 'xlsx', type: 'buffer' } as const
  const buffer = XLSX.write(workbook, writeOptions) as Buffer

  return buffer
}

/**
 * Get the appropriate MIME type for the export format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(contentType: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${contentType}_${timestamp}.${format}`
}
