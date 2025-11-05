import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  setRolePermissions,
  type Role,
  type CreateRoleInput,
} from '../src/services/roleService'
import prisma from '../src/db/prisma'

// Mock Prisma
vi.mock('../src/db/prisma', () => ({
  default: {
    role: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    permission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    rolePermission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}))

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockRole: Role = {
    id: 1,
    name: 'Admin',
    description: 'Administrator role',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockPermission = {
    id: 1,
    name: 'post:read',
    resource: 'post',
    action: 'read',
    description: 'Read posts',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('getAllRoles', () => {
    it('should return all roles ordered by name', async () => {
      const mockRoles = [mockRole]
      vi.mocked(prisma.role.findMany).mockResolvedValue(mockRoles)

      const result = await getAllRoles()

      expect(result).toEqual(mockRoles)
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)

      const result = await getRoleById(1)

      expect(result).toEqual(mockRole)
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should return null when role not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      const result = await getRoleById(999)

      expect(result).toBeNull()
    })
  })

  describe('getRoleByName', () => {
    it('should return role when found by name', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)

      const result = await getRoleByName('Admin')

      expect(result).toEqual(mockRole)
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'Admin' },
      })
    })
  })

  describe('createRole', () => {
    it('should create a new role', async () => {
      const input: CreateRoleInput = {
        name: 'Editor',
        description: 'Editor role',
      }

      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.role.create).mockResolvedValue({
        ...mockRole,
        ...input,
      })

      const result = await createRole(input)

      expect(result.name).toBe(input.name)
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: input,
      })
    })

    it('should throw error when role already exists', async () => {
      const input: CreateRoleInput = {
        name: 'Admin',
      }

      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)

      await expect(createRole(input)).rejects.toThrow(
        "Role 'Admin' already exists"
      )
    })
  })

  describe('updateRole', () => {
    it('should update a role', async () => {
      const input = { description: 'Updated description' }
      const updatedRole = { ...mockRole, ...input }

      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.role.update).mockResolvedValue(updatedRole)

      const result = await updateRole(1, input)

      expect(result.description).toBe(input.description)
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
      })
    })

    it('should throw error when role not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      await expect(updateRole(999, { description: 'New' })).rejects.toThrow(
        'Role with ID 999 not found'
      )
    })
  })

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.role.delete).mockResolvedValue(mockRole)

      await deleteRole(1)

      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should throw error when role not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      await expect(deleteRole(999)).rejects.toThrow(
        'Role with ID 999 not found'
      )
    })
  })

  describe('assignPermissionToRole', () => {
    it('should assign permission to role', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)
      vi.mocked(prisma.rolePermission.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.rolePermission.create).mockResolvedValue({
        roleId: 1,
        permissionId: 1,
      } as any)

      await assignPermissionToRole(1, 1)

      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: { roleId: 1, permissionId: 1 },
      })
    })

    it('should throw error when role not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      await expect(assignPermissionToRole(999, 1)).rejects.toThrow(
        'Role with ID 999 not found'
      )
    })

    it('should throw error when permission already assigned', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.permission.findUnique).mockResolvedValue(mockPermission)
      vi.mocked(prisma.rolePermission.findUnique).mockResolvedValue({
        roleId: 1,
        permissionId: 1,
      } as any)

      await expect(assignPermissionToRole(1, 1)).rejects.toThrow(
        'Permission already assigned to role'
      )
    })
  })

  describe('removePermissionFromRole', () => {
    it('should remove permission from role', async () => {
      vi.mocked(prisma.rolePermission.findUnique).mockResolvedValue({
        roleId: 1,
        permissionId: 1,
      } as any)
      vi.mocked(prisma.rolePermission.delete).mockResolvedValue({} as any)

      await removePermissionFromRole(1, 1)

      expect(prisma.rolePermission.delete).toHaveBeenCalledWith({
        where: { roleId_permissionId: { roleId: 1, permissionId: 1 } },
      })
    })

    it('should throw error when permission not assigned', async () => {
      vi.mocked(prisma.rolePermission.findUnique).mockResolvedValue(null)

      await expect(removePermissionFromRole(1, 1)).rejects.toThrow(
        'Permission not assigned to role'
      )
    })
  })

  describe('getRolePermissions', () => {
    it('should return permissions for a role', async () => {
      const mockRolePermissions = [
        { permission: mockPermission, roleId: 1, permissionId: 1 },
      ]
      vi.mocked(prisma.rolePermission.findMany).mockResolvedValue(mockRolePermissions as any)

      const result = await getRolePermissions(1)

      expect(result).toEqual([mockPermission])
      expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { roleId: 1 },
        include: { permission: true },
      })
    })
  })

  describe('setRolePermissions', () => {
    it('should set role permissions', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.permission.findMany).mockResolvedValue([mockPermission])
      vi.mocked(prisma.$transaction).mockImplementation((callback) => {
        return callback({
          ...prisma,
          rolePermission: {
            ...prisma.rolePermission,
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        } as any)
      })

      await setRolePermissions(1, [1])

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error when role not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null)

      await expect(setRolePermissions(999, [1])).rejects.toThrow(
        'Role with ID 999 not found'
      )
    })

    it('should throw error when permissions not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.permission.findMany).mockResolvedValue([])

      await expect(setRolePermissions(1, [1, 2])).rejects.toThrow(
        'One or more permissions not found'
      )
    })
  })
})
