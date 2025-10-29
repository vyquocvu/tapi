/**
 * API Endpoint Configuration Service
 * Manages endpoint visibility and access control settings
 */

import { PrismaClient } from '@prisma/client'
import { getContentType, getAllContentTypes } from './contentTypeService.js'

const prisma = new PrismaClient()

export interface EndpointConfig {
  uid: string // For dynamic content endpoints
  path: string
  isPublic: boolean
  allowedRoles?: string
  rateLimit?: number
  description?: string
}

/**
 * Get endpoint configuration for a specific content type
 * Fetches from DB or creates a default config if not found
 */
export async function getEndpointConfig(contentTypeUid: string): Promise<EndpointConfig | null> {
  const contentType = await getContentType(contentTypeUid)
  if (!contentType) {
    return null
  }

  let config = await prisma.apiEndpointConfig.findUnique({
    where: { contentTypeUid },
  })

  if (!config) {
    config = await prisma.apiEndpointConfig.create({
      data: {
        contentTypeUid,
        isPublic: false,
        allowedRoles: 'authenticated',
        rateLimit: 100,
        description: `CRUD endpoints for ${contentType.displayName}`,
      },
    })
  }
  
  return {
    uid: contentTypeUid,
    path: `/api/content?contentType=${contentTypeUid}`,
    isPublic: config.isPublic,
    allowedRoles: config.allowedRoles || 'authenticated',
    rateLimit: config.rateLimit || 100,
    description: config.description || `CRUD endpoints for ${contentType.displayName}`,
  }
}

/**
 * Get all endpoint configurations for content types
 * Ensures all content types have a configuration in the DB
 */
export async function getAllEndpointConfigs(): Promise<EndpointConfig[]> {
  const contentTypes = await getAllContentTypes()
  const configs = await prisma.apiEndpointConfig.findMany()

  const configMap = new Map(configs.map(c => [c.contentTypeUid, c]))

  for (const ct of Object.values(contentTypes)) {
    if (!configMap.has(ct.uid)) {
      const newConfig = await prisma.apiEndpointConfig.create({
        data: {
          contentTypeUid: ct.uid,
          isPublic: false,
          allowedRoles: 'authenticated',
          rateLimit: 100,
          description: `CRUD endpoints for ${ct.displayName}`,
        },
      })
      configMap.set(ct.uid, newConfig)
    }
  }

  return Object.values(contentTypes).map(ct => {
    const config = configMap.get(ct.uid)!
    return {
      uid: ct.uid,
      path: `/api/content?contentType=${ct.uid}`,
      isPublic: config.isPublic,
      allowedRoles: config.allowedRoles || 'authenticated',
      rateLimit: config.rateLimit || 100,
      description: config.description || `CRUD endpoints for ${ct.displayName}`,
    }
  })
}

/**
 * Update endpoint configuration in the database
 */
export async function updateEndpointConfig(
  contentTypeUid: string,
  config: Partial<EndpointConfig>
): Promise<EndpointConfig> {
  const updatedConfig = await prisma.apiEndpointConfig.update({
    where: { contentTypeUid },
    data: {
      isPublic: config.isPublic,
      allowedRoles: config.allowedRoles,
      rateLimit: config.rateLimit,
      description: config.description,
    },
  })

  return {
    uid: contentTypeUid,
    path: `/api/content?contentType=${contentTypeUid}`,
    isPublic: updatedConfig.isPublic,
    allowedRoles: updatedConfig.allowedRoles || 'authenticated',
    rateLimit: updatedConfig.rateLimit || 100,
    description: updatedConfig.description || '',
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

  const config = await getEndpointConfig(contentTypeUid)
  if (!config) {
    throw new Error(`Configuration for content type '${contentTypeUid}' not found`)
  }
  
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

This endpoint is **${config.isPublic ? 'public' : 'private'}**.
${!config.isPublic ? `
All endpoints require JWT authentication:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`
` : ''}
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
      securitySchemes:_SEC_SCHEMES_PLACEHOLDER_,
    },
    security: [{ bearerAuth: [] }]
  }
}
const _SEC_SCHEMES_PLACEHOLDER_ = { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }};