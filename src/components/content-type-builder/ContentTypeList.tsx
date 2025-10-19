import { useQuery } from '@tanstack/react-query'
import type { ContentTypeDefinition } from '../../content-type-builder/types'

interface ContentTypeListProps {
  onEdit: (contentType: ContentTypeDefinition) => void
  onDelete: (uid: string) => void
  onCreate: () => void
  error?: string
}

export function ContentTypeList({ onEdit, onDelete, onCreate, error }: ContentTypeListProps) {
  const { data: contentTypes, isLoading, error: queryError } = useQuery<Record<string, ContentTypeDefinition>>({
    queryKey: ['content-types'],
    queryFn: async () => {
      const response = await fetch('/api/content-types')
      if (!response.ok) throw new Error('Failed to fetch content types')
      return response.json()
    },
  })

  const displayError = error || queryError?.message

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={onCreate} 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          ➕ Create New Content Type
        </button>
      </div>

      {displayError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {displayError}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading content types...</p>
        </div>
      ) : contentTypes && Object.keys(contentTypes).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(contentTypes).map(([uid, contentType]) => (
            <div key={uid} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-foreground">{contentType.displayName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(contentType)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(uid)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-3">{uid}</p>
              {contentType.description && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{contentType.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-3 border-t">
                <span>📋 {Object.keys(contentType.fields).length} fields</span>
                {contentType.options?.timestamps && <span>🕐 Timestamps</span>}
                {contentType.options?.softDelete && <span>🗑️ Soft Delete</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No content types defined yet.</p>
          <p className="text-muted-foreground">Click "Create New Content Type" to get started!</p>
        </div>
      )}
    </div>
  )
}