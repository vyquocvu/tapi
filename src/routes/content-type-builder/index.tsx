import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentTypeDefinition, Field, FieldType } from '../../content-type-builder/types'
import '../../styles/content-type-builder.css'

export const Route = createFileRoute('/content-type-builder/')({
  component: ContentTypeBuilderComponent,
})

// Field type metadata with descriptions
const FIELD_TYPES: Array<{
  type: FieldType
  label: string
  description: string
  icon: string
}> = [
  { type: 'string', label: 'String', description: 'Short text (max 255 chars)', icon: '📝' },
  { type: 'text', label: 'Text', description: 'Long text content', icon: '📄' },
  { type: 'richtext', label: 'Rich Text', description: 'Formatted text with HTML', icon: '📰' },
  { type: 'email', label: 'Email', description: 'Email address', icon: '📧' },
  { type: 'password', label: 'Password', description: 'Hashed password', icon: '🔒' },
  { type: 'integer', label: 'Integer', description: 'Whole number', icon: '🔢' },
  { type: 'biginteger', label: 'Big Integer', description: 'Large whole number', icon: '🔢' },
  { type: 'float', label: 'Float', description: 'Decimal number', icon: '🔢' },
  { type: 'decimal', label: 'Decimal', description: 'Precise decimal', icon: '🔢' },
  { type: 'boolean', label: 'Boolean', description: 'True or false', icon: '✓' },
  { type: 'date', label: 'Date', description: 'Date only', icon: '📅' },
  { type: 'datetime', label: 'Date & Time', description: 'Date with time', icon: '🕐' },
  { type: 'time', label: 'Time', description: 'Time only', icon: '⏰' },
  { type: 'json', label: 'JSON', description: 'JSON data', icon: '{}' },
  { type: 'enumeration', label: 'Enumeration', description: 'Select from options', icon: '📋' },
  { type: 'relation', label: 'Relation', description: 'Link to another type', icon: '🔗' },
  { type: 'uid', label: 'UID', description: 'Unique identifier', icon: '🆔' },
]

type FieldWithId = {
  id: string
  name: string
  type: FieldType
  required?: boolean
  unique?: boolean
  default?: any
  validations?: any[]
  minLength?: number
  maxLength?: number
  regex?: string
  min?: number
  max?: number
  values?: string[]
  relationType?: string
  target?: string
  mappedBy?: string
  inversedBy?: string
}

function ContentTypeBuilderComponent() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'preview'>('list')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  
  // Check authentication
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null
  
  if (!token) {
    return (
      <div className="content-type-builder">
        <div className="error">
          Please login to access the content type builder.
        </div>
      </div>
    )
  }
  
  // Form state
  const [uid, setUid] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [singularName, setSingularName] = useState('')
  const [pluralName, setPluralName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FieldWithId[]>([])
  const [timestamps, setTimestamps] = useState(true)
  const [softDelete, setSoftDelete] = useState(false)
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Fetch all content types
  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: async () => {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch('/api/content-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch content types')
      const result = await response.json()
      return result.data as Record<string, ContentTypeDefinition>
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (definition: ContentTypeDefinition) => {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch('/api/content-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(definition),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create content type')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
      resetForm()
      setMode('list')
      setError('')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ uid, definition }: { uid: string; definition: ContentTypeDefinition }) => {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch(`/api/content-types?uid=${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(definition),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update content type')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
      resetForm()
      setMode('list')
      setError('')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (uid: string) => {
      const token = sessionStorage.getItem('authToken')
      const response = await fetch(`/api/content-types?uid=${uid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete content type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
    },
  })

  const resetForm = () => {
    setUid('')
    setDisplayName('')
    setSingularName('')
    setPluralName('')
    setDescription('')
    setFields([])
    setTimestamps(true)
    setSoftDelete(false)
    setSelectedUid(null)
    setError('')
  }

  const handleCreate = () => {
    resetForm()
    setMode('create')
  }

  const handleEdit = (contentType: ContentTypeDefinition) => {
    setUid(contentType.uid)
    setDisplayName(contentType.displayName)
    setSingularName(contentType.singularName)
    setPluralName(contentType.pluralName)
    setDescription(contentType.description || '')
    setTimestamps(contentType.options?.timestamps ?? true)
    setSoftDelete(contentType.options?.softDelete ?? false)
    
    // Convert fields to array with IDs
    const fieldsArray = Object.entries(contentType.fields).map(([name, field]) => ({
      ...field,
      id: Math.random().toString(36).substr(2, 9),
      name,
    }))
    setFields(fieldsArray)
    
    setSelectedUid(contentType.uid)
    setMode('edit')
  }

  const handleDelete = async (uid: string) => {
    if (confirm(`Are you sure you want to delete content type "${uid}"?`)) {
      await deleteMutation.mutateAsync(uid)
    }
  }

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        type: 'string',
        required: false,
        unique: false,
      },
    ])
  }

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const handleFieldChange = (id: string, updates: Partial<FieldWithId>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newFields = [...fields]
    const draggedField = newFields[draggedIndex]
    newFields.splice(draggedIndex, 1)
    newFields.splice(index, 0, draggedField)
    
    setFields(newFields)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = () => {
    setError('')

    // Validation
    if (!uid || !displayName || !singularName || !pluralName) {
      setError('Please fill in all required fields')
      return
    }

    if (fields.length === 0) {
      setError('Please add at least one field')
      return
    }

    // Validate fields
    for (const field of fields) {
      if (!field.name) {
        setError('All fields must have a name')
        return
      }
      if (field.type === 'enumeration' && (!field.values || field.values.length === 0)) {
        setError(`Enumeration field "${field.name}" must have values`)
        return
      }
      if (field.type === 'relation' && !field.target) {
        setError(`Relation field "${field.name}" must have a target`)
        return
      }
    }

    // Convert fields array to object
    const fieldsObject: Record<string, Field> = {}
    fields.forEach((field) => {
      const { id, name, ...fieldData } = field
      fieldsObject[name] = fieldData as Field
    })

    const definition: ContentTypeDefinition = {
      uid,
      displayName,
      singularName,
      pluralName,
      description: description || undefined,
      fields: fieldsObject,
      options: {
        timestamps,
        softDelete,
      },
    }

    if (mode === 'create') {
      createMutation.mutate(definition)
    } else if (mode === 'edit' && selectedUid) {
      updateMutation.mutate({ uid: selectedUid, definition })
    }
  }

  const handlePreview = () => {
    setMode('preview')
  }

  if (isLoading) {
    return <div className="loading">Loading content types...</div>
  }

  return (
    <div className="content-type-builder">
      <div className="builder-header">
        <h1>Content Type Builder</h1>
        <p>Create and manage your data models with a visual interface</p>
      </div>

      {mode === 'list' && (
        <div className="builder-content">
          <div className="builder-actions">
            <button onClick={handleCreate} className="btn-primary">
              ➕ Create New Content Type
            </button>
          </div>

          {contentTypes && Object.keys(contentTypes).length > 0 ? (
            <div className="content-types-grid">
              {Object.entries(contentTypes).map(([uid, contentType]) => (
                <div key={uid} className="content-type-card">
                  <div className="card-header">
                    <h3>{contentType.displayName}</h3>
                    <div className="card-actions">
                      <button
                        onClick={() => handleEdit(contentType)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(uid)}
                        className="btn-icon"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="card-uid">{uid}</p>
                  {contentType.description && (
                    <p className="card-description">{contentType.description}</p>
                  )}
                  <div className="card-stats">
                    <span>📋 {Object.keys(contentType.fields).length} fields</span>
                    {contentType.options?.timestamps && <span>🕐 Timestamps</span>}
                    {contentType.options?.softDelete && <span>🗑️ Soft Delete</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No content types defined yet.</p>
              <p>Click "Create New Content Type" to get started!</p>
            </div>
          )}
        </div>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <div className="builder-content">
          <div className="builder-actions">
            <button onClick={() => setMode('list')} className="btn-secondary">
              ← Back to List
            </button>
            <div>
              <button onClick={handlePreview} className="btn-secondary">
                👁️ Preview
              </button>
              <button onClick={handleSave} className="btn-primary">
                💾 Save
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-section">
            <h2>Content Type Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="uid">
                  UID <span className="required">*</span>
                </label>
                <input
                  id="uid"
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="api::article.article"
                  disabled={mode === 'edit'}
                />
                <small>Unique identifier (e.g., api::article.article)</small>
              </div>

              <div className="form-group">
                <label htmlFor="displayName">
                  Display Name <span className="required">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Article"
                />
                <small>Human-readable name</small>
              </div>

              <div className="form-group">
                <label htmlFor="singularName">
                  Singular Name <span className="required">*</span>
                </label>
                <input
                  id="singularName"
                  type="text"
                  value={singularName}
                  onChange={(e) => setSingularName(e.target.value)}
                  placeholder="article"
                />
                <small>Singular form (lowercase)</small>
              </div>

              <div className="form-group">
                <label htmlFor="pluralName">
                  Plural Name <span className="required">*</span>
                </label>
                <input
                  id="pluralName"
                  type="text"
                  value={pluralName}
                  onChange={(e) => setPluralName(e.target.value)}
                  placeholder="articles"
                />
                <small>Plural form (lowercase)</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this content type"
                rows={3}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={timestamps}
                  onChange={(e) => setTimestamps(e.target.checked)}
                />
                Enable timestamps (createdAt, updatedAt)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={softDelete}
                  onChange={(e) => setSoftDelete(e.target.checked)}
                />
                Enable soft delete (deletedAt)
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2>Fields</h2>
              <button onClick={handleAddField} className="btn-small">
                ➕ Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="empty-state">
                <p>No fields added yet. Click "Add Field" to start!</p>
              </div>
            ) : (
              <div className="fields-list">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`field-card ${draggedIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="field-header">
                      <span className="drag-handle">⋮⋮</span>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                        placeholder="Field name"
                        className="field-name-input"
                      />
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="btn-remove"
                        title="Remove field"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="field-body">
                      <div className="field-row">
                        <div className="form-group">
                          <label>Type</label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              handleFieldChange(field.id, { type: e.target.value as FieldType })
                            }
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft.type} value={ft.type}>
                                {ft.icon} {ft.label}
                              </option>
                            ))}
                          </select>
                          <small>
                            {FIELD_TYPES.find((ft) => ft.type === field.type)?.description}
                          </small>
                        </div>

                        <div className="field-validations">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) =>
                                handleFieldChange(field.id, { required: e.target.checked })
                              }
                            />
                            Required
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={field.unique || false}
                              onChange={(e) =>
                                handleFieldChange(field.id, { unique: e.target.checked })
                              }
                            />
                            Unique
                          </label>
                        </div>
                      </div>

                      {/* String field options */}
                      {(field.type === 'string' ||
                        field.type === 'text' ||
                        field.type === 'email') && (
                        <div className="field-row">
                          <div className="form-group">
                            <label>Min Length</label>
                            <input
                              type="number"
                              value={field.minLength || ''}
                              onChange={(e) =>
                                handleFieldChange(field.id, {
                                  minLength: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="Optional"
                            />
                          </div>
                          <div className="form-group">
                            <label>Max Length</label>
                            <input
                              type="number"
                              value={field.maxLength || ''}
                              onChange={(e) =>
                                handleFieldChange(field.id, {
                                  maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      )}

                      {/* Number field options */}
                      {(field.type === 'integer' ||
                        field.type === 'float' ||
                        field.type === 'decimal') && (
                        <div className="field-row">
                          <div className="form-group">
                            <label>Min Value</label>
                            <input
                              type="number"
                              value={field.min || ''}
                              onChange={(e) =>
                                handleFieldChange(field.id, {
                                  min: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              placeholder="Optional"
                            />
                          </div>
                          <div className="form-group">
                            <label>Max Value</label>
                            <input
                              type="number"
                              value={field.max || ''}
                              onChange={(e) =>
                                handleFieldChange(field.id, {
                                  max: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      )}

                      {/* Enumeration options */}
                      {field.type === 'enumeration' && (
                        <div className="form-group">
                          <label>Values (comma-separated)</label>
                          <input
                            type="text"
                            value={field.values?.join(', ') || ''}
                            onChange={(e) =>
                              handleFieldChange(field.id, {
                                values: e.target.value.split(',').map((v) => v.trim()),
                              })
                            }
                            placeholder="active, inactive, pending"
                          />
                        </div>
                      )}

                      {/* Relation options */}
                      {field.type === 'relation' && (
                        <div className="field-row">
                          <div className="form-group">
                            <label>Relation Type</label>
                            <select
                              value={field.relationType || 'manyToOne'}
                              onChange={(e) =>
                                handleFieldChange(field.id, { relationType: e.target.value as any })
                              }
                            >
                              <option value="oneToOne">One to One</option>
                              <option value="oneToMany">One to Many</option>
                              <option value="manyToOne">Many to One</option>
                              <option value="manyToMany">Many to Many</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Target</label>
                            <input
                              type="text"
                              value={field.target || ''}
                              onChange={(e) =>
                                handleFieldChange(field.id, { target: e.target.value })
                              }
                              placeholder="api::user.user"
                            />
                          </div>
                        </div>
                      )}

                      {/* Default value */}
                      {field.type === 'boolean' ? (
                        <div className="form-group">
                          <label>Default Value</label>
                          <select
                            value={field.default === undefined ? '' : field.default.toString()}
                            onChange={(e) =>
                              handleFieldChange(field.id, {
                                default: e.target.value === '' ? undefined : e.target.value === 'true',
                              })
                            }
                          >
                            <option value="">None</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </div>
                      ) : field.type !== 'relation' && (
                        <div className="form-group">
                          <label>Default Value</label>
                          <input
                            type="text"
                            value={field.default || ''}
                            onChange={(e) =>
                              handleFieldChange(field.id, { default: e.target.value || undefined })
                            }
                            placeholder="Optional default value"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'preview' && (
        <div className="builder-content">
          <div className="builder-actions">
            <button onClick={() => setMode(selectedUid ? 'edit' : 'create')} className="btn-secondary">
              ← Back to Editor
            </button>
            <button onClick={handleSave} className="btn-primary">
              💾 Save
            </button>
          </div>

          <div className="preview-container">
            <h2>Preview: {displayName}</h2>
            <div className="preview-card">
              <pre className="preview-json">
                {JSON.stringify(
                  {
                    uid,
                    displayName,
                    singularName,
                    pluralName,
                    description: description || undefined,
                    fields: fields.reduce((acc, field) => {
                      const { id, name, ...fieldData } = field
                      acc[name] = fieldData as Field
                      return acc
                    }, {} as Record<string, Field>),
                    options: {
                      timestamps,
                      softDelete,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="preview-info">
              <h3>📊 Summary</h3>
              <ul>
                <li>Content Type: <strong>{displayName}</strong></li>
                <li>UID: <strong>{uid}</strong></li>
                <li>Fields: <strong>{fields.length}</strong></li>
                <li>
                  Required Fields:{' '}
                  <strong>{fields.filter((f) => f.required).length}</strong>
                </li>
                <li>
                  Unique Fields:{' '}
                  <strong>{fields.filter((f) => f.unique).length}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
