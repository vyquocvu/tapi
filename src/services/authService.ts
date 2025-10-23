import bcrypt from 'bcryptjs'
import prisma from '../db/prisma.js'
import { generateToken } from '../server/auth.js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: number
    email: string
    name: string
  }
  error?: string
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const { email, password } = credentials

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  try {
    // Find user in database - explicitly select only fields that exist
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid credentials',
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An error occurred during login',
    }
  }
}
