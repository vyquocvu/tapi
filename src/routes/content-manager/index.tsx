import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { queryKeys } from '@/lib/queryKeys'
import { requireAuth } from '@/lib/auth-utils'
import {
  fetchContentTypesArray,
  fetchContentEntries,
  createContentEntry,
  updateContentEntry,
  deleteContentEntry,
  type ContentEntry,
} from '@/services/queryFunctions'
import { ContentTypeSelector, EntriesList, EntryForm } from '@/components/content-manager'

export const Route = createFileRoute('/content-manager/')({
  beforeLoad: () => requireAuth('/content-manager'),
  component: ContentManagerComponent,
})

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
    queryKey: queryKeys.contentTypes.all,
    queryFn: fetchContentTypesArray,
  })

  // Fetch entries for selected content type
  const {
    data: entries,
    isLoading: entriesLoading,
    error: entriesError,
  } = useQuery({
    queryKey: queryKeys.contentEntries.byType(selectedContentType!),
    queryFn: () => fetchContentEntries(selectedContentType!),
    enabled: !!selectedContentType && mode === 'list',
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => createContentEntry(selectedContentType!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentEntries.byType(selectedContentType!) })
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
      updateContentEntry(selectedContentType!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentEntries.byType(selectedContentType!) })
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
    mutationFn: (id: number) => deleteContentEntry(selectedContentType!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentEntries.byType(selectedContentType!) })
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
      await deleteContentEntry(selectedContentType!, id)
    }
    
    setSelectedEntries(new Set())
    queryClient.invalidateQueries({ queryKey: queryKeys.contentEntries.byType(selectedContentType!) })
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

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value })
  }

  if (typesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading content types...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Content Manager</h1>
        <p className="mt-2 text-muted-foreground">Create, edit, and manage your content entries</p>
      </div>

      {/* Content Type Selection */}
      {mode === 'select' && (
        <ContentTypeSelector contentTypes={contentTypes} onSelect={handleSelectContentType} />
      )}

      {/* List View */}
      {mode === 'list' && selectedContentTypeDef && (
        <EntriesList
          contentType={selectedContentTypeDef}
          entries={entries}
          isLoading={entriesLoading}
          error={entriesError}
          selectedEntries={selectedEntries}
          onBack={() => setMode('select')}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onToggleSelection={toggleEntrySelection}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {/* Create/Edit Form */}
      {(mode === 'create' || mode === 'edit') && selectedContentTypeDef && (
        <EntryForm
          mode={mode}
          contentType={selectedContentTypeDef}
          entry={selectedEntry}
          formData={formData}
          error={error}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onBack={() => setMode('list')}
          onSubmit={handleSubmit}
          onFieldChange={handleFieldChange}
        />
      )}
    </div>
  )
}
