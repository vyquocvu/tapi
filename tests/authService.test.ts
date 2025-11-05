import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loginUser, type LoginCredentials } from '../src/services/authService'
import prisma from '../src/db/prisma'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('../src/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../src/server/auth', () => ({
  generateToken: vi.fn((payload) => `mock-token-${payload.userId}`),
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginUser', () => {
    it('should return error when email is missing', async () => {
      const credentials: LoginCredentials = {
        email: '',
        password: 'password123',
      }

      const result = await loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
      expect(result.token).toBeUndefined()
    })

    it('should return error when password is missing', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '',
      }

      const result = await loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
      expect(result.token).toBeUndefined()
    })

    it('should return error when user is not found', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(result.token).toBeUndefined()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
        select: expect.any(Object),
      })
    })

    it('should return error when password is invalid', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        name: 'Test User',
        bio: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(result.token).toBeUndefined()
    })

    it('should return success with token when credentials are valid', async () => {
      const password = 'correctpassword'
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password,
      }

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        bio: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const result = await loginUser(credentials)

      expect(result.success).toBe(true)
      expect(result.token).toBe('mock-token-1')
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(result.error).toBeUndefined()
    })

    it('should handle database errors gracefully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

      const result = await loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An error occurred during login')
      expect(result.token).toBeUndefined()
    })
  })
})
