/**
 * Content Type Builder
 * Main class for defining and managing content types
 */

import {
  ContentTypeDefinition,
  ContentTypeRegistry,
  Field,
  ContentTypeOptions,
} from './types.js'

export class ContentTypeBuilder {
  private registry: ContentTypeRegistry = {}

  /**
   * Define a new content type
   */
  define(definition: ContentTypeDefinition): ContentTypeBuilder {
    // Validate the definition
    this.validateDefinition(definition)

    // Store in registry
    this.registry[definition.uid] = definition

    return this
  }

  /**
   * Get a content type definition by UID
   */
  get(uid: string): ContentTypeDefinition | undefined {
    return this.registry[uid]
  }

  /**
   * Get all content type definitions
   */
  getAll(): ContentTypeRegistry {
    return { ...this.registry }
  }

  /**
   * Remove a content type definition
   */
  remove(uid: string): boolean {
    if (this.registry[uid]) {
      delete this.registry[uid]
      return true
    }
    return false
  }

  /**
   * Clear all content type definitions
   */
  clear(): void {
    this.registry = {}
  }

  /**
   * Check if a content type exists
   */
  has(uid: string): boolean {
    return uid in this.registry
  }

  /**
   * Validate a content type definition
   */
  private validateDefinition(definition: ContentTypeDefinition): void {
    if (!definition.uid) {
      throw new Error('Content type must have a uid')
    }

    if (!definition.singularName) {
      throw new Error('Content type must have a singularName')
    }

    if (!definition.pluralName) {
      throw new Error('Content type must have a pluralName')
    }

    if (!definition.displayName) {
      throw new Error('Content type must have a displayName')
    }

    // Validate fields
    if (!definition.fields || Object.keys(definition.fields).length === 0) {
      throw new Error('Content type must have at least one field')
    }

    // Validate each field
    for (const [fieldName, field] of Object.entries(definition.fields)) {
      this.validateField(fieldName, field, definition.uid)
    }

    // Validate relation targets exist or will exist
    for (const field of Object.values(definition.fields)) {
      if (field.type === 'relation') {
        // We'll validate this during schema generation
        // to allow forward references
      }
    }
  }

  /**
   * Validate a single field
   */
  private validateField(fieldName: string, field: Field, contentTypeUid: string): void {
    if (!fieldName || fieldName.trim() === '') {
      throw new Error(`Field name cannot be empty in content type ${contentTypeUid}`)
    }

    if (!field.type) {
      throw new Error(`Field ${fieldName} in content type ${contentTypeUid} must have a type`)
    }

    // Validate enumeration values
    if (field.type === 'enumeration') {
      if (!field.values || field.values.length === 0) {
        throw new Error(
          `Enumeration field ${fieldName} in content type ${contentTypeUid} must have values`
        )
      }
    }

    // Validate relation fields
    if (field.type === 'relation') {
      if (!field.target) {
        throw new Error(
          `Relation field ${fieldName} in content type ${contentTypeUid} must have a target`
        )
      }
      if (!field.relationType) {
        throw new Error(
          `Relation field ${fieldName} in content type ${contentTypeUid} must have a relationType`
        )
      }
    }
  }

  /**
   * Builder pattern helper for creating content types
   */
  static create(uid: string): ContentTypeDefinitionBuilder {
    return new ContentTypeDefinitionBuilder(uid)
  }
}

/**
 * Fluent API for building content type definitions
 */
export class ContentTypeDefinitionBuilder {
  private definition: Partial<ContentTypeDefinition>

  constructor(uid: string) {
    this.definition = {
      uid,
      fields: {},
      options: {
        timestamps: true,
      },
    }
  }

  displayName(name: string): this {
    this.definition.displayName = name
    return this
  }

  singularName(name: string): this {
    this.definition.singularName = name
    return this
  }

  pluralName(name: string): this {
    this.definition.pluralName = name
    return this
  }

  description(desc: string): this {
    this.definition.description = desc
    return this
  }

  field(name: string, field: Field): this {
    if (!this.definition.fields) {
      this.definition.fields = {}
    }
    this.definition.fields[name] = field
    return this
  }

  options(options: ContentTypeOptions): this {
    this.definition.options = { ...this.definition.options, ...options }
    return this
  }

  timestamps(enabled: boolean): this {
    if (!this.definition.options) {
      this.definition.options = {}
    }
    this.definition.options.timestamps = enabled
    return this
  }

  softDelete(enabled: boolean): this {
    if (!this.definition.options) {
      this.definition.options = {}
    }
    this.definition.options.softDelete = enabled
    return this
  }

  tableName(name: string): this {
    if (!this.definition.options) {
      this.definition.options = {}
    }
    this.definition.options.tableName = name
    return this
  }

  build(): ContentTypeDefinition {
    if (!this.definition.uid) {
      throw new Error('Content type must have a uid')
    }
    if (!this.definition.displayName) {
      throw new Error('Content type must have a displayName')
    }
    if (!this.definition.singularName) {
      throw new Error('Content type must have a singularName')
    }
    if (!this.definition.pluralName) {
      throw new Error('Content type must have a pluralName')
    }
    if (!this.definition.fields || Object.keys(this.definition.fields).length === 0) {
      throw new Error('Content type must have at least one field')
    }

    return this.definition as ContentTypeDefinition
  }
}

// Export singleton instance
export const contentTypeBuilder = new ContentTypeBuilder()
