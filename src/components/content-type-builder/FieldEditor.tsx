import { GripVertical, X } from 'lucide-react'
import type { FieldWithId } from './types'
import { FIELD_TYPES } from './constants'
import type { FieldType } from '../../content-type-builder/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

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
    <Card
      className={`p-4 ${draggedIndex === index ? 'opacity-50' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3 mb-4">
        <GripVertical className="cursor-move text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          value={field.name}
          onChange={(e) => onFieldChange(field.id, { name: e.target.value })}
          placeholder="Field name"
          className="flex-1"
        />
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onRemoveField(field.id)}
          title="Remove field"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
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
              <Label htmlFor={`required-${field.id}`}>
                Required
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`unique-${field.id}`}
                checked={field.unique || false}
                onChange={(e) => onFieldChange(field.id, { unique: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={`unique-${field.id}`}>
                Unique
              </Label>
            </div>
          </div>
        </div>

        {/* String field options */}
        {(field.type === 'string' || field.type === 'text' || field.type === 'email') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Length</Label>
              <Input
                type="number"
                value={field.minLength || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    minLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Length</Label>
              <Input
                type="number"
                value={field.maxLength || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {/* Number field options */}
        {(field.type === 'integer' || field.type === 'float' || field.type === 'decimal') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Value</Label>
              <Input
                type="number"
                value={field.min || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Value</Label>
              <Input
                type="number"
                value={field.max || ''}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {/* Enumeration options */}
        {field.type === 'enumeration' && (
          <div className="space-y-2">
            <Label>Values (comma-separated)</Label>
            <Input
              type="text"
              value={field.values?.join(', ') || ''}
              onChange={(e) =>
                onFieldChange(field.id, {
                  values: e.target.value.split(',').map((v) => v.trim()),
                })
              }
              placeholder="active, inactive, pending"
            />
          </div>
        )}

        {/* Relation options */}
        {field.type === 'relation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Relation Type</Label>
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
              <Label>Target</Label>
              <Input
                type="text"
                value={field.target || ''}
                onChange={(e) => onFieldChange(field.id, { target: e.target.value })}
                placeholder="api::user.user"
              />
            </div>
          </div>
        )}

        {/* Default value */}
        {field.type === 'boolean' ? (
          <div className="space-y-2">
            <Label>Default Value</Label>
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
            <Label>Default Value</Label>
            <Input
              type="text"
              value={field.default || ''}
              onChange={(e) => onFieldChange(field.id, { default: e.target.value || undefined })}
              placeholder="Optional default value"
            />
          </div>
        )}
      </div>
    </Card>
  )
}