import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { ContentTypeDefinition, FieldType, RelationType } from '../content-type-builder/types'
import '../styles/content-type-builder.css'

export const Route = createFileRoute('/content-type-builder')({
  component: ContentTypeBuilderComponent,
})

interface ContentTypeRegistry {
  [key: string]: ContentTypeDefinition
}

const fieldTypeOptions: FieldType[] = [
  'string',
  'text',
  'richtext',
  'email',
  'password',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'time',
  'json',
  'enumeration',
  'relation',
  'uid',
]

const relationTypeOptions: RelationType[] = [
  'oneToOne',
  'oneToMany',
  'manyToOne',
  'manyToMany',
]

function ContentTypeBuilderComponent() {
  const [contentTypes, setContentTypes] = useState<ContentTypeRegistry>({})
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  // const [editingField, setEditingField] = useState<string | null>(null)
  
  // Form state for new content type
  const [newContentType, setNewContentType] = useState({
    uid: '',
    displayName: '',
    singularName: '',
    pluralName: '',
    description: '',
  })

  // Form state for new field
  const [newField, setNewField] = useState({
    name: '',
    type: 'string' as FieldType,
    required: false,
    unique: false,
    default: '',
    // String fields
    minLength: '',
    maxLength: '',
    // Number fields
    min: '',
    max: '',
    // Enum fields
    enumValues: '',
    // Relation fields
    relationType: 'manyToOne' as RelationType,
    target: '',
  })

  // Load content types from definitions.json
  useEffect(() => {
    loadContentTypes()
  }, [])

  const loadContentTypes = async () => {
    try {
      const response = await fetch('/content-types/definitions.json')
      if (response.ok) {
        const data = await response.json()
        setContentTypes(data)
      }
    } catch (error) {
      console.error('Failed to load content types:', error)
    }
  }

  const handleCreateContentType = () => {
    if (!newContentType.uid || !newContentType.displayName || !newContentType.singularName || !newContentType.pluralName) {
      alert('Please fill in all required fields')
      return
    }

    const contentTypeDef: ContentTypeDefinition = {
      uid: newContentType.uid,
      displayName: newContentType.displayName,
      singularName: newContentType.singularName,
      pluralName: newContentType.pluralName,
      description: newContentType.description,
      fields: {},
      options: {
        timestamps: true,
      },
    }

    setContentTypes({
      ...contentTypes,
      [newContentType.uid]: contentTypeDef,
    })

    setSelectedContentType(newContentType.uid)
    setIsCreating(false)
    setNewContentType({
      uid: '',
      displayName: '',
      singularName: '',
      pluralName: '',
      description: '',
    })
  }

  const handleAddField = () => {
    if (!selectedContentType || !newField.name) {
      alert('Please enter a field name')
      return
    }

    const contentType = contentTypes[selectedContentType]
    const field: any = {
      type: newField.type,
      required: newField.required,
      unique: newField.unique,
    }

    if (newField.default) {
      field.default = newField.type === 'boolean' ? newField.default === 'true' : 
                      newField.type === 'integer' || newField.type === 'float' ? Number(newField.default) :
                      newField.default
    }

    // Add type-specific properties
    if (['string', 'text', 'richtext', 'email', 'password', 'uid'].includes(newField.type)) {
      if (newField.minLength) field.minLength = Number(newField.minLength)
      if (newField.maxLength) field.maxLength = Number(newField.maxLength)
    }

    if (['integer', 'biginteger', 'float', 'decimal'].includes(newField.type)) {
      if (newField.min) field.min = Number(newField.min)
      if (newField.max) field.max = Number(newField.max)
    }

    if (newField.type === 'enumeration') {
      field.values = newField.enumValues.split(',').map(v => v.trim()).filter(v => v)
      if (field.values.length === 0) {
        alert('Please provide enum values (comma-separated)')
        return
      }
    }

    if (newField.type === 'relation') {
      field.relationType = newField.relationType
      field.target = newField.target
      if (!field.target) {
        alert('Please specify the target content type')
        return
      }
    }

    const updatedContentType = {
      ...contentType,
      fields: {
        ...contentType.fields,
        [newField.name]: field,
      },
    }

    setContentTypes({
      ...contentTypes,
      [selectedContentType]: updatedContentType,
    })

    // Reset field form
    setNewField({
      name: '',
      type: 'string',
      required: false,
      unique: false,
      default: '',
      minLength: '',
      maxLength: '',
      min: '',
      max: '',
      enumValues: '',
      relationType: 'manyToOne',
      target: '',
    })
  }

  const handleDeleteField = (fieldName: string) => {
    if (!selectedContentType) return
    
    if (confirm(`Are you sure you want to delete the field "${fieldName}"?`)) {
      const contentType = contentTypes[selectedContentType]
      const { [fieldName]: _, ...remainingFields } = contentType.fields
      
      setContentTypes({
        ...contentTypes,
        [selectedContentType]: {
          ...contentType,
          fields: remainingFields,
        },
      })
    }
  }

  const handleDeleteContentType = (uid: string) => {
    if (confirm(`Are you sure you want to delete "${contentTypes[uid].displayName}"?`)) {
      const { [uid]: _, ...remainingTypes } = contentTypes
      setContentTypes(remainingTypes)
      if (selectedContentType === uid) {
        setSelectedContentType(null)
      }
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(contentTypes, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'definitions.json'

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const currentContentType = selectedContentType ? contentTypes[selectedContentType] : null

  return (
    <div className="container">
      <div className="ctb-header">
        <h1>Content Type Builder</h1>
        <div className="ctb-actions">
          <button onClick={() => setIsCreating(true)} className="btn-primary">
            + New Content Type
          </button>
          <button onClick={handleExport} className="btn-secondary" disabled={Object.keys(contentTypes).length === 0}>
            📥 Export JSON
          </button>
        </div>
      </div>

      <div className="ctb-layout">
        {/* Sidebar - Content Type List */}
        <div className="ctb-sidebar">
          <h3>Content Types</h3>
          <div className="ctb-list">
            {Object.entries(contentTypes).map(([uid, ct]) => (
              <div
                key={uid}
                className={`ctb-list-item ${selectedContentType === uid ? 'active' : ''}`}
                onClick={() => setSelectedContentType(uid)}
              >
                <div className="ctb-list-item-content">
                  <div className="ctb-list-item-name">{ct.displayName}</div>
                  <div className="ctb-list-item-meta">
                    {Object.keys(ct.fields).length} fields
                  </div>
                </div>
                <button
                  className="btn-icon-danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteContentType(uid)
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))}
            {Object.keys(contentTypes).length === 0 && (
              <p className="ctb-empty">No content types yet. Create one to get started!</p>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ctb-main">
          {isCreating && (
            <div className="ctb-card">
              <h2>Create New Content Type</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateContentType(); }} className="ctb-form">
                <div className="form-group">
                  <label>UID *</label>
                  <input
                    type="text"
                    value={newContentType.uid}
                    onChange={(e) => setNewContentType({ ...newContentType, uid: e.target.value })}
                    placeholder="api::article.article"
                    required
                  />
                  <small>Unique identifier (e.g., api::article.article)</small>
                </div>
                <div className="form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={newContentType.displayName}
                    onChange={(e) => setNewContentType({ ...newContentType, displayName: e.target.value })}
                    placeholder="Article"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Singular Name *</label>
                  <input
                    type="text"
                    value={newContentType.singularName}
                    onChange={(e) => setNewContentType({ ...newContentType, singularName: e.target.value })}
                    placeholder="article"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Plural Name *</label>
                  <input
                    type="text"
                    value={newContentType.pluralName}
                    onChange={(e) => setNewContentType({ ...newContentType, pluralName: e.target.value })}
                    placeholder="articles"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newContentType.description}
                    onChange={(e) => setNewContentType({ ...newContentType, description: e.target.value })}
                    placeholder="Brief description of this content type"
                    rows={3}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Create</button>
                  <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {!isCreating && currentContentType && (
            <>
              <div className="ctb-card">
                <div className="ctb-card-header">
                  <div>
                    <h2>{currentContentType.displayName}</h2>
                    <p className="ctb-meta">{currentContentType.description || currentContentType.uid}</p>
                  </div>
                </div>
                
                <div className="ctb-info-grid">
                  <div className="ctb-info-item">
                    <strong>Singular:</strong> {currentContentType.singularName}
                  </div>
                  <div className="ctb-info-item">
                    <strong>Plural:</strong> {currentContentType.pluralName}
                  </div>
                  <div className="ctb-info-item">
                    <strong>Timestamps:</strong> {currentContentType.options?.timestamps ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              <div className="ctb-card">
                <h3>Fields</h3>
                
                {/* Existing Fields */}
                <div className="ctb-fields-list">
                  {Object.entries(currentContentType.fields).map(([fieldName, field]) => (
                    <div key={fieldName} className="ctb-field-item">
                      <div className="ctb-field-info">
                        <div className="ctb-field-name">{fieldName}</div>
                        <div className="ctb-field-type">{field.type}</div>
                        <div className="ctb-field-props">
                          {field.required && <span className="badge badge-required">Required</span>}
                          {field.unique && <span className="badge badge-unique">Unique</span>}
                          {field.type === 'relation' && (
                            <span className="badge badge-relation">
                              {field.relationType} → {field.target}
                            </span>
                          )}
                          {field.type === 'enumeration' && (
                            <span className="badge badge-enum">
                              {field.values?.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDeleteField(fieldName)}
                        title="Delete field"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {Object.keys(currentContentType.fields).length === 0 && (
                    <p className="ctb-empty">No fields yet. Add your first field below!</p>
                  )}
                </div>

                {/* Add New Field Form */}
                <div className="ctb-add-field">
                  <h4>Add New Field</h4>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddField(); }} className="ctb-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Field Name *</label>
                        <input
                          type="text"
                          value={newField.name}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          placeholder="fieldName"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Type *</label>
                        <select
                          value={newField.type}
                          onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                          required
                        >
                          {fieldTypeOptions.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newField.required}
                            onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                          />
                          Required
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newField.unique}
                            onChange={(e) => setNewField({ ...newField, unique: e.target.checked })}
                          />
                          Unique
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Default Value</label>
                        <input
                          type="text"
                          value={newField.default}
                          onChange={(e) => setNewField({ ...newField, default: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {/* String field options */}
                    {['string', 'text', 'richtext', 'email', 'password', 'uid'].includes(newField.type) && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Min Length</label>
                          <input
                            type="number"
                            value={newField.minLength}
                            onChange={(e) => setNewField({ ...newField, minLength: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="form-group">
                          <label>Max Length</label>
                          <input
                            type="number"
                            value={newField.maxLength}
                            onChange={(e) => setNewField({ ...newField, maxLength: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    )}

                    {/* Number field options */}
                    {['integer', 'biginteger', 'float', 'decimal'].includes(newField.type) && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Min Value</label>
                          <input
                            type="number"
                            value={newField.min}
                            onChange={(e) => setNewField({ ...newField, min: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="form-group">
                          <label>Max Value</label>
                          <input
                            type="number"
                            value={newField.max}
                            onChange={(e) => setNewField({ ...newField, max: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    )}

                    {/* Enumeration field options */}
                    {newField.type === 'enumeration' && (
                      <div className="form-group">
                        <label>Enum Values *</label>
                        <input
                          type="text"
                          value={newField.enumValues}
                          onChange={(e) => setNewField({ ...newField, enumValues: e.target.value })}
                          placeholder="value1, value2, value3"
                          required
                        />
                        <small>Comma-separated values</small>
                      </div>
                    )}

                    {/* Relation field options */}
                    {newField.type === 'relation' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Relation Type *</label>
                          <select
                            value={newField.relationType}
                            onChange={(e) => setNewField({ ...newField, relationType: e.target.value as RelationType })}
                            required
                          >
                            {relationTypeOptions.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Target Content Type *</label>
                          <select
                            value={newField.target}
                            onChange={(e) => setNewField({ ...newField, target: e.target.value })}
                            required
                          >
                            <option value="">Select target...</option>
                            {Object.keys(contentTypes).map((uid) => (
                              <option key={uid} value={uid}>{contentTypes[uid].displayName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn-primary">+ Add Field</button>
                  </form>
                </div>
              </div>
            </>
          )}

          {!isCreating && !currentContentType && (
            <div className="ctb-empty-state">
              <div className="ctb-empty-state-icon">📦</div>
              <h2>No Content Type Selected</h2>
              <p>Select a content type from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
