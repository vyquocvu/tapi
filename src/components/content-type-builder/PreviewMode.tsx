import { ArrowLeft, Edit } from 'lucide-react'
import type { FieldWithId } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PreviewModeProps {
  uid: string
  displayName: string
  singularName: string
  pluralName: string
  description: string
  timestamps: boolean
  softDelete: boolean
  fields: { [key: string]: FieldWithId }
  onBack: () => void
  onEdit: () => void
}

export function PreviewMode({
  uid,
  displayName,
  singularName,
  pluralName,
  description,
  timestamps,
  softDelete,
  fields,
  onBack,
  onEdit,
}: PreviewModeProps) {
  const formatPrismaSchema = () => {
    if (!fields || Object.keys(fields).length === 0) return 'No fields defined'
    
    let schema = `model ${displayName.replace(/\s+/g, '')} {\n`
    
    // Add ID field
    schema += `  id    String @id @default(cuid())\n`
    
    // Add user-defined fields
    Object.values(fields).forEach(field => {
      const optional = !field.required ? '?' : ''
      let prismaType = 'String'
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'richtext':
        case 'enumeration':
          prismaType = 'String'
          break
        case 'integer':
        case 'biginteger':
          prismaType = 'Int'
          break
        case 'float':
        case 'decimal':
          prismaType = 'Float'
          break
        case 'boolean':
          prismaType = 'Boolean'
          break
        case 'date':
        case 'datetime':
          prismaType = 'DateTime'
          break
        case 'json':
          prismaType = 'Json'
          break
        case 'relation':
          prismaType = field.target || 'String'
          break
        default:
          prismaType = 'String'
      }
      
      schema += `  ${field.name}${' '.repeat(Math.max(1, 8 - field.name.length))}${prismaType}${optional}\n`
    })
    
    // Add timestamps if enabled
    if (timestamps) {
      schema += `  createdAt DateTime @default(now())\n`
      schema += `  updatedAt DateTime @updatedAt\n`
    }
    
    // Add soft delete if enabled
    if (softDelete) {
      schema += `  deletedAt DateTime?\n`
    }
    
    schema += `\n  @@map("${pluralName}")\n}`
    
    return schema
  }

  const formatRestAPIEndpoints = () => {
    const endpoints = [
      {
        method: 'GET',
        path: `/api/${pluralName}`,
        description: `Get all ${pluralName}`,
      },
      {
        method: 'GET',
        path: `/api/${pluralName}/:id`,
        description: `Get a single ${singularName}`,
      },
      {
        method: 'POST',
        path: `/api/${pluralName}`,
        description: `Create a new ${singularName}`,
      },
      {
        method: 'PUT',
        path: `/api/${pluralName}/:id`,
        description: `Update a ${singularName}`,
      },
      {
        method: 'DELETE',
        path: `/api/${pluralName}/:id`,
        description: `Delete a ${singularName}`,
      },
    ]

    return endpoints
  }

  const formatJSONStructure = () => {
    if (!fields || Object.keys(fields).length === 0) return '{}'
    
    const jsonObj: Record<string, any> = {
      id: 'cuid_example_123',
    }
    
    Object.values(fields).forEach(field => {
      let value: any = null
      
      switch (field.type) {
        case 'text':
          value = `Example ${field.name}`
          break
        case 'email':
          value = 'user@example.com'
          break
        case 'password':
          value = '••••••••'
          break
        case 'integer':
        case 'biginteger':
        case 'float':
        case 'decimal':
          value = 42
          break
        case 'boolean':
          value = true
          break
        case 'date':
          value = '2024-01-01'
          break
        case 'datetime':
          value = '2024-01-01T12:00:00Z'
          break
        case 'richtext':
          value = '<p>Rich text content</p>'
          break
        case 'json':
          value = { key: 'value' }
          break
        case 'enumeration':
          value = field.enum?.[0] || 'option1'
          break
        case 'relation':
          value = 'related_id_123'
          break
        default:
          value = `Example ${field.name}`
      }
      
      jsonObj[field.name] = value
    })
    
    if (timestamps) {
      jsonObj.createdAt = '2024-01-01T12:00:00Z'
      jsonObj.updatedAt = '2024-01-01T12:00:00Z'
    }
    
    if (softDelete) {
      jsonObj.deletedAt = null
    }
    
    return JSON.stringify(jsonObj, null, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
        <Button onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{displayName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">UID:</span>
              <p className="text-foreground font-mono">{uid}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Singular:</span>
              <p className="text-foreground">{singularName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Plural:</span>
              <p className="text-foreground">{pluralName}</p>
            </div>
          </div>
          {description && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Description:</span>
              <p className="text-foreground">{description}</p>
            </div>
          )}
          <div className="flex gap-4">
            {timestamps && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                📅 Timestamps
              </span>
            )}
            {softDelete && (
              <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary-foreground">
                🗑️ Soft Delete
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🗃️ Fields ({Object.keys(fields).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(fields).length === 0 ? (
              <p className="text-muted-foreground">No fields defined</p>
            ) : (
              <div className="space-y-3">
                {Object.values(fields).map((field) => (
                  <div key={field.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <div>
                      <span className="font-medium text-foreground">{field.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">({field.type})</span>
                      {field.required && <span className="ml-1 text-destructive">*</span>}
                    </div>
                    {field.unique && (
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                        Unique
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔗 REST API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formatRestAPIEndpoints().map((endpoint, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🗄️ Prisma Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono text-foreground">
              {formatPrismaSchema()}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 JSON Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono text-foreground">
              {formatJSONStructure()}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}