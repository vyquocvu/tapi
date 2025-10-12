/**
 * Content Type Builder Types
 * Inspired by Strapi's content type builder
 */

export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'email'
  | 'password'
  | 'integer'
  | 'biginteger'
  | 'float'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'enumeration'
  | 'relation'
  | 'uid'

export type RelationType =
  | 'oneToOne'
  | 'oneToMany'
  | 'manyToOne'
  | 'manyToMany'

export interface ValidationRule {
  type: 'required' | 'unique' | 'min' | 'max' | 'regex' | 'email' | 'url'
  value?: string | number | boolean
  message?: string
}

export interface BaseField {
  type: FieldType
  required?: boolean
  unique?: boolean
  default?: any
  validations?: ValidationRule[]
}

export interface StringField extends BaseField {
  type: 'string' | 'text' | 'richtext' | 'email' | 'password' | 'uid'
  minLength?: number
  maxLength?: number
  regex?: string
}

export interface NumberField extends BaseField {
  type: 'integer' | 'biginteger' | 'float' | 'decimal'
  min?: number
  max?: number
}

export interface BooleanField extends BaseField {
  type: 'boolean'
}

export interface DateField extends BaseField {
  type: 'date' | 'datetime' | 'time'
}

export interface EnumerationField extends BaseField {
  type: 'enumeration'
  values: string[]
}

export interface RelationField extends BaseField {
  type: 'relation'
  relationType: RelationType
  target: string // Target model name
  mappedBy?: string // For bidirectional relations
  inversedBy?: string // For bidirectional relations
}

export interface JsonField extends BaseField {
  type: 'json'
}

export type Field =
  | StringField
  | NumberField
  | BooleanField
  | DateField
  | EnumerationField
  | RelationField
  | JsonField

export interface ContentTypeOptions {
  timestamps?: boolean // Add createdAt/updatedAt
  softDelete?: boolean // Add deletedAt
  tableName?: string // Custom table name
  description?: string
}

export interface ContentTypeDefinition {
  uid: string // Unique identifier for the content type
  displayName: string // Human-readable name
  singularName: string // Singular form (e.g., "post")
  pluralName: string // Plural form (e.g., "posts")
  description?: string
  fields: Record<string, Field>
  options?: ContentTypeOptions
}

export interface ContentTypeRegistry {
  [uid: string]: ContentTypeDefinition
}

export interface MigrationRecord {
  id: string
  name: string
  timestamp: number
  contentTypes: string[] // UIDs of affected content types
  up: string // Migration SQL/Prisma operations
  down: string // Rollback SQL/Prisma operations
  applied: boolean
  appliedAt?: Date
}

export interface GeneratedSchema {
  prismaSchema: string
  models: string[]
  migrations: MigrationRecord[]
}
