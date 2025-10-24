import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { FieldInput } from './FieldInput'
import type { ContentEntry } from '@/services/queryFunctions'

interface ContentType {
  uid: string
  displayName: string
  singularName: string
  description?: string
  fields: Record<string, any>
}

interface EntryFormProps {
  mode: 'create' | 'edit'
  contentType: ContentType
  entry: ContentEntry | null
  formData: Record<string, any>
  error: string
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
  onFieldChange: (fieldName: string, value: any) => void
}

export function EntryForm({
  mode,
  contentType,
  entry,
  formData,
  error,
  isSubmitting,
  onBack,
  onSubmit,
  onFieldChange,
}: EntryFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline">
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
            {mode === 'create' ? 'Create' : 'Edit'} {contentType.singularName}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? `Create a new ${contentType.singularName} entry`
              : `Edit ${contentType.singularName} #${entry?.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {Object.entries(contentType.fields)
              .filter(([_, field]) => field.type !== 'relation' || mode === 'create')
              .map(([fieldName, field]) => (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName}>
                    {fieldName}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <FieldInput
                    field={field}
                    value={formData[fieldName] ?? field.default ?? ''}
                    onChange={(value) => onFieldChange(fieldName, value)}
                  />
                  {field.unique && (
                    <small className="text-muted-foreground">Must be unique</small>
                  )}
                </div>
              ))}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
              </Button>
              <Button type="button" onClick={onBack} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
