import type { FieldWithId } from './types'
import { FIELD_TYPES } from './constants'
import type { FieldType } from '../../content-type-builder/types'

interface FieldEditorProps {
  field: FieldWithId
  index: number
  onFieldChange: (id: string, updates: Partial<FieldWithId>) => void
  onRemoveField: (id: string) => void
  draggedIndex: number | null
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

export function FieldEditor({
  field,
  index,
  onFieldChange,
  onRemoveField,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
}: FieldEditorProps) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm ${draggedIndex === index ? 'opacity-50' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="cursor-move text-muted-foreground">⋮⋮</span>
        <input
          type="text"
          value={field.name}
          onChange={(e) => onFieldChange(field.id, { name: e.target.value })}
          placeholder="Field name"
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          onClick={() => onRemoveField(field.id)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
          title="Remove field"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type</label>
            <select
              value={field.type}
              onChange={(e) => onFieldChange(field.id, { type: e.target.value as FieldType })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.type} value={ft.type}>
                  {ft.icon} {ft.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {FIELD_TYPES.find((ft) => ft.type === field.type)?.description}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${field.id}`}
                checked={field.required || false}
                onChange={(e) => onFieldChange(field.id, { required: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor={`required-${field.id}`} className="text-sm font-medium text-foreground">
                Required
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`unique-${field.id}`}
                checked={field.unique || false}
                onChange={(e) => onFieldChange(field.id, { unique: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor={`unique-${field.id}`} className="text-sm font-medium text-foreground">
                Unique
              </label>
            </div>
          </div>
        </div>

        {/* String field options */}
        {(field.type === 'string' || field.type === 'text' || field.type === 'email') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Min Length</label>
              <input
                type="number"
                value={field.minLength || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    minLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max Length</label>
              <input
                type="number"
                value={field.maxLength || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Number field options */}
        {(field.type === 'integer' || field.type === 'float' || field.type === 'decimal') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Min Value</label>
              <input
                type="number"
                value={field.min || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max Value</label>
              <input
                type="number"
                value={field.max || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Enumeration options */}
        {field.type === 'enumeration' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Values (comma-separated)</label>
            <input
              type="text"
              value={field.values?.join(', ') || ''}
              onChange={(e) =>
                onFieldChange(field.id, {
                  values: e.target.value.split(',').map((v) => v.trim()),
                })
              }
              placeholder="active, inactive, pending"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        {/* Relation options */}
        {field.type === 'relation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Relation Type</label>
              <select
                value={field.relationType || 'manyToOne'}
                onChange={(e) => onFieldChange(field.id, { relationType: e.target.value as any })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="oneToOne">One to One</option>
                <option value="oneToMany">One to Many</option>
                <option value="manyToOne">Many to One</option>
                <option value="manyToMany">Many to Many</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target</label>
              <input
                type="text"
                value={field.target || ''}
                onChange={(e) => onFieldChange(field.id, { target: e.target.value })}
                placeholder="api::user.user"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Default value */}
        {field.type === 'boolean' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Default Value</label>
            <select
              value={field.default === undefined ? '' : field.default.toString()}
              onChange={(e) =>
                onFieldChange(field.id, {
                  default: e.target.value === '' ? undefined : e.target.value === 'true',
                })
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">None</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        ) : field.type !== 'relation' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Default Value</label>
            <input
              type="text"
              value={field.default || ''}
              onChange={(e) => onFieldChange(field.id, { default: e.target.value || undefined })}
              placeholder="Optional default value"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}
      </div>
    </div>
  )
}