import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentTypeBuilderMode, FieldWithId } from './types'
import { ContentTypeList } from './ContentTypeList'
import { ContentTypeForm } from './ContentTypeForm'
import { PreviewMode } from './PreviewMode'
import { createContentType, updateContentType, deleteContentType } from '@/services/queryFunctions'
import { invalidateDomain } from '@/services/queryKeys'

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
  const [fields, setFields] = useState<{ [key: string]: FieldWithId }>({})

  const queryClient = useQueryClient()

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createContentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.contentTypes() })
      resetForm()
      setMode('list')
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create content type')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, contentType }: { id: string; contentType: any }) => 
      updateContentType(id, contentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.contentTypes() })
      resetForm()
      setMode('list')
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update content type')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteContentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateDomain.contentTypes() })
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
    setFields({})
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
    setFields(contentType.fields || {})
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
      fields: Object.fromEntries(
        Object.entries(fields).map(([key, field]) => {
          // Remove the 'id' property from each field for the API
          const { id, ...fieldWithoutId } = field
          return [key, fieldWithoutId]
        })
      ),
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, contentType })
    } else {
      createMutation.mutate(contentType as any)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content type?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAddField = () => {
    const fieldId = `field_${Date.now()}`
    const newField: FieldWithId = {
      id: fieldId,
      name: '',
      type: 'string',
      required: false,
      unique: false,
    }
    setFields({ ...fields, [fieldId]: newField })
  }

  const handleFieldChange = (id: string, updates: Partial<FieldWithId>) => {
    if (fields[id]) {
      setFields({
        ...fields,
        [id]: { ...fields[id], ...updates }
      })
    }
  }

  const handleRemoveField = (id: string) => {
    const newFields = { ...fields }
    delete newFields[id]
    setFields(newFields)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const fieldsArray = Object.values(fields)
    const draggedField = fieldsArray[draggedIndex]
    fieldsArray.splice(draggedIndex, 1)
    fieldsArray.splice(index, 0, draggedField)
    
    // Convert back to object format
    const newFields: { [key: string]: FieldWithId } = {}
    fieldsArray.forEach(field => {
      newFields[field.id] = field
    })
    
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