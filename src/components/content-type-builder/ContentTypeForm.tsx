import type { FieldWithId, ContentTypeBuilderMode } from './types'
import { FieldEditor } from './FieldEditor'
import { generateUid, generateSingularName, generatePluralName } from './utils'

interface ContentTypeFormProps {
  mode: ContentTypeBuilderMode
  uid: string
  setUid: (uid: string) => void
  displayName: string
  setDisplayName: (name: string) => void
  singularName: string
  setSingularName: (name: string) => void
  pluralName: string
  setPluralName: (name: string) => void
  description: string
  setDescription: (desc: string) => void
  timestamps: boolean
  setTimestamps: (enabled: boolean) => void
  softDelete: boolean
  setSoftDelete: (enabled: boolean) => void
  fields: {
    [key: string]: FieldWithId
  }
  setFields: (fields: { [key: string]: FieldWithId }) => void
  draggedIndex: number | null
  error: string
  onBack: () => void
  onPreview: () => void
  onSave: () => void
  onAddField: () => void
  onFieldChange: (id: string, updates: Partial<FieldWithId>) => void
  onRemoveField: (id: string) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

export function ContentTypeForm({
  mode,
  uid,
  setUid,
  displayName,
  setDisplayName,
  singularName,
  setSingularName,
  pluralName,
  setPluralName,
  description,
  setDescription,
  timestamps,
  setTimestamps,
  softDelete,
  setSoftDelete,
  fields,
  draggedIndex,
  error,
  onBack,
  onPreview,
  onSave,
  onAddField,
  onFieldChange,
  onRemoveField,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ContentTypeFormProps) {
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value)
    
    // Auto-generate UID, singular, and plural names only in create mode
    if (mode === 'create') {
      const generatedUid = generateUid(value)
      setUid(generatedUid)
      
      if (value) {
        const normalized = generateSingularName(value)
        setSingularName(normalized)
        setPluralName(generatePluralName(normalized))
      } else {
        setSingularName('')
        setPluralName('')
      }
    }
  }
  console.log('Rendering ContentTypeForm with fields:', fields);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack} 
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          ← Back to List
        </button>
        <div className="flex gap-2">
          <button 
            onClick={onPreview} 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            👁️ Preview
          </button>
          <button 
            onClick={onSave} 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            💾 Save
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">{error}</div>}

      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Content Type Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display Name <span className="text-destructive">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Article"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">Human-readable name</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="uid" className="text-sm font-medium text-foreground">
              UID <span className="text-destructive">*</span>
            </label>
            <input
              id="uid"
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="api::article.article"
              disabled={mode === 'edit'}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              {mode === 'create' 
                ? 'Auto-generated from display name (you can edit it)' 
                : 'Unique identifier (cannot be changed after creation)'
              }
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="singularName" className="text-sm font-medium text-foreground">
              Singular Name <span className="text-destructive">*</span>
            </label>
            <input
              id="singularName"
              type="text"
              value={singularName}
              onChange={(e) => setSingularName(e.target.value)}
              placeholder="article"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">Singular form (lowercase)</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="pluralName" className="text-sm font-medium text-foreground">
              Plural Name <span className="text-destructive">*</span>
            </label>
            <input
              id="pluralName"
              type="text"
              value={pluralName}
              onChange={(e) => setPluralName(e.target.value)}
              placeholder="articles"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">Plural form (lowercase)</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of this content type"
            rows={3}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="timestamps"
              checked={timestamps}
              onChange={(e) => setTimestamps(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="timestamps" className="text-sm font-medium text-foreground">
              Enable timestamps (createdAt, updatedAt)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="softDelete"
              checked={softDelete}
              onChange={(e) => setSoftDelete(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="softDelete" className="text-sm font-medium text-foreground">
              Enable soft delete (deletedAt)
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Fields</h2>
          <button 
            onClick={onAddField} 
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            ➕ Add Field
          </button>
        </div>

        {Object.keys(fields).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No fields added yet. Click "Add Field" to start!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(fields).map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={index}
                onFieldChange={onFieldChange}
                onRemoveField={onRemoveField}
                draggedIndex={draggedIndex}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}