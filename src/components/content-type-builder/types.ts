import type { FieldType } from '../../content-type-builder/types'

export type FieldWithId = {
  id: string
  name: string
  type: FieldType
  required?: boolean
  unique?: boolean
  default?: any
  validations?: any[]
  minLength?: number
  maxLength?: number
  regex?: string
  min?: number
  max?: number
  values?: string[]
  enum?: string[]
  relationType?: string
  target?: string
  mappedBy?: string
  inversedBy?: string
}

export type ContentTypeBuilderMode = 'list' | 'create' | 'edit' | 'preview'