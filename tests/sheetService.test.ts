import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count,
  addRow,
  updateCell,
  deleteRow,
  Sheet,
  CreateSheetData,
  UpdateSheetData,
} from '../src/services/sheetService'
import prisma from '../src/db/prisma'

// Mock dependencies
vi.mock('../src/db/prisma', () => ({
  default: {
    sheet: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('sheetService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSheet = {
    id: 1,
    title: 'Test Sheet',
    description: 'Test description',
    columns: JSON.stringify([
      { name: 'Name', type: 'text' },
      { name: 'Age', type: 'number' },
    ]),
    rows: JSON.stringify([
      ['John', 30],
      ['Jane', 25],
    ]),
    ownerId: 1,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('findMany', () => {
    it('should find multiple sheets', async () => {
      vi.mocked(prisma.sheet.findMany).mockResolvedValue([mockSheet])

      const result = await findMany()

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Sheet')
      expect(result[0].columns).toEqual([
        { name: 'Name', type: 'text' },
        { name: 'Age', type: 'number' },
      ])
      expect(prisma.sheet.findMany).toHaveBeenCalled()
    })

    it('should apply query options', async () => {
      vi.mocked(prisma.sheet.findMany).mockResolvedValue([mockSheet])

      await findMany({
        where: { isPublic: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      expect(prisma.sheet.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('should find single sheet by id', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      const result = await findOne(1)

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Test Sheet')
      expect(result?.columns).toHaveLength(2)
      expect(result?.rows).toHaveLength(2)
      expect(prisma.sheet.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should return null when sheet not found', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(null)

      const result = await findOne(999)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create new sheet', async () => {
      const createData: CreateSheetData = {
        title: 'New Sheet',
        description: 'New description',
        columns: [
          { name: 'Name', type: 'text' },
          { name: 'Age', type: 'number' },
        ],
        rows: [],
        ownerId: 1,
        isPublic: false,
      }

      vi.mocked(prisma.sheet.create).mockResolvedValue({
        ...mockSheet,
        title: createData.title,
        columns: JSON.stringify(createData.columns),
        rows: JSON.stringify([]),
      })

      const result = await create(createData)

      expect(result.title).toBe('New Sheet')
      expect(result.columns).toHaveLength(2)
      expect(prisma.sheet.create).toHaveBeenCalledWith({
        data: {
          title: createData.title,
          description: createData.description,
          columns: JSON.stringify(createData.columns),
          rows: JSON.stringify([]),
          ownerId: createData.ownerId,
          isPublic: createData.isPublic,
        },
      })
    })

    it('should require at least one column', async () => {
      const createData: CreateSheetData = {
        title: 'Invalid Sheet',
        columns: [],
      }

      await expect(create(createData)).rejects.toThrow(
        'At least one column is required'
      )
    })

    it('should require unique column names', async () => {
      const createData: CreateSheetData = {
        title: 'Invalid Sheet',
        columns: [
          { name: 'Name', type: 'text' },
          { name: 'Name', type: 'number' },
        ],
      }

      await expect(create(createData)).rejects.toThrow(
        'Column names must be unique'
      )
    })
  })

  describe('update', () => {
    it('should update existing sheet', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      const updateData: UpdateSheetData = {
        title: 'Updated Title',
      }

      vi.mocked(prisma.sheet.update).mockResolvedValue({
        ...mockSheet,
        title: 'Updated Title',
      })

      const result = await update(1, updateData)

      expect(result.title).toBe('Updated Title')
      expect(prisma.sheet.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Title' },
      })
    })

    it('should throw error when sheet not found', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(null)

      await expect(update(999, { title: 'New Title' })).rejects.toThrow(
        'Sheet with id 999 not found'
      )
    })

    it('should validate columns when provided', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      const updateData: UpdateSheetData = {
        columns: [],
      }

      await expect(update(1, updateData)).rejects.toThrow(
        'At least one column is required'
      )
    })
  })

  describe('deleteOne', () => {
    it('should delete sheet', async () => {
      vi.mocked(prisma.sheet.delete).mockResolvedValue(mockSheet)

      const result = await deleteOne(1)

      expect(result).toBe(true)
      expect(prisma.sheet.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should handle delete errors', async () => {
      vi.mocked(prisma.sheet.delete).mockRejectedValue(new Error('Not found'))

      await expect(deleteOne(999)).rejects.toThrow(
        'Failed to delete sheet with id 999'
      )
    })
  })

  describe('count', () => {
    it('should count sheets', async () => {
      vi.mocked(prisma.sheet.count).mockResolvedValue(5)

      const result = await count()

      expect(result).toBe(5)
      expect(prisma.sheet.count).toHaveBeenCalledWith({
        where: undefined,
      })
    })

    it('should count with where clause', async () => {
      vi.mocked(prisma.sheet.count).mockResolvedValue(3)

      const result = await count({ isPublic: true })

      expect(result).toBe(3)
      expect(prisma.sheet.count).toHaveBeenCalledWith({
        where: { isPublic: true },
      })
    })
  })

  describe('addRow', () => {
    it('should add row to sheet', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)
      vi.mocked(prisma.sheet.update).mockResolvedValue({
        ...mockSheet,
        rows: JSON.stringify([
          ['John', 30],
          ['Jane', 25],
          ['Bob', 35],
        ]),
      })

      const result = await addRow(1, ['Bob', 35])

      expect(result.rows).toHaveLength(3)
      expect(result.rows[2]).toEqual(['Bob', 35])
    })

    it('should validate row data length', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      await expect(addRow(1, ['Bob'])).rejects.toThrow(
        'Row data length (1) does not match number of columns (2)'
      )
    })
  })

  describe('updateCell', () => {
    it('should update specific cell', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)
      vi.mocked(prisma.sheet.update).mockResolvedValue({
        ...mockSheet,
        rows: JSON.stringify([
          ['John', 31],
          ['Jane', 25],
        ]),
      })

      const result = await updateCell(1, 0, 1, 31)

      expect(result.rows[0][1]).toBe(31)
    })

    it('should validate row index', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      await expect(updateCell(1, 10, 0, 'Invalid')).rejects.toThrow(
        'Invalid row index: 10'
      )
    })

    it('should validate column index', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      await expect(updateCell(1, 0, 10, 'Invalid')).rejects.toThrow(
        'Invalid column index: 10'
      )
    })
  })

  describe('deleteRow', () => {
    it('should delete row from sheet', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)
      vi.mocked(prisma.sheet.update).mockResolvedValue({
        ...mockSheet,
        rows: JSON.stringify([['Jane', 25]]),
      })

      const result = await deleteRow(1, 0)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toEqual(['Jane', 25])
    })

    it('should validate row index', async () => {
      vi.mocked(prisma.sheet.findUnique).mockResolvedValue(mockSheet)

      await expect(deleteRow(1, 10)).rejects.toThrow(
        'Invalid row index: 10'
      )
    })
  })
})
