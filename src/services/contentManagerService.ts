/**
 * Content Manager Service
 * Manages CRUD operations for dynamic content types
 * Inspired by Strapi's Content Manager
 */

import prisma from '../db/prisma.js'
import { getContentType } from './contentTypeService.js'
import { ContentTypeDefinition, Field } from '../content-type-builder/types.js'

/**
 * Content entry interface
 */
export interface ContentEntry {
  id: number
  [key: string]: any
}

/**
 * Query options for finding content
 */
export interface FindOptions {
  where?: Record<string, any>
  select?: Record<string, boolean>
  include?: Record<string, boolean | object>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
}

/**
 * Create options for new content
 */
export interface CreateOptions {
  data: Record<string, any>
  include?: Record<string, boolean | object>
}

/**
 * Update options for existing content
 */
export interface UpdateOptions {
  where: { id: number }
  data: Record<string, any>
  include?: Record<string, boolean | object>
}

/**
 * Delete options
 */
export interface DeleteOptions {
  where: { id: number }
}

/**
 * Get the Prisma model name from content type UID
 * Converts 'api::article.article' to 'Article'
 */
function getModelName(uid: string): string {
  const parts = uid.split('.')
  const singularName = parts[parts.length - 1]
  // Capitalize first letter
  return singularName.charAt(0).toUpperCase() + singularName.slice(1)
}

/**
 * Validate that a content type exists
 */
async function validateContentType(contentType: string): Promise<ContentTypeDefinition> {
  const definition = await getContentType(contentType)
  if (!definition) {
    throw new Error(`Content type '${contentType}' not found`)
  }
  return definition
}

/**
 * Validate data against content type definition
 */
function validateData(data: Record<string, any>, definition: ContentTypeDefinition): void {
  const fields = definition.fields

  // Check required fields
  for (const [fieldName, field] of Object.entries(fields)) {
    const typedField = field as Field
    if (typedField.required && !(fieldName in data)) {
      throw new Error(`Required field '${fieldName}' is missing`)
    }
  }

  // Validate field types and constraints
  for (const [fieldName, value] of Object.entries(data)) {
    const field = fields[fieldName] as Field
    if (!field) {
      // Skip fields not in definition (like id, createdAt, updatedAt)
      continue
    }

    // Skip null/undefined values for non-required fields
    if (value == null && !field.required) {
      continue
    }

    // Type-specific validations
    if (field.type === 'string' || field.type === 'text' || field.type === 'email') {
      if (typeof value !== 'string') {
        throw new Error(`Field '${fieldName}' must be a string`)
      }
      const stringField = field as any
      if (stringField.maxLength && value.length > stringField.maxLength) {
        throw new Error(`Field '${fieldName}' exceeds maximum length of ${stringField.maxLength}`)
      }
      if (stringField.minLength && value.length < stringField.minLength) {
        throw new Error(`Field '${fieldName}' is below minimum length of ${stringField.minLength}`)
      }
    } else if (field.type === 'integer' || field.type === 'float' || field.type === 'decimal') {
      if (typeof value !== 'number') {
        throw new Error(`Field '${fieldName}' must be a number`)
      }
    } else if (field.type === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new Error(`Field '${fieldName}' must be a boolean`)
      }
    } else if (field.type === 'enumeration') {
      const enumField = field as any
      if (!enumField.values.includes(value)) {
        throw new Error(`Field '${fieldName}' must be one of: ${enumField.values.join(', ')}`)
      }
    }
  }
}

/**
 * Find all entries of a content type
 */
export async function findMany(
  contentType: string,
  options: FindOptions = {}
): Promise<ContentEntry[]> {
  await validateContentType(contentType)
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    const result = await model.findMany({
      where: options.where,
      select: options.select,
      include: options.include,
      orderBy: options.orderBy,
      skip: options.skip,
      take: options.take,
    })

    return result
  } catch (error) {
    console.error(`Error finding ${contentType}:`, error)
    throw new Error(`Failed to find ${contentType} entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Find a single entry by ID
 */
export async function findOne(
  contentType: string,
  id: number,
  options: Omit<FindOptions, 'where' | 'skip' | 'take' | 'orderBy'> = {}
): Promise<ContentEntry | null> {
  await validateContentType(contentType)
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    const result = await model.findUnique({
      where: { id },
      select: options.select,
      include: options.include,
    })

    return result
  } catch (error) {
    console.error(`Error finding ${contentType} with id ${id}:`, error)
    throw new Error(`Failed to find ${contentType} entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a new entry
 */
export async function create(
  contentType: string,
  options: CreateOptions
): Promise<ContentEntry> {
  const definition = await validateContentType(contentType)
  
  // Validate data
  validateData(options.data, definition)
  
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    const result = await model.create({
      data: options.data,
      include: options.include,
    })

    return result
  } catch (error) {
    console.error(`Error creating ${contentType}:`, error)
    throw new Error(`Failed to create ${contentType} entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update an existing entry
 */
export async function update(
  contentType: string,
  options: UpdateOptions
): Promise<ContentEntry> {
  const definition = await validateContentType(contentType)
  
  // Validate data (partial validation for updates)
  const fieldsToValidate: Record<string, any> = {}
  for (const [key, value] of Object.entries(options.data)) {
    if (definition.fields[key]) {
      fieldsToValidate[key] = value
    }
  }
  
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    const result = await model.update({
      where: options.where,
      data: options.data,
      include: options.include,
    })

    return result
  } catch (error) {
    console.error(`Error updating ${contentType}:`, error)
    throw new Error(`Failed to update ${contentType} entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete an entry
 */
export async function deleteOne(
  contentType: string,
  options: DeleteOptions
): Promise<boolean> {
  await validateContentType(contentType)
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    await model.delete({
      where: options.where,
    })

    return true
  } catch (error) {
    console.error(`Error deleting ${contentType}:`, error)
    throw new Error(`Failed to delete ${contentType} entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Count entries matching criteria
 */
export async function count(
  contentType: string,
  where?: Record<string, any>
): Promise<number> {
  await validateContentType(contentType)
  const modelName = getModelName(contentType)

  try {
    // @ts-ignore - Dynamic model access
    const model = prisma[modelName.toLowerCase()]
    if (!model) {
      throw new Error(`Prisma model for '${contentType}' not found`)
    }

    const result = await model.count({
      where,
    })

    return result
  } catch (error) {
    console.error(`Error counting ${contentType}:`, error)
    throw new Error(`Failed to count ${contentType} entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
