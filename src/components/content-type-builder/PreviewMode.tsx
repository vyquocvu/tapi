import type { FieldWithId } from './types'

interface PreviewModeProps {
  uid: string
  displayName: string
  singularName: string
  pluralName: string
  description: string
  timestamps: boolean
  softDelete: boolean
  fields: FieldWithId[]
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
    if (!fields || fields.length === 0) return 'No fields defined'
    
    let schema = `model ${displayName.replace(/\s+/g, '')} {\n`
    
    // Add ID field
    schema += `  id    String @id @default(cuid())\n`
    
    // Add user-defined fields
    fields.forEach(field => {
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
    if (!fields || fields.length === 0) return '{}'
    
    const jsonObj: Record<string, any> = {
      id: 'cuid_example_123',
    }
    
    fields.forEach(field => {
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
        <button 
          onClick={onBack} 
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          ← Back to List
        </button>
        <button 
          onClick={onEdit} 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          ✏️ Edit
        </button>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-4">{displayName}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          <div className="mb-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">🗃️ Fields ({fields.length})</h2>
          {fields.length === 0 ? (
            <p className="text-muted-foreground">No fields defined</p>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
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
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">🔗 REST API Endpoints</h2>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">🗄️ Prisma Schema</h2>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono text-foreground">
            {formatPrismaSchema()}
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">📋 JSON Structure</h2>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono text-foreground">
            {formatJSONStructure()}
          </pre>
        </div>
      </div>
    </div>
  )
}