/**
 * Content Type Service
 * Manages content type definitions
 */

import { 
  ContentTypeDefinition, 
  ContentTypeRegistry,
  ContentTypeBuilder 
} from '../content-type-builder/index.js'
import fs from 'fs/promises'
import path from 'path'

const CONTENT_TYPES_FILE = path.join(process.cwd(), 'content-types', 'definitions.json')

const builder = new ContentTypeBuilder()

/**
 * Load content types from file
 */
async function loadContentTypes(): Promise<ContentTypeRegistry> {
  try {
    const content = await fs.readFile(CONTENT_TYPES_FILE, 'utf-8')
    const definitions = JSON.parse(content)
    
    // Load into builder
    builder.clear()
    for (const definition of Object.values(definitions)) {
      builder.define(definition as ContentTypeDefinition)
    }
    
    return builder.getAll()
  } catch (error) {
    // If file doesn't exist, return empty registry
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

/**
 * Save content types to file
 */
async function saveContentTypes(registry: ContentTypeRegistry): Promise<void> {
  // Ensure directory exists
  await fs.mkdir(path.dirname(CONTENT_TYPES_FILE), { recursive: true })
  
  // Write to file
  await fs.writeFile(
    CONTENT_TYPES_FILE, 
    JSON.stringify(registry, null, 2),
    'utf-8'
  )
}

/**
 * Get all content types
 */
export async function getAllContentTypes(): Promise<ContentTypeRegistry> {
  return await loadContentTypes()
}

/**
 * Get a specific content type by UID
 */
export async function getContentType(uid: string): Promise<ContentTypeDefinition | null> {
  const registry = await loadContentTypes()
  return registry[uid] || null
}

/**
 * Create a new content type
 */
export async function createContentType(definition: ContentTypeDefinition): Promise<ContentTypeDefinition> {
  const registry = await loadContentTypes()
  
  // Check if already exists
  if (registry[definition.uid]) {
    throw new Error(`Content type with UID ${definition.uid} already exists`)
  }
  
  // Validate using builder
  builder.clear()
  builder.define(definition)
  
  // Add to registry
  registry[definition.uid] = definition
  
  // Save
  await saveContentTypes(registry)
  
  return definition
}

/**
 * Update an existing content type
 */
export async function updateContentType(uid: string, definition: ContentTypeDefinition): Promise<ContentTypeDefinition> {
  const registry = await loadContentTypes()
  
  // Check if exists
  if (!registry[uid]) {
    throw new Error(`Content type with UID ${uid} not found`)
  }
  
  // Validate using builder
  builder.clear()
  builder.define(definition)
  
  // Update in registry
  registry[definition.uid] = definition
  
  // If UID changed, remove old entry
  if (uid !== definition.uid) {
    delete registry[uid]
  }
  
  // Save
  await saveContentTypes(registry)
  
  return definition
}

/**
 * Delete a content type
 */
export async function deleteContentType(uid: string): Promise<boolean> {
  const registry = await loadContentTypes()
  
  if (!registry[uid]) {
    return false
  }
  
  delete registry[uid]
  await saveContentTypes(registry)
  
  return true
}
