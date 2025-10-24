import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ContentEntry } from '@/services/queryFunctions'

interface ContentType {
  uid: string
  displayName: string
  singularName: string
  description?: string
  fields: Record<string, any>
  options?: {
    timestamps?: boolean
  }
}

interface EntriesListProps {
  contentType: ContentType
  entries: ContentEntry[] | undefined
  isLoading: boolean
  error: Error | null
  selectedEntries: Set<number>
  onBack: () => void
  onCreate: () => void
  onEdit: (entry: ContentEntry) => void
  onDelete: (id: number) => void
  onBulkDelete: () => void
  onToggleSelection: (id: number) => void
  onToggleSelectAll: () => void
}

export function EntriesList({
  contentType,
  entries,
  isLoading,
  error,
  selectedEntries,
  onBack,
  onCreate,
  onEdit,
  onDelete,
  onBulkDelete,
  onToggleSelection,
  onToggleSelectAll,
}: EntriesListProps) {
  const getStatusBadge = (entry: ContentEntry) => {
    if (entry.status) {
      const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
        draft: 'secondary',
        published: 'success',
        archived: 'warning',
      }
      return (
        <Badge variant={statusVariants[entry.status] || 'secondary'}>
          {entry.status}
        </Badge>
      )
    }
    if (entry.published !== undefined) {
      return (
        <Badge variant={entry.published ? 'success' : 'secondary'}>
          {entry.published ? 'Published' : 'Draft'}
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Content Types
        </Button>
        <div className="flex gap-2">
          {selectedEntries.size > 0 && (
            <Button onClick={onBulkDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedEntries.size})
            </Button>
          )}
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create New {contentType.singularName}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contentType.displayName}</CardTitle>
          <CardDescription>{contentType.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-6">Loading entries...</p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Error loading entries: {error instanceof Error ? error.message : 'Unknown error'}
              </AlertDescription>
            </Alert>
          ) : entries && entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="w-12 p-3 text-left text-sm font-semibold bg-muted">
                      <input
                        type="checkbox"
                        checked={selectedEntries.size === entries.length}
                        onChange={onToggleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-semibold bg-muted">ID</th>
                    {Object.keys(contentType.fields)
                      .filter((key) => !['password'].includes(contentType.fields[key].type))
                      .slice(0, 4)
                      .map((key) => (
                        <th key={key} className="p-3 text-left text-sm font-semibold bg-muted uppercase">
                          {key}
                        </th>
                      ))}
                    <th className="p-3 text-left text-sm font-semibold bg-muted">Status</th>
                    {contentType.options?.timestamps && (
                      <>
                        <th className="p-3 text-left text-sm font-semibold bg-muted">Created</th>
                        <th className="p-3 text-left text-sm font-semibold bg-muted">Updated</th>
                      </>
                    )}
                    <th className="p-3 text-left text-sm font-semibold bg-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => onToggleSelection(entry.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-3 text-sm">{entry.id}</td>
                      {Object.keys(contentType.fields)
                        .filter((key) => !['password'].includes(contentType.fields[key].type))
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

                          return (
                            <td key={key} className="p-3 text-sm">
                              {displayValue}
                            </td>
                          )
                        })}
                      <td className="p-3 text-sm">{getStatusBadge(entry)}</td>
                      {contentType.options?.timestamps && (
                        <>
                          <td className="p-3 text-sm">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3 text-sm">
                            {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-'}
                          </td>
                        </>
                      )}
                      <td className="p-3 text-sm">
                        <div className="flex gap-2">
                          <Button onClick={() => onEdit(entry)} size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => onDelete(entry.id)} size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No entries found.</p>
              <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first {contentType.singularName}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
