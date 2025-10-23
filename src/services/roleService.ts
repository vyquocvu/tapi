import prisma from '../db/prisma.js'
import { Permission } from './permissionService.js'

export interface CreateRoleInput {
  name: string
  description?: string
}

export interface Role {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RoleWithPermissions extends Role {
  rolePermissions: {
    permission: Permission
  }[]
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  return await prisma.role.findMany({
    orderBy: { name: 'asc' }
  })
}

/**
 * Get role by ID
 */
export async function getRoleById(id: number): Promise<Role | null> {
  return await prisma.role.findUnique({
    where: { id }
  })
}

/**
 * Get role by ID with permissions
 */
export async function getRoleWithPermissions(id: number): Promise<RoleWithPermissions | null> {
  return await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      }
    }
  })
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  return await prisma.role.findUnique({
    where: { name }
  })
}

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput): Promise<Role> {
  // Check if role already exists
  const existing = await getRoleByName(input.name)
  if (existing) {
    throw new Error(`Role '${input.name}' already exists`)
  }

  return await prisma.role.create({
    data: input
  })
}

/**
 * Update a role
 */
export async function updateRole(id: number, input: Partial<CreateRoleInput>): Promise<Role> {
  const existing = await getRoleById(id)
  if (!existing) {
    throw new Error(`Role with ID ${id} not found`)
  }

  // If updating name, check for conflicts
  if (input.name && input.name !== existing.name) {
    const nameExists = await getRoleByName(input.name)
    if (nameExists) {
      throw new Error(`Role '${input.name}' already exists`)
    }
  }

  return await prisma.role.update({
    where: { id },
    data: input
  })
}

/**
 * Delete a role
 */
export async function deleteRole(id: number): Promise<void> {
  const existing = await getRoleById(id)
  if (!existing) {
    throw new Error(`Role with ID ${id} not found`)
  }

  await prisma.role.delete({
    where: { id }
  })
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
  // Check if role exists
  const role = await getRoleById(roleId)
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`)
  }

  // Check if permission exists
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } })
  if (!permission) {
    throw new Error(`Permission with ID ${permissionId} not found`)
  }

  // Check if already assigned
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: { roleId, permissionId }
    }
  })

  if (existing) {
    throw new Error('Permission already assigned to role')
  }

  await prisma.rolePermission.create({
    data: {
      roleId,
      permissionId
    }
  })
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: { roleId, permissionId }
    }
  })

  if (!existing) {
    throw new Error('Permission not assigned to role')
  }

  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: { roleId, permissionId }
    }
  })
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true }
  })

  return rolePermissions.map(rp => rp.permission)
}

/**
 * Set role permissions (replaces all existing permissions)
 */
export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  // Check if role exists
  const role = await getRoleById(roleId)
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`)
  }

  // Verify all permissions exist
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } }
  })

  if (permissions.length !== permissionIds.length) {
    throw new Error('One or more permissions not found')
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Delete all existing role permissions
    await tx.rolePermission.deleteMany({
      where: { roleId }
    })

    // Create new role permissions
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId,
          permissionId
        }))
      })
    }
  })
}
