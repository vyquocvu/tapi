import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2, Plus } from 'lucide-react'
import type { ContentTypeDefinition } from '../../content-type-builder/types'
import { queryKeys } from '../../lib/queryKeys'
import { fetchContentTypesRegistry } from '../../services/queryFunctions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ContentTypeListProps {
  onEdit: (contentType: ContentTypeDefinition) => void
  onDelete: (uid: string) => void
  onCreate: () => void
  error?: string
}

export function ContentTypeList({ onEdit, onDelete, onCreate, error }: ContentTypeListProps) {
  const { data: contentTypes, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.contentTypes.all,
    queryFn: fetchContentTypesRegistry,
  })
  console.log('Fetched content types:', contentTypes)
  const displayError = error || queryError?.message
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Content Type
        </Button>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading content types...</p>
          </CardContent>
        </Card>
      ) : contentTypes && Object.keys(contentTypes).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(contentTypes).map(([uid, contentType]) => (
            <Card key={uid} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contentType.displayName}</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{uid}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(contentType)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(uid)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {contentType.description && (
                  <CardDescription className="mt-2">{contentType.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    📋 {contentType.fields ? Object.keys(contentType.fields).length : 0} fields
                  </span>
                  {contentType.options?.timestamps && (
                    <span className="flex items-center gap-1">🕐 Timestamps</span>
                  )}
                  {contentType.options?.softDelete && (
                    <span className="flex items-center gap-1">🗑️ Soft Delete</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">No content types defined yet.</p>
              <p className="text-muted-foreground">Click "Create New Content Type" to get started!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}