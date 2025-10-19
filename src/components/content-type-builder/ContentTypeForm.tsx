import { ArrowLeft, Eye, Save, Plus } from 'lucide-react'
import type { FieldWithId, ContentTypeBuilderMode } from './types'
import { FieldEditor } from './FieldEditor'
import { generateUid, generateSingularName, generatePluralName } from './utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Content Type Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder="Article"
              />
              <p className="text-xs text-muted-foreground">Human-readable name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uid">
                UID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="uid"
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="api::article.article"
                disabled={mode === 'edit'}
              />
              <p className="text-xs text-muted-foreground">
                {mode === 'create' 
                  ? 'Auto-generated from display name (you can edit it)' 
                  : 'Unique identifier (cannot be changed after creation)'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="singularName">
                Singular Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="singularName"
                type="text"
                value={singularName}
                onChange={(e) => setSingularName(e.target.value)}
                placeholder="article"
              />
              <p className="text-xs text-muted-foreground">Singular form (lowercase)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pluralName">
                Plural Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pluralName"
                type="text"
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                placeholder="articles"
              />
              <p className="text-xs text-muted-foreground">Plural form (lowercase)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="timestamps">
                Enable timestamps (createdAt, updatedAt)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="softDelete"
                checked={softDelete}
                onChange={(e) => setSoftDelete(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="softDelete">
                Enable soft delete (deletedAt)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Fields</CardTitle>
            <Button onClick={onAddField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}