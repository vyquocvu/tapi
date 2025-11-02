/**
 * API Endpoint Configuration Service
 * Manages endpoint visibility and access control settings
 */

import { getContentType, getAllContentTypes } from './contentTypeService.js'
import prisma from '../db/prisma.js'

export interface EndpointConfig {
  uid: string // For dynamic content endpoints
  path: string
  isPublic: boolean
  allowedRoles?: string[]
  rateLimit?: number
  description?: string
}

/**
 * Safely parse JSON with fallback to default value
 */
function safeJSONParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue
  
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    return defaultValue
  }
}

/**
 * Get endpoint configuration for a specific content type
 * Loads from database if exists, otherwise returns defaults
 */
export async function getEndpointConfig(contentTypeUid: string): Promise<EndpointConfig | null> {
  const contentType = await getContentType(contentTypeUid)
  if (!contentType) {
    return null
  }
  
  // Try to load from database
  const dbConfig = await prisma.endpointConfiguration.findUnique({
    where: { uid: contentTypeUid }
  })
  
  // If found in database, use those settings
  if (dbConfig) {
    return {
      uid: dbConfig.uid,
      path: `/api/content?contentType=${dbConfig.uid}`,
      isPublic: dbConfig.isPublic,
      allowedRoles: safeJSONParse(dbConfig.allowedRoles, ['authenticated']),
      rateLimit: dbConfig.rateLimit || 100,
      description: dbConfig.description || `CRUD endpoints for ${contentType.displayName}`
    }
  }
  
  // Default configuration - all endpoints are private by default
  return {
    uid: contentTypeUid,
    path: `/api/content?contentType=${contentTypeUid}`,
    isPublic: false,
    allowedRoles: ['authenticated'],
    rateLimit: 100,
    description: `CRUD endpoints for ${contentType.displayName}`
  }
}

/**
 * Get all endpoint configurations for content types
 */
export async function getAllEndpointConfigs(): Promise<EndpointConfig[]> {
  const contentTypes = await getAllContentTypes()
  
  // Load all configurations from database
  const dbConfigs = await prisma.endpointConfiguration.findMany()
  const configMap = new Map(dbConfigs.map(c => [c.uid, c]))
  
  return Object.values(contentTypes).map(ct => {
    const dbConfig = configMap.get(ct.uid)
    
    if (dbConfig) {
      return {
        uid: dbConfig.uid,
        path: `/api/content?contentType=${dbConfig.uid}`,
        isPublic: dbConfig.isPublic,
        allowedRoles: safeJSONParse(dbConfig.allowedRoles, ['authenticated']),
        rateLimit: dbConfig.rateLimit || 100,
        description: dbConfig.description || `CRUD endpoints for ${ct.displayName}`
      }
    }
    
    // Default configuration
    return {
      uid: ct.uid,
      path: `/api/content?contentType=${ct.uid}`,
      isPublic: false,
      allowedRoles: ['authenticated'],
      rateLimit: 100,
      description: `CRUD endpoints for ${ct.displayName}`
    }
  })
}

/**
 * Update endpoint configuration
 * Persists changes to database
 */
export async function updateEndpointConfig(
  contentTypeUid: string,
  config: Partial<EndpointConfig>
): Promise<EndpointConfig> {
  const contentType = await getContentType(contentTypeUid)
  if (!contentType) {
    throw new Error(`Content type '${contentTypeUid}' not found`)
  }
  
  // Prepare data for database
  const updateData: any = {}
  
  if (config.isPublic !== undefined) {
    updateData.isPublic = config.isPublic
  }
  
  if (config.allowedRoles !== undefined) {
    updateData.allowedRoles = JSON.stringify(config.allowedRoles)
  }
  
  if (config.rateLimit !== undefined) {
    updateData.rateLimit = config.rateLimit
  }
  
  if (config.description !== undefined) {
    updateData.description = config.description
  }
  
  // Upsert to database
  const dbConfig = await prisma.endpointConfiguration.upsert({
    where: { uid: contentTypeUid },
    update: updateData,
    create: {
      uid: contentTypeUid,
      isPublic: config.isPublic ?? false,
      allowedRoles: config.allowedRoles ? JSON.stringify(config.allowedRoles) : JSON.stringify(['authenticated']),
      rateLimit: config.rateLimit ?? 100,
      description: config.description ?? `CRUD endpoints for ${contentType.displayName}`
    }
  })
  
  return {
    uid: dbConfig.uid,
    path: `/api/content?contentType=${dbConfig.uid}`,
    isPublic: dbConfig.isPublic,
    allowedRoles: safeJSONParse(dbConfig.allowedRoles, ['authenticated']),
    rateLimit: dbConfig.rateLimit || 100,
    description: dbConfig.description || `CRUD endpoints for ${contentType.displayName}`
  }
}

/**
 * Generate REST API documentation for a content type
 */
export async function generateAPIDocumentation(contentTypeUid: string): Promise<string> {
  const contentType = await getContentType(contentTypeUid)
  if (!contentType) {
    throw new Error(`Content type '${contentTypeUid}' not found`)
  }
  
  // Get endpoint configuration to include access level
  const endpointConfig = await getEndpointConfig(contentTypeUid)
  const accessLevel = endpointConfig?.isPublic ? '**Public** (no authentication required)' : '**Private** (authentication required)'
  
  const { displayName, singularName, pluralName, description, fields } = contentType
  
  // Generate field documentation
  const fieldDocs = Object.entries(fields).map(([name, field]) => {
    const typedField = field as any
    return `  - **${name}** (${typedField.type})${typedField.required ? ' *required*' : ''}: ${typedField.description || 'No description'}`
  }).join('\n')
  
  return `
# ${displayName} API Documentation

**Content Type UID**: \`${contentTypeUid}\`
**Description**: ${description || 'No description provided'}
**Access Level**: ${accessLevel}

## Endpoints

### List All ${pluralName}
\`\`\`
GET /api/content?contentType=${contentTypeUid}
\`\`\`
Query parameters:
- \`where\`: JSON filter (optional)
- \`orderBy\`: JSON sort order (optional)
- \`skip\`: Pagination offset (optional)
- \`take\`: Pagination limit (optional)
- \`count\`: Include total count (optional, "true")

### Get Single ${singularName}
\`\`\`
GET /api/content?contentType=${contentTypeUid}&id={id}
\`\`\`

### Create ${singularName}
\`\`\`
POST /api/content?contentType=${contentTypeUid}
Content-Type: application/json

{
  // Required and optional fields
}
\`\`\`

### Update ${singularName}
\`\`\`
PUT /api/content?contentType=${contentTypeUid}&id={id}
Content-Type: application/json

{
  // Fields to update
}
\`\`\`

### Delete ${singularName}
\`\`\`
DELETE /api/content?contentType=${contentTypeUid}&id={id}
\`\`\`

## Schema Fields

${fieldDocs}

## Authentication

${endpointConfig?.isPublic 
  ? 'These endpoints are **public** and do not require authentication.' 
  : `All endpoints require JWT authentication:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\``}
`.trim()
}

/**
 * Generate OpenAPI/Swagger spec for a content type
 */
export async function generateOpenAPISpec(contentTypeUid: string): Promise<any> {
  const contentType = await getContentType(contentTypeUid)
  if (!contentType) {
    throw new Error(`Content type '${contentTypeUid}' not found`)
  }
  
  const { displayName, singularName, pluralName, description, fields } = contentType
  const modelName = singularName.charAt(0).toUpperCase() + singularName.slice(1)
  
  // Build schema properties from fields
  const properties: any = {
    id: { type: 'integer', description: 'Unique identifier' }
  }
  
  const required: string[] = []
  
  Object.entries(fields).forEach(([name, field]) => {
    const typedField = field as any
    
    // Map Prisma/content type fields to OpenAPI types
    let type = 'string'
    let format
    
    switch (typedField.type) {
      case 'integer':
      case 'biginteger':
        type = 'integer'
        break
      case 'float':
      case 'decimal':
        type = 'number'
        break
      case 'boolean':
        type = 'boolean'
        break
      case 'date':
        type = 'string'
        format = 'date'
        break
      case 'datetime':
        type = 'string'
        format = 'date-time'
        break
      case 'json':
        type = 'object'
        break
    }
    
    properties[name] = {
      type,
      ...(format && { format }),
      description: typedField.description || `${name} field`
    }
    
    if (typedField.required) {
      required.push(name)
    }
  })
  
  // Add timestamps if enabled
  properties.createdAt = { type: 'string', format: 'date-time' }
  properties.updatedAt = { type: 'string', format: 'date-time' }
  
  return {
    openapi: '3.0.0',
    info: {
      title: `${displayName} API`,
      version: '1.0.0',
      description: description || `API for managing ${pluralName}`
    },
    servers: [
      { url: 'http://localhost:5173', description: 'Development' },
      { url: 'https://your-app.vercel.app', description: 'Production' }
    ],
    paths: {
      [`/api/content?contentType=${contentTypeUid}`]: {
        get: {
          summary: `List all ${pluralName}`,
          parameters: [
            { name: 'where', in: 'query', schema: { type: 'string' }, description: 'JSON filter' },
            { name: 'orderBy', in: 'query', schema: { type: 'string' }, description: 'JSON sort order' },
            { name: 'skip', in: 'query', schema: { type: 'integer' } },
            { name: 'take', in: 'query', schema: { type: 'integer' } },
            { name: 'count', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: `#/components/schemas/${modelName}` }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: `Create a new ${singularName}`,
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${modelName}Input` }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: `#/components/schemas/${modelName}` }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        [modelName]: {
          type: 'object',
          properties,
          required: ['id', ...required]
        },
        [`${modelName}Input`]: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(properties).filter(([k]) => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt')
          ),
          required
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  }
}
