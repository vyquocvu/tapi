import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ContentTypeDefinition } from '../../content-type-builder/types'
import '../../styles/content-manager.css'

export const Route = createFileRoute('/content-manager/')({
  beforeLoad: async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/content-manager',
        },
      })
    }
  },
  component: ContentManagerComponent,
})

interface ContentEntry {
  id: number
  [key: string]: any
}

// Fetch all content types
async function fetchContentTypes(): Promise<ContentTypeDefinition[]> {
  const response = await fetch('/api/content-types', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch content types')
  }
  
  const result = await response.json()
  
  // Ensure we always return an array
  // result.data could be an object (ContentTypeRegistry) or an array
  if (!result.data) {
    return []
  }
  
  // If it's already an array, return it
  if (Array.isArray(result.data)) {
    return result.data
  }
  
  // If it's an object, convert to array
  return Object.values(result.data)
}

// Fetch entries for a content type
async function fetchEntries(contentType: string): Promise<ContentEntry[]> {
  const response = await fetch(`/api/content?contentType=${encodeURIComponent(contentType)}`, {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch entries')
  }
  
  const result = await response.json()
  return result.data || []
}

// Create entry
async function createEntry(contentType: string, data: Record<string, any>): Promise<ContentEntry> {
  const response = await fetch(`/api/content?contentType=${encodeURIComponent(contentType)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create entry')
  }
  
  const result = await response.json()
  return result.data
}

// Update entry
async function updateEntry(
  contentType: string,
  id: number,
  data: Record<string, any>
): Promise<ContentEntry> {
  const response = await fetch(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update entry')
  }
  
  const result = await response.json()
  return result.data
}

// Delete entry
async function deleteEntry(contentType: string, id: number): Promise<void> {
  const response = await fetch(
    `/api/content?contentType=${encodeURIComponent(contentType)}&id=${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete entry')
  }
}

type ViewMode = 'select' | 'list' | 'create' | 'edit'

function ContentManagerComponent() {
  const [mode, setMode] = useState<ViewMode>('select')
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [error, setError] = useState('')
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())

  const queryClient = useQueryClient()

  // Fetch content types
  const { data: contentTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: fetchContentTypes,
  })

  // Fetch entries for selected content type
  const {
    data: entries,
    isLoading: entriesLoading,
    error: entriesError,
  } = useQuery({
    queryKey: ['content-entries', selectedContentType],
    queryFn: () => fetchEntries(selectedContentType!),
    enabled: !!selectedContentType && mode === 'list',
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createEntry(selectedContentType!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-entries', selectedContentType] })
      setMode('list')
      setFormData({})
      setError('')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      updateEntry(selectedContentType!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-entries', selectedContentType] })
      setMode('list')
      setFormData({})
      setSelectedEntry(null)
      setError('')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEntry(selectedContentType!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-entries', selectedContentType] })
    },
  })

  const selectedContentTypeDef = Array.isArray(contentTypes) 
    ? contentTypes.find((ct) => ct.uid === selectedContentType)
    : undefined

  const handleSelectContentType = (uid: string) => {
    setSelectedContentType(uid)
    setMode('list')
    setError('')
    setSelectedEntries(new Set())
  }

  const handleCreate = () => {
    setFormData({})
    setSelectedEntry(null)
    setMode('create')
    setError('')
  }

  const handleEdit = (entry: ContentEntry) => {
    setSelectedEntry(entry)
    setFormData(entry)
    setMode('edit')
    setError('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }
    deleteMutation.mutate(id)
  }

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedEntries.size} entries?`)) {
      return
    }
    
    for (const id of selectedEntries) {
      await deleteEntry(selectedContentType!, id)
    }
    
    setSelectedEntries(new Set())
    queryClient.invalidateQueries({ queryKey: ['content-entries', selectedContentType] })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'create') {
      createMutation.mutate(formData)
    } else if (mode === 'edit' && selectedEntry) {
      updateMutation.mutate({ id: selectedEntry.id, data: formData })
    }
  }

  const toggleEntrySelection = (id: number) => {
    const newSelection = new Set(selectedEntries)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedEntries(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedEntries.size === entries?.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(entries?.map((e) => e.id) || []))
    }
  }

  const getStatusBadge = (entry: ContentEntry) => {
    if (entry.status) {
      const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800',
        published: 'bg-green-100 text-green-800',
        archived: 'bg-orange-100 text-orange-800',
      }
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[entry.status] || 'bg-gray-100 text-gray-800'}`}>
          {entry.status}
        </span>
      )
    }
    if (entry.published !== undefined) {
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${entry.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {entry.published ? 'Published' : 'Draft'}
        </span>
      )
    }
    return null
  }

  const renderFieldInput = (fieldName: string, field: any) => {
    const value = formData[fieldName] ?? field.default ?? ''

    const handleChange = (val: any) => {
      setFormData({ ...formData, [fieldName]: val })
    }

    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4"
          />
        )
      
      case 'text':
      case 'richtext':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            rows={4}
            className="w-full px-3 py-2 border rounded-md"
          />
        )
      
      case 'integer':
      case 'biginteger':
      case 'float':
      case 'decimal':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.type === 'integer' || field.type === 'biginteger' ? '1' : 'any'}
          />
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
          />
        )
      
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
          />
        )
      
      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
          />
        )
      
      case 'enumeration':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select an option</option>
            {field.values?.map((val: string) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        )
      
      case 'relation':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            required={field.required}
            placeholder={`${field.target} ID`}
          />
        )
      
      default:
        return (
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.regex}
          />
        )
    }
  }

  if (typesLoading) {
    return <div className="loading">Loading content types...</div>
  }

  return (
    <div className="content-manager">
      <div className="manager-header">
        <h1>Content Manager</h1>
        <p>Create, edit, and manage your content entries</p>
      </div>

      {/* Content Type Selection */}
      {mode === 'select' && (
        <div className="manager-content">
          <Card>
            <CardHeader>
              <CardTitle>Select Content Type</CardTitle>
              <CardDescription>Choose a content type to manage its entries</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(contentTypes) && contentTypes.length > 0 ? (
                <div className="content-type-grid">
                  {contentTypes.map((contentType) => (
                    <button
                      key={contentType.uid}
                      onClick={() => handleSelectContentType(contentType.uid)}
                      className="content-type-card"
                    >
                      <h3>{contentType.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {contentType.description || contentType.pluralName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {Object.keys(contentType.fields).length} fields
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No content types found.</p>
                  <p>Create content types in the Content Type Builder first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* List View */}
      {mode === 'list' && selectedContentTypeDef && (
        <div className="manager-content">
          <div className="manager-actions">
            <Button onClick={() => setMode('select')} variant="outline">
              ← Back to Content Types
            </Button>
            <div className="flex gap-2">
              {selectedEntries.size > 0 && (
                <Button onClick={handleBulkDelete} variant="destructive">
                  🗑️ Delete Selected ({selectedEntries.size})
                </Button>
              )}
              <Button onClick={handleCreate}>➕ Create New {selectedContentTypeDef.singularName}</Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{selectedContentTypeDef.displayName}</CardTitle>
              <CardDescription>{selectedContentTypeDef.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <p className="text-center text-muted-foreground">Loading entries...</p>
              ) : entriesError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error loading entries: {entriesError instanceof Error ? entriesError.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
              ) : entries && entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="entries-table">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedEntries.size === entries.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4"
                          />
                        </th>
                        <th>ID</th>
                        {Object.keys(selectedContentTypeDef.fields)
                          .filter((key) => !['password'].includes(selectedContentTypeDef.fields[key].type))
                          .slice(0, 4)
                          .map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        <th>Status</th>
                        {selectedContentTypeDef.options?.timestamps && (
                          <>
                            <th>Created</th>
                            <th>Updated</th>
                          </>
                        )}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id)}
                              onChange={() => toggleEntrySelection(entry.id)}
                              className="h-4 w-4"
                            />
                          </td>
                          <td>{entry.id}</td>
                          {Object.keys(selectedContentTypeDef.fields)
                            .filter((key) => !['password'].includes(selectedContentTypeDef.fields[key].type))
                            .slice(0, 4)
                            .map((key) => {
                              const value = entry[key]
                              let displayValue = value
                              
                              if (value === null || value === undefined) {
                                displayValue = '-'
                              } else if (typeof value === 'boolean') {
                                displayValue = value ? '✓' : '✗'
                              } else if (typeof value === 'object') {
                                displayValue = JSON.stringify(value).slice(0, 50)
                              } else if (typeof value === 'string' && value.length > 50) {
                                displayValue = value.slice(0, 50) + '...'
                              }
                              
                              return <td key={key}>{displayValue}</td>
                            })}
                          <td>{getStatusBadge(entry)}</td>
                          {selectedContentTypeDef.options?.timestamps && (
                            <>
                              <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-'}</td>
                              <td>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-'}</td>
                            </>
                          )}
                          <td>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEdit(entry)} size="sm" variant="outline">
                                ✏️ Edit
                              </Button>
                              <Button
                                onClick={() => handleDelete(entry.id)}
                                size="sm"
                                variant="destructive"
                              >
                                🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No entries found.</p>
                  <Button onClick={handleCreate} className="mt-4">
                    Create your first {selectedContentTypeDef.singularName}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Form */}
      {(mode === 'create' || mode === 'edit') && selectedContentTypeDef && (
        <div className="manager-content">
          <div className="manager-actions">
            <Button onClick={() => setMode('list')} variant="outline">
              ← Back to List
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'create' ? 'Create' : 'Edit'} {selectedContentTypeDef.singularName}
              </CardTitle>
              <CardDescription>
                {mode === 'create'
                  ? `Create a new ${selectedContentTypeDef.singularName} entry`
                  : `Edit ${selectedContentTypeDef.singularName} #${selectedEntry?.id}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {Object.entries(selectedContentTypeDef.fields)
                  .filter(([_, field]) => field.type !== 'relation' || mode === 'create')
                  .map(([fieldName, field]) => (
                    <div key={fieldName} className="form-group">
                      <Label htmlFor={fieldName}>
                        {fieldName}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFieldInput(fieldName, field)}
                      {field.unique && (
                        <small className="text-muted-foreground">Must be unique</small>
                      )}
                    </div>
                  ))}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : mode === 'create'
                      ? '➕ Create'
                      : '💾 Save'}
                  </Button>
                  <Button type="button" onClick={() => setMode('list')} variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
