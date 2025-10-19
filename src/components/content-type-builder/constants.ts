import type { FieldType } from '../../content-type-builder/types'

// Field type metadata with descriptions
export const FIELD_TYPES: Array<{
  type: FieldType
  label: string
  description: string
  icon: string
}> = [
  { type: 'string', label: 'String', description: 'Short text (max 255 chars)', icon: '📝' },
  { type: 'text', label: 'Text', description: 'Long text content', icon: '📄' },
  { type: 'richtext', label: 'Rich Text', description: 'Formatted text with HTML', icon: '📰' },
  { type: 'email', label: 'Email', description: 'Email address', icon: '📧' },
  { type: 'password', label: 'Password', description: 'Hashed password', icon: '🔒' },
  { type: 'integer', label: 'Integer', description: 'Whole number', icon: '🔢' },
  { type: 'biginteger', label: 'Big Integer', description: 'Large whole number', icon: '🔢' },
  { type: 'float', label: 'Float', description: 'Decimal number', icon: '🔢' },
  { type: 'decimal', label: 'Decimal', description: 'Precise decimal', icon: '🔢' },
  { type: 'boolean', label: 'Boolean', description: 'True or false', icon: '✓' },
  { type: 'date', label: 'Date', description: 'Date only', icon: '📅' },
  { type: 'datetime', label: 'Date & Time', description: 'Date with time', icon: '🕐' },
  { type: 'time', label: 'Time', description: 'Time only', icon: '⏰' },
  { type: 'json', label: 'JSON', description: 'JSON data', icon: '{}' },
  { type: 'enumeration', label: 'Enumeration', description: 'Select from options', icon: '📋' },
  { type: 'relation', label: 'Relation', description: 'Link to another type', icon: '🔗' },
  { type: 'uid', label: 'UID', description: 'Unique identifier', icon: '🆔' },
]