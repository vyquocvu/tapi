#!/usr/bin/env tsx

/**
 * Content Type Watcher
 * Automatically generates Prisma schema when content type definitions change
 * Similar to Strapi's auto-generation behavior
 */

import { watch } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { prismaSchemaGenerator } from '../../src/content-type-builder/schema-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')

// Paths
const contentTypesDir = join(projectRoot, 'content-types')
const contentTypesFile = join(contentTypesDir, 'definitions.json')
const schemaPath = join(projectRoot, 'prisma', 'schema.prisma')

// Debounce timer
let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_DELAY = 500 // ms

/**
 * Generate Prisma schema from content types
 */
function generateSchema() {
  try {
    // Check if file exists
    if (!existsSync(contentTypesFile)) {
      console.log('⚠️  No content types file found, waiting...')
      return
    }

    // Load content types
    const contentTypesData = readFileSync(contentTypesFile, 'utf-8')
    const contentTypes = JSON.parse(contentTypesData)

    // Check if empty
    if (Object.keys(contentTypes).length === 0) {
      console.log('⚠️  Content types file is empty, skipping generation')
      return
    }

    // Generate schema
    const result = prismaSchemaGenerator.generate(contentTypes)
    const enums = prismaSchemaGenerator.generateEnums(contentTypes)
    const fullSchema = result.prismaSchema + enums

    // Write to Prisma schema file
    writeFileSync(schemaPath, fullSchema, 'utf-8')

    console.log('✅ Prisma schema auto-generated!')
    console.log(`📦 Models: ${result.models.join(', ')}`)
  } catch (error: any) {
    console.error('❌ Error generating schema:', error.message)
  }
}

/**
 * Handle file changes with debouncing
 */
function handleFileChange(eventType: string, filename: string | null) {
  if (filename !== 'definitions.json') {
    return
  }

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Set new timer
  debounceTimer = setTimeout(() => {
    console.log('📝 Content types changed, regenerating schema...')
    generateSchema()
  }, DEBOUNCE_DELAY)
}

/**
 * Start watching for changes
 */
function startWatcher() {
  console.log('👀 Watching for content type changes...')
  console.log(`📂 Watching: ${contentTypesFile}`)
  console.log('💡 Edit content-types/definitions.json to auto-generate Prisma schema')
  console.log('')

  // Initial generation if file exists
  if (existsSync(contentTypesFile)) {
    console.log('🔨 Performing initial schema generation...')
    generateSchema()
    console.log('')
  }

  // Watch for changes
  const watcher = watch(contentTypesDir, (eventType, filename) => {
    handleFileChange(eventType, filename)
  })

  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping watcher...')
    watcher.close()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n👋 Stopping watcher...')
    watcher.close()
    process.exit(0)
  })
}

// Start the watcher
startWatcher()
