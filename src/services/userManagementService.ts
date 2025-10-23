import prisma from '../db/prisma.js'
import bcrypt from 'bcryptjs'
import { Permission } from './permissionService.js'
import { Role } from './roleService.js'

export interface CreateUserInput {
  email: string
  password: string
  name: string
  bio?: string
  avatar?: string
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  password?: string
  name?: string
  bio?: string
  avatar?: string
  isActive?: boolean
}

export interface UserWithRoles {
  id: number
  email: string
  name: string
  bio: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userRoles: {
    role: Role
  }[]
}

/**
 * Get all users
 */
export async function getAllUsers(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true }
  
  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { name: 'asc' }
  })
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

/**
 * Get user by ID with roles and permissions
 */
export async function getUserWithRolesAndPermissions(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      },
      userPermissions: {
        include: {
          permission: true
        }
      }
    }
  })
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput) {
  // Check if user already exists
  const existing = await getUserByEmail(input.email)
  if (existing) {
    throw new Error(`User with email '${input.email}' already exists`)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return user
}

/**
 * Update a user
 */
export async function updateUser(id: number, input: UpdateUserInput) {
  const existing = await getUserById(id)
  if (!existing) {
    throw new Error(`User with ID ${id} not found`)
  }

  // If updating email, check for conflicts
  if (input.email && input.email !== existing.email) {
    const emailExists = await getUserByEmail(input.email)
    if (emailExists) {
      throw new Error(`User with email '${input.email}' already exists`)
    }
  }

  // Hash password if provided
  const data: any = { ...input }
  if (input.password) {
    data.password = await bcrypt.hash(input.password, 10)
  }

  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
  const existing = await getUserById(id)
  if (!existing) {
    throw new Error(`User with ID ${id} not found`)
  }

  await prisma.user.delete({
    where: { id }
  })
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: number, roleId: number, assignedBy?: number): Promise<void> {
  // Check if user exists
  const user = await getUserById(userId)
  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  // Check if role exists
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`)
  }

  // Check if already assigned
  const existing = await prisma.userRole.findUnique({
    where: {
      userId_roleId: { userId, roleId }
    }
  })

  if (existing) {
    throw new Error('Role already assigned to user')
  }

  await prisma.userRole.create({
    data: {
      userId,
      roleId,
      assignedBy
    }
  })
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  const existing = await prisma.userRole.findUnique({
    where: {
      userId_roleId: { userId, roleId }
    }
  })

  if (!existing) {
    throw new Error('Role not assigned to user')
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: { userId, roleId }
    }
  })
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: number): Promise<Role[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  })

  return userRoles.map(ur => ur.role)
}

/**
 * Set user roles (replaces all existing roles)
 */
export async function setUserRoles(userId: number, roleIds: number[], assignedBy?: number): Promise<void> {
  // Check if user exists
  const user = await getUserById(userId)
  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  // Verify all roles exist
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } }
  })

  if (roles.length !== roleIds.length) {
    throw new Error('One or more roles not found')
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Delete all existing user roles
    await tx.userRole.deleteMany({
      where: { userId }
    })

    // Create new user roles
    if (roleIds.length > 0) {
      await tx.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy
        }))
      })
    }
  })
}

/**
 * Assign direct permission to user
 */
export async function assignPermissionToUser(userId: number, permissionId: number, assignedBy?: number): Promise<void> {
  // Check if user exists
  const user = await getUserById(userId)
  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  // Check if permission exists
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } })
  if (!permission) {
    throw new Error(`Permission with ID ${permissionId} not found`)
  }

  // Check if already assigned
  const existing = await prisma.userPermission.findUnique({
    where: {
      userId_permissionId: { userId, permissionId }
    }
  })

  if (existing) {
    throw new Error('Permission already assigned to user')
  }

  await prisma.userPermission.create({
    data: {
      userId,
      permissionId,
      assignedBy
    }
  })
}

/**
 * Remove direct permission from user
 */
export async function removePermissionFromUser(userId: number, permissionId: number): Promise<void> {
  const existing = await prisma.userPermission.findUnique({
    where: {
      userId_permissionId: { userId, permissionId }
    }
  })

  if (!existing) {
    throw new Error('Permission not assigned to user')
  }

  await prisma.userPermission.delete({
    where: {
      userId_permissionId: { userId, permissionId }
    }
  })
}

/**
 * Get all permissions for a user (both from roles and direct assignments)
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const user = await getUserWithRolesAndPermissions(userId)
  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  const permissions = new Map<number, Permission>()

  // Add permissions from roles
  user.userRoles.forEach(ur => {
    ur.role.rolePermissions.forEach(rp => {
      permissions.set(rp.permission.id, rp.permission)
    })
  })

  // Add direct user permissions
  user.userPermissions.forEach(up => {
    permissions.set(up.permission.id, up.permission)
  })

  return Array.from(permissions.values())
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.some(p => p.name === permissionName)
}

/**
 * Check if user has any of the specified permissions
 */
export async function userHasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  const userPermissionNames = permissions.map(p => p.name)
  return permissionNames.some(name => userPermissionNames.includes(name))
}
