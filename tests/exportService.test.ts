import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  exportContentEntries,
  getExportMimeType,
  generateExportFilename,
  type ExportFormat,
} from '../src/services/exportService'
import * as contentManagerService from '../src/services/contentManagerService'
import * as contentTypeService from '../src/services/contentTypeService'

// Mock dependencies
vi.mock('../src/services/contentManagerService', () => ({
  findMany: vi.fn(),
}))

vi.mock('../src/services/contentTypeService', () => ({
  getContentType: vi.fn(),
}))

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getExportMimeType', () => {
    it('should return correct MIME type for CSV', () => {
      expect(getExportMimeType('csv')).toBe('text/csv')
    })

    it('should return correct MIME type for XLSX', () => {
      expect(getExportMimeType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should throw error for unsupported format', () => {
      expect(() => getExportMimeType('pdf' as ExportFormat)).toThrow('Unsupported export format')
    })
  })

  describe('generateExportFilename', () => {
    it('should generate filename with timestamp and format', () => {
      const filename = generateExportFilename('api::article.article', 'csv')
      expect(filename).toMatch(/^api::article\.article_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    })

    it('should generate filename for XLSX format', () => {
      const filename = generateExportFilename('api::post.post', 'xlsx')
      expect(filename).toMatch(/^api::post\.post_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })
  })

  describe('exportContentEntries', () => {
    const mockContentType = {
      uid: 'api::article.article',
      singularName: 'article',
      pluralName: 'articles',
      displayName: 'Article',
      fields: {
        title: { type: 'string', required: true },
        content: { type: 'text', required: false },
        published: { type: 'boolean', required: false },
      },
    }

    const mockEntries = [
      { id: 1, title: 'First Article', content: 'Content 1', published: true },
      { id: 2, title: 'Second Article', content: 'Content 2', published: false },
    ]

    beforeEach(() => {
      vi.mocked(contentTypeService.getContentType).mockResolvedValue(mockContentType as any)
      vi.mocked(contentManagerService.findMany).mockResolvedValue(mockEntries)
    })

    it('should export entries to CSV format', async () => {
      const buffer = await exportContentEntries({
        contentType: 'api::article.article',
        format: 'csv',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      
      // Verify content type was fetched
      expect(contentTypeService.getContentType).toHaveBeenCalledWith('api::article.article')
      
      // Verify entries were fetched
      expect(contentManagerService.findMany).toHaveBeenCalledWith('api::article.article', {
        where: undefined,
      })
    })

    it('should export entries to XLSX format', async () => {
      const buffer = await exportContentEntries({
        contentType: 'api::article.article',
        format: 'xlsx',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should export only specified IDs', async () => {
      const ids = [1, 2]
      await exportContentEntries({
        contentType: 'api::article.article',
        format: 'csv',
        ids,
      })

      expect(contentManagerService.findMany).toHaveBeenCalledWith('api::article.article', {
        where: { id: { in: ids } },
      })
    })

    it('should throw error when content type not found', async () => {
      vi.mocked(contentTypeService.getContentType).mockResolvedValue(null)

      await expect(
        exportContentEntries({
          contentType: 'invalid-type',
          format: 'csv',
        })
      ).rejects.toThrow('Content type invalid-type not found')
    })

    it('should throw error when no entries found', async () => {
      vi.mocked(contentManagerService.findMany).mockResolvedValue([])

      await expect(
        exportContentEntries({
          contentType: 'api::article.article',
          format: 'csv',
        })
      ).rejects.toThrow('No entries found to export')
    })

    it('should handle different value types correctly', async () => {
      const mixedEntries = [
        {
          id: 1,
          title: 'Test',
          published: true,
          date: new Date('2024-01-01'),
          metadata: { key: 'value' },
          nullField: null,
          undefinedField: undefined,
        },
      ]
      vi.mocked(contentManagerService.findMany).mockResolvedValue(mixedEntries)

      const buffer = await exportContentEntries({
        contentType: 'api::article.article',
        format: 'csv',
      })

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)

      // Convert buffer to string to check content
      const content = buffer.toString()
      expect(content).toContain('Test') // string value
      expect(content).toContain('Yes') // boolean true converted
      expect(content).toContain('2024-01-01') // date converted to ISO string
    })

    it('should handle where clause in options', async () => {
      const where = { published: true }
      await exportContentEntries({
        contentType: 'api::article.article',
        format: 'csv',
        where,
      })

      expect(contentManagerService.findMany).toHaveBeenCalledWith('api::article.article', {
        where,
      })
    })

    it('should combine where clause with IDs filter', async () => {
      const where = { published: true }
      const ids = [1, 2]
      await exportContentEntries({
        contentType: 'api::article.article',
        format: 'csv',
        ids,
        where,
      })

      expect(contentManagerService.findMany).toHaveBeenCalledWith('api::article.article', {
        where: { ...where, id: { in: ids } },
      })
    })
  })
})
