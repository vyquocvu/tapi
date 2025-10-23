import prisma from '../db/prisma.js'

export interface CreatePermissionInput {
  name: string
  resource: string
  action: string
  description?: string
}

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
  return await prisma.permission.findMany({
    orderBy: [
      { resource: 'asc' },
      { action: 'asc' }
    ]
  })
}

/**
 * Get permission by ID
 */
export async function getPermissionById(id: number): Promise<Permission | null> {
  return await prisma.permission.findUnique({
    where: { id }
  })
}

/**
 * Get permission by name
 */
export async function getPermissionByName(name: string): Promise<Permission | null> {
  return await prisma.permission.findUnique({
    where: { name }
  })
}

/**
 * Create a new permission
 */
export async function createPermission(input: CreatePermissionInput): Promise<Permission> {
  // Check if permission already exists
  const existing = await getPermissionByName(input.name)
  if (existing) {
    throw new Error(`Permission '${input.name}' already exists`)
  }

  return await prisma.permission.create({
    data: input
  })
}

/**
 * Update a permission
 */
export async function updatePermission(id: number, input: Partial<CreatePermissionInput>): Promise<Permission> {
  const existing = await getPermissionById(id)
  if (!existing) {
    throw new Error(`Permission with ID ${id} not found`)
  }

  // If updating name, check for conflicts
  if (input.name && input.name !== existing.name) {
    const nameExists = await getPermissionByName(input.name)
    if (nameExists) {
      throw new Error(`Permission '${input.name}' already exists`)
    }
  }

  return await prisma.permission.update({
    where: { id },
    data: input
  })
}

/**
 * Delete a permission
 */
export async function deletePermission(id: number): Promise<void> {
  const existing = await getPermissionById(id)
  if (!existing) {
    throw new Error(`Permission with ID ${id} not found`)
  }

  await prisma.permission.delete({
    where: { id }
  })
}

/**
 * Get permissions by resource
 */
export async function getPermissionsByResource(resource: string): Promise<Permission[]> {
  return await prisma.permission.findMany({
    where: { resource },
    orderBy: { action: 'asc' }
  })
}
