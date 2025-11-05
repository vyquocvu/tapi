import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAllPermissions,
  getPermissionById,
  getPermissionByName,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByResource,
  type Permission,
  type CreatePermissionInput,
} from '../src/services/permissionService'
import prisma from '../src/db/prisma'

// Mock Prisma
vi.mock('../src/db/prisma', () => ({
  default: {
    permission: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('permissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPermission: Permission = {
    id: 1,
    name: 'post:read',
    resource: 'post',
    action: 'read',
    description: 'Read posts',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('getAllPermissions', () => {
    it('should return all permissions ordered by resource and action', async () => {
      const mockPermissions = [mockPermission]
      vi.mocked(prisma.permission.findMany).mockResolvedValue(mockPermissions)

      const result = await getAllPermissions()

      expect(result).toEqual(mockPermissions)
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      })
    })
  })

  describe('getPermissionById', () => {
    it('should return permission when found', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)

      const result = await getPermissionById(1)

      expect(result).toEqual(mockPermission)
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should return null when permission not found', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(null)

      const result = await getPermissionById(999)

      expect(result).toBeNull()
    })
  })

  describe('getPermissionByName', () => {
    it('should return permission when found by name', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)

      const result = await getPermissionByName('post:read')

      expect(result).toEqual(mockPermission)
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: 'post:read' },
      })
    })

    it('should return null when permission not found', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(null)

      const result = await getPermissionByName('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const input: CreatePermissionInput = {
        name: 'post:write',
        resource: 'post',
        action: 'write',
        description: 'Write posts',
      }

      vi.mocked(prisma.permission.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.permission.create).mockResolvedValue({
        ...mockPermission,
        ...input,
      })

      const result = await createPermission(input)

      expect(result.name).toBe(input.name)
      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: input,
      })
    })

    it('should throw error when permission already exists', async () => {
      const input: CreatePermissionInput = {
        name: 'post:read',
        resource: 'post',
        action: 'read',
      }

      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)

      await expect(createPermission(input)).rejects.toThrow(
        "Permission 'post:read' already exists"
      )
      expect(prisma.permission.create).not.toHaveBeenCalled()
    })
  })

  describe('updatePermission', () => {
    it('should update a permission', async () => {
      const input = { description: 'Updated description' }
      const updatedPermission = { ...mockPermission, ...input }

      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)
      vi.mocked(prisma.permission.update).mockResolvedValue(updatedPermission)

      const result = await updatePermission(1, input)

      expect(result.description).toBe(input.description)
      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
      })
    })

    it('should throw error when permission not found', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(null)

      await expect(updatePermission(999, { description: 'New' })).rejects.toThrow(
        'Permission with ID 999 not found'
      )
    })

    it('should throw error when updating to existing name', async () => {
      const existingPermission = { ...mockPermission, id: 2, name: 'post:write' }
      
      vi.mocked(prisma.permission.findUnique)
        .mockResolvedValueOnce(mockPermission)
        .mockResolvedValueOnce(existingPermission)

      await expect(updatePermission(1, { name: 'post:write' })).rejects.toThrow(
        "Permission 'post:write' already exists"
      )
    })
  })

  describe('deletePermission', () => {
    it('should delete a permission', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)
      vi.mocked(prisma.permission.delete).mockResolvedValue(mockPermission)

      await deletePermission(1)

      expect(prisma.permission.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should throw error when permission not found', async () => {
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(null)

      await expect(deletePermission(999)).rejects.toThrow(
        'Permission with ID 999 not found'
      )
    })
  })

  describe('getPermissionsByResource', () => {
    it('should return permissions for a specific resource', async () => {
      const mockPermissions = [mockPermission]
      vi.mocked(prisma.permission.findMany).mockResolvedValue(mockPermissions)

      const result = await getPermissionsByResource('post')

      expect(result).toEqual(mockPermissions)
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { resource: 'post' },
        orderBy: { action: 'asc' },
      })
    })
  })
})
