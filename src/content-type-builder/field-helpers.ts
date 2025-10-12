/**
 * Field Helper Functions
 * Convenience functions for creating field definitions
 */

import {
  StringField,
  NumberField,
  BooleanField,
  DateField,
  EnumerationField,
  RelationField,
  JsonField,
  RelationType,
} from './types.js'

/**
 * Create a string field
 */
export function string(options?: {
  required?: boolean
  unique?: boolean
  default?: string
  minLength?: number
  maxLength?: number
}): StringField {
  return {
    type: 'string',
    ...options,
  }
}

/**
 * Create a text field (longer strings)
 */
export function text(options?: {
  required?: boolean
  default?: string
}): StringField {
  return {
    type: 'text',
    ...options,
  }
}

/**
 * Create a rich text field
 */
export function richtext(options?: {
  required?: boolean
}): StringField {
  return {
    type: 'richtext',
    ...options,
  }
}

/**
 * Create an email field
 */
export function email(options?: {
  required?: boolean
  unique?: boolean
}): StringField {
  return {
    type: 'email',
    ...options,
  }
}

/**
 * Create a password field
 */
export function password(options?: {
  required?: boolean
}): StringField {
  return {
    type: 'password',
    ...options,
  }
}

/**
 * Create a UID field (unique identifier)
 */
export function uid(options?: {
  required?: boolean
  unique?: boolean
}): StringField {
  return {
    type: 'uid',
    unique: true,
    ...options,
  }
}

/**
 * Create an integer field
 */
export function integer(options?: {
  required?: boolean
  unique?: boolean
  default?: number
  min?: number
  max?: number
}): NumberField {
  return {
    type: 'integer',
    ...options,
  }
}

/**
 * Create a big integer field
 */
export function biginteger(options?: {
  required?: boolean
  unique?: boolean
  default?: number
  min?: number
  max?: number
}): NumberField {
  return {
    type: 'biginteger',
    ...options,
  }
}

/**
 * Create a float field
 */
export function float(options?: {
  required?: boolean
  default?: number
  min?: number
  max?: number
}): NumberField {
  return {
    type: 'float',
    ...options,
  }
}

/**
 * Create a decimal field
 */
export function decimal(options?: {
  required?: boolean
  default?: number
  min?: number
  max?: number
}): NumberField {
  return {
    type: 'decimal',
    ...options,
  }
}

/**
 * Create a boolean field
 */
export function boolean(options?: {
  required?: boolean
  default?: boolean
}): BooleanField {
  return {
    type: 'boolean',
    ...options,
  }
}

/**
 * Create a date field (date only)
 */
export function date(options?: {
  required?: boolean
  default?: string
}): DateField {
  return {
    type: 'date',
    ...options,
  }
}

/**
 * Create a datetime field
 */
export function datetime(options?: {
  required?: boolean
  default?: string
}): DateField {
  return {
    type: 'datetime',
    ...options,
  }
}

/**
 * Create a time field
 */
export function time(options?: {
  required?: boolean
}): DateField {
  return {
    type: 'time',
    ...options,
  }
}

/**
 * Create an enumeration field
 */
export function enumeration(values: string[], options?: {
  required?: boolean
  default?: string
}): EnumerationField {
  return {
    type: 'enumeration',
    values,
    ...options,
  }
}

/**
 * Create a JSON field
 */
export function json(options?: {
  required?: boolean
}): JsonField {
  return {
    type: 'json',
    ...options,
  }
}

/**
 * Create a relation field
 */
export function relation(
  target: string,
  relationType: RelationType,
  options?: {
    required?: boolean
    mappedBy?: string
    inversedBy?: string
  }
): RelationField {
  return {
    type: 'relation',
    target,
    relationType,
    ...options,
  }
}

// Specific relation helpers
export function oneToOne(target: string, options?: {
  required?: boolean
}): RelationField {
  return relation(target, 'oneToOne', options)
}

export function oneToMany(target: string): RelationField {
  return relation(target, 'oneToMany')
}

export function manyToOne(target: string, options?: {
  required?: boolean
}): RelationField {
  return relation(target, 'manyToOne', options)
}

export function manyToMany(target: string): RelationField {
  return relation(target, 'manyToMany')
}
