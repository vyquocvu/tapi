import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  setUserRoles,
  type CreateUserInput,
  type UpdateUserInput,
} from '../src/services/userManagementService'
import prisma from '../src/db/prisma'

// Mock Prisma and bcrypt
vi.mock('../src/db/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userRole: {
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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
  },
}))

describe('userManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    avatar: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockRole = {
    id: 1,
    name: 'Admin',
    description: 'Administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('getAllUsers', () => {
    it('should return all active users by default', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser])

      const result = await getAllUsers()

      expect(result).toEqual([mockUser])
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      })
    })

    it('should return all users including inactive when specified', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser])

      await getAllUsers(true)

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserById(1)

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      })
    })

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await getUserById(999)

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found by email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await getUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      })
    })
  })

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const input: CreateUserInput = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({
        ...mockUser,
        email: input.email,
        name: input.name,
      })

      const result = await createUser(input)

      expect(result.email).toBe(input.email)
      expect(result.name).toBe(input.name)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: input.email,
          name: input.name,
          password: 'hashed_password123',
        }),
        select: expect.any(Object),
      })
    })

    it('should throw error when user with email already exists', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      await expect(createUser(input)).rejects.toThrow(
        "User with email 'test@example.com' already exists"
      )
    })
  })

  describe('updateUser', () => {
    it('should update user details', async () => {
      const input: UpdateUserInput = {
        name: 'Updated Name',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        ...input,
      })

      const result = await updateUser(1, input)

      expect(result.name).toBe(input.name)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
        select: expect.any(Object),
      })
    })

    it('should hash password when updating', async () => {
      const input: UpdateUserInput = {
        password: 'newpassword',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      await updateUser(1, input)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          password: 'hashed_newpassword',
        }),
        select: expect.any(Object),
      })
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(updateUser(999, { name: 'Test' })).rejects.toThrow(
        'User with ID 999 not found'
      )
    })

    it('should throw error when updating to existing email', async () => {
      const existingUser = { ...mockUser, id: 2, email: 'existing@example.com' }

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser)

      await expect(
        updateUser(1, { email: 'existing@example.com' })
      ).rejects.toThrow("User with email 'existing@example.com' already exists")
    })
  })

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.user.delete).mockResolvedValue(mockUser)

      await deleteUser(1)

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(deleteUser(999)).rejects.toThrow('User with ID 999 not found')
    })
  })

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.userRole.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.userRole.create).mockResolvedValue({
        userId: 1,
        roleId: 1,
        assignedBy: null,
      } as any)

      await assignRoleToUser(1, 1)

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 1, roleId: 1, assignedBy: undefined },
      })
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(assignRoleToUser(999, 1)).rejects.toThrow(
        'User with ID 999 not found'
      )
    })

    it('should throw error when role already assigned', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole)
      vi.mocked(prisma.userRole.findUnique).mockResolvedValue({
        userId: 1,
        roleId: 1,
      } as any)

      await expect(assignRoleToUser(1, 1)).rejects.toThrow(
        'Role already assigned to user'
      )
    })
  })

  describe('removeRoleFromUser', () => {
    it('should remove role from user', async () => {
      vi.mocked(prisma.userRole.findUnique).mockResolvedValue({
        userId: 1,
        roleId: 1,
      } as any)
      vi.mocked(prisma.userRole.delete).mockResolvedValue({} as any)

      await removeRoleFromUser(1, 1)

      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 1, roleId: 1 } },
      })
    })

    it('should throw error when role not assigned', async () => {
      vi.mocked(prisma.userRole.findUnique).mockResolvedValue(null)

      await expect(removeRoleFromUser(1, 1)).rejects.toThrow(
        'Role not assigned to user'
      )
    })
  })

  describe('getUserRoles', () => {
    it('should return roles for a user', async () => {
      const mockUserRoles = [{ role: mockRole, userId: 1, roleId: 1 }]
      vi.mocked(prisma.userRole.findMany).mockResolvedValue(mockUserRoles as any)

      const result = await getUserRoles(1)

      expect(result).toEqual([mockRole])
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { role: true },
      })
    })
  })

  describe('setUserRoles', () => {
    it('should set user roles', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
      vi.mocked(prisma.role.findMany).mockResolvedValue([mockRole])
      vi.mocked(prisma.$transaction).mockImplementation((callback) => {
        return callback({
          ...prisma,
          userRole: {
            ...prisma.userRole,
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        } as any)
      })

      await setUserRoles(1, [1])

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(setUserRoles(999, [1])).rejects.toThrow(
        'User with ID 999 not found'
      )
    })
  })
})
