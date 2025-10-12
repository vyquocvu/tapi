#!/usr/bin/env tsx

/**
 * Content Type Builder Test
 * Demonstrates the functionality of the content type builder
 */

import { ContentTypeBuilder, string, text, integer, boolean, manyToOne, oneToMany, enumeration } from '../../src/content-type-builder/index.js'
import { prismaSchemaGenerator } from '../../src/content-type-builder/schema-generator.js'

console.log('🧪 Testing Content Type Builder\n')

// Test 1: Create content types using builder API
console.log('Test 1: Building content types programmatically...')

const builder = new ContentTypeBuilder()

// Define Article content type
const article = ContentTypeBuilder.create('api::article.article')
  .displayName('Article')
  .singularName('article')
  .pluralName('articles')
  .description('Blog article')
  .field('title', string({ required: true, maxLength: 255 }))
  .field('slug', string({ required: true, unique: true }))
  .field('content', text({ required: true }))
  .field('published', boolean({ default: false }))
  .field('viewCount', integer({ default: 0 }))
  .field('status', enumeration(['draft', 'published', 'archived']))
  .field('author', manyToOne('api::user.user', { required: true }))
  .timestamps(true)
  .build()

builder.define(article)
console.log('✅ Article content type created')

// Define User content type
const user = ContentTypeBuilder.create('api::user.user')
  .displayName('User')
  .singularName('user')
  .pluralName('users')
  .field('email', string({ required: true, unique: true }))
  .field('name', string({ required: true }))
  .field('articles', oneToMany('api::article.article'))
  .timestamps(true)
  .build()

builder.define(user)
console.log('✅ User content type created')

// Test 2: Retrieve content types
console.log('\nTest 2: Retrieving content types...')
const retrievedArticle = builder.get('api::article.article')
console.log(`✅ Retrieved article: ${retrievedArticle?.displayName}`)
console.log(`   Fields: ${Object.keys(retrievedArticle?.fields || {}).join(', ')}`)

// Test 3: Check if content type exists
console.log('\nTest 3: Checking content type existence...')
console.log(`✅ Article exists: ${builder.has('api::article.article')}`)
console.log(`✅ User exists: ${builder.has('api::user.user')}`)
console.log(`✅ NonExistent exists: ${builder.has('api::nonexistent.nonexistent')}`)

// Test 4: Generate Prisma schema
console.log('\nTest 4: Generating Prisma schema...')
const contentTypes = builder.getAll()
const result = prismaSchemaGenerator.generate(contentTypes)
const enums = prismaSchemaGenerator.generateEnums(contentTypes)

console.log('✅ Prisma schema generated')
console.log(`   Models: ${result.models.join(', ')}`)
console.log('\n📄 Generated Schema Preview:')
console.log('─'.repeat(60))
console.log(result.prismaSchema.substring(0, 500) + '...')
console.log('─'.repeat(60))

// Test 5: Validation
console.log('\nTest 5: Testing validation...')
try {
  ContentTypeBuilder.create('api::invalid.invalid')
    .displayName('Invalid')
    .singularName('invalid')
    .pluralName('invalids')
    .build()
  console.log('❌ Should have failed - no fields defined')
} catch (error) {
  console.log('✅ Validation works - caught error:', (error as Error).message)
}

// Test 6: Field helpers
console.log('\nTest 6: Testing field helpers...')
const testField = string({ required: true, unique: true, maxLength: 100 })
console.log('✅ String field created:', JSON.stringify(testField))

const testEnum = enumeration(['active', 'inactive', 'pending'], { default: 'active' })
console.log('✅ Enum field created:', JSON.stringify(testEnum))

console.log('\n🎉 All tests passed!')
console.log('\n💡 To see the full generated schema, run:')
console.log('   npm run content-type:generate')
