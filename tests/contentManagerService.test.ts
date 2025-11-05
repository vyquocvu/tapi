import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count,
  type ContentEntry,
  type FindOptions,
  type CreateOptions,
  type UpdateOptions,
} from '../src/services/contentManagerService'
import prisma from '../src/db/prisma'

// Mock dependencies
vi.mock('../src/db/prisma', () => ({
  default: {
    article: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../src/services/contentTypeService', () => ({
  getContentType: vi.fn((uid) => {
    if (uid === 'api::article.article') {
      return Promise.resolve({
        uid: 'api::article.article',
        singularName: 'article',
        pluralName: 'articles',
        fields: {
          title: { type: 'string', required: true },
          content: { type: 'text', required: false },
          published: { type: 'boolean', required: false },
        },
      })
    }
    return Promise.resolve(null)
  }),
}))

describe('contentManagerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockArticle: ContentEntry = {
    id: 1,
    title: 'Test Article',
    content: 'Test content',
    published: true,
  }

  describe('findMany', () => {
    it('should find multiple entries', async () => {
      vi.mocked(prisma.article.findMany).mockResolvedValue([mockArticle])

      const result = await findMany('api::article.article')

      expect(result).toEqual([mockArticle])
      expect(prisma.article.findMany).toHaveBeenCalled()
    })

    it('should apply query options', async () => {
      const options: FindOptions = {
        where: { published: true },
        skip: 0,
        take: 10,
        orderBy: { title: 'asc' },
      }

      vi.mocked(prisma.article.findMany).mockResolvedValue([mockArticle])

      await findMany('api::article.article', options)

      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: options.where,
        select: undefined,
        include: undefined,
        orderBy: options.orderBy,
        skip: options.skip,
        take: options.take,
      })
    })

    it('should throw error for invalid content type', async () => {
      await expect(findMany('api::invalid.invalid')).rejects.toThrow(
        "Content type 'api::invalid.invalid' not found"
      )
    })
  })

  describe('findOne', () => {
    it('should find single entry by id', async () => {
      vi.mocked(prisma.article.findUnique).mockResolvedValue(mockArticle)

      const result = await findOne('api::article.article', 1)

      expect(result).toEqual(mockArticle)
      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: undefined,
        include: undefined,
      })
    })

    it('should return null when entry not found', async () => {
      vi.mocked(prisma.article.findUnique).mockResolvedValue(null)

      const result = await findOne('api::article.article', 999)

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create new entry', async () => {
      const options: CreateOptions = {
        data: {
          title: 'New Article',
          content: 'New content',
        },
      }

      vi.mocked(prisma.article.create).mockResolvedValue({
        ...mockArticle,
        ...options.data,
      })

      const result = await create('api::article.article', options)

      expect(result.title).toBe(options.data.title)
      expect(prisma.article.create).toHaveBeenCalledWith({
        data: options.data,
        include: undefined,
      })
    })

    it('should validate required fields', async () => {
      const options: CreateOptions = {
        data: {
          content: 'Content without title',
        },
      }

      await expect(create('api::article.article', options)).rejects.toThrow(
        "Required field 'title' is missing"
      )
    })

    it('should validate field types', async () => {
      const options: CreateOptions = {
        data: {
          title: 123, // Should be string
        },
      }

      await expect(create('api::article.article', options)).rejects.toThrow(
        "Field 'title' must be a string"
      )
    })
  })

  describe('update', () => {
    it('should update existing entry', async () => {
      const options: UpdateOptions = {
        where: { id: 1 },
        data: {
          title: 'Updated Title',
        },
      }

      vi.mocked(prisma.article.update).mockResolvedValue({
        ...mockArticle,
        ...options.data,
      })

      const result = await update('api::article.article', options)

      expect(result.title).toBe(options.data.title)
      expect(prisma.article.update).toHaveBeenCalledWith({
        where: options.where,
        data: options.data,
        include: undefined,
      })
    })

    it('should update entry without type validation for non-required fields', async () => {
      const options: UpdateOptions = {
        where: { id: 1 },
        data: {
          content: 'Updated content',
        },
      }

      vi.mocked(prisma.article.update).mockResolvedValue({
        ...mockArticle,
        content: 'Updated content',
      })

      const result = await update('api::article.article', options)

      expect(result.content).toBe('Updated content')
    })
  })

  describe('deleteOne', () => {
    it('should delete entry', async () => {
      vi.mocked(prisma.article.delete).mockResolvedValue(mockArticle)

      const result = await deleteOne('api::article.article', { where: { id: 1 } })

      expect(result).toBe(true)
      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should handle delete errors', async () => {
      vi.mocked(prisma.article.delete).mockRejectedValue(new Error('Not found'))

      await expect(
        deleteOne('api::article.article', { where: { id: 999 } })
      ).rejects.toThrow('Failed to delete')
    })
  })

  describe('count', () => {
    it('should count entries', async () => {
      vi.mocked(prisma.article.count).mockResolvedValue(5)

      const result = await count('api::article.article')

      expect(result).toBe(5)
      expect(prisma.article.count).toHaveBeenCalledWith({
        where: undefined,
      })
    })

    it('should count with where clause', async () => {
      vi.mocked(prisma.article.count).mockResolvedValue(3)

      const result = await count('api::article.article', { published: true })

      expect(result).toBe(3)
      expect(prisma.article.count).toHaveBeenCalledWith({
        where: { published: true },
      })
    })
  })
})
