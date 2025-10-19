import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentTypeBuilderMode, FieldWithId } from './types'
import { ContentTypeList } from './ContentTypeList'
import { ContentTypeForm } from './ContentTypeForm'
import { PreviewMode } from './PreviewMode'

export function ContentTypeBuilder() {
  const [mode, setMode] = useState<ContentTypeBuilderMode>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Form state
  const [uid, setUid] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [singularName, setSingularName] = useState('')
  const [pluralName, setPluralName] = useState('')
  const [description, setDescription] = useState('')
  const [timestamps, setTimestamps] = useState(true)
  const [softDelete, setSoftDelete] = useState(false)
  const [fields, setFields] = useState<FieldWithId[]>([])

  const queryClient = useQueryClient()

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (contentType: any) => {
      const response = await fetch('/api/content-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentType),
      })
      if (!response.ok) throw new Error('Failed to create content type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
      resetForm()
      setMode('list')
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create content type')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, contentType }: { id: string; contentType: any }) => {
      const response = await fetch(`/api/content-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentType),
      })
      if (!response.ok) throw new Error('Failed to update content type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
      resetForm()
      setMode('list')
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update content type')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content-types/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete content type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete content type')
    },
  })

  const resetForm = () => {
    setUid('')
    setDisplayName('')
    setSingularName('')
    setPluralName('')
    setDescription('')
    setTimestamps(true)
    setSoftDelete(false)
    setFields([])
    setError('')
    setEditingId(null)
  }

  const handleCreate = () => {
    resetForm()
    setMode('create')
  }

  const handleEdit = (contentType: any) => {
    setEditingId(contentType.id)
    setUid(contentType.uid)
    setDisplayName(contentType.displayName)
    setSingularName(contentType.singularName)
    setPluralName(contentType.pluralName)
    setDescription(contentType.description || '')
    setTimestamps(contentType.timestamps ?? true)
    setSoftDelete(contentType.softDelete ?? false)
    setFields(contentType.fields || [])
    setError('')
    setMode('edit')
  }

  const handleBack = () => {
    resetForm()
    setMode('list')
  }

  const handlePreview = () => {
    setMode('preview')
  }

  const handleEditFromPreview = () => {
    setMode(editingId ? 'edit' : 'create')
  }

  const handleSave = () => {
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }
    if (!uid.trim()) {
      setError('UID is required')
      return
    }
    if (!singularName.trim()) {
      setError('Singular name is required')
      return
    }
    if (!pluralName.trim()) {
      setError('Plural name is required')
      return
    }

    const contentType = {
      uid,
      displayName,
      singularName,
      pluralName,
      description,
      timestamps,
      softDelete,
      fields,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, contentType })
    } else {
      createMutation.mutate(contentType)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content type?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAddField = () => {
    const newField: FieldWithId = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
      unique: false,
    }
    setFields([...fields, newField])
  }

  const handleFieldChange = (id: string, updates: Partial<FieldWithId>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ))
  }

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(field => field.id !== id))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

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

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (mode === 'list') {
    return (
      <ContentTypeList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        error={error}
      />
    )
  }

  if (mode === 'preview') {
    return (
      <PreviewMode
        uid={uid}
        displayName={displayName}
        singularName={singularName}
        pluralName={pluralName}
        description={description}
        timestamps={timestamps}
        softDelete={softDelete}
        fields={fields}
        onBack={handleBack}
        onEdit={handleEditFromPreview}
      />
    )
  }

  return (
    <ContentTypeForm
      mode={mode}
      uid={uid}
      setUid={setUid}
      displayName={displayName}
      setDisplayName={setDisplayName}
      singularName={singularName}
      setSingularName={setSingularName}
      pluralName={pluralName}
      setPluralName={setPluralName}
      description={description}
      setDescription={setDescription}
      timestamps={timestamps}
      setTimestamps={setTimestamps}
      softDelete={softDelete}
      setSoftDelete={setSoftDelete}
      fields={fields}
      setFields={setFields}
      draggedIndex={draggedIndex}
      error={error}
      onBack={handleBack}
      onPreview={handlePreview}
      onSave={handleSave}
      onAddField={handleAddField}
      onFieldChange={handleFieldChange}
      onRemoveField={handleRemoveField}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    />
  )
}