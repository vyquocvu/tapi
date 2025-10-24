import { Input } from '@/components/ui/input'

interface FieldInputProps {
  field: any
  value: any
  onChange: (value: any) => void
}

export function FieldInput({ field, value, onChange }: FieldInputProps) {
  switch (field.type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      )

    case 'text':
    case 'richtext':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={4}
          className="w-full px-3 py-2 border rounded-md"
        />
      )

    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.type === 'integer' || field.type === 'biginteger' ? '1' : 'any'}
        />
      )

    case 'date':
      return (
        <Input
          type="date"
          value={value ? new Date(value).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )

    case 'time':
      return (
        <Input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )

    case 'enumeration':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select an option</option>
          {field.values?.map((val: string) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      )

    case 'relation':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          required={field.required}
          placeholder={`${field.target} ID`}
        />
      )

    default:
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.regex}
        />
      )
  }
}
