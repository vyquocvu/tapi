/**
 * Content Type Watcher Vite Plugin
 * Automatically generates Prisma schema when content types change during development
 */

import { watch } from 'fs'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Plugin } from 'vite'

export function contentTypeWatcherPlugin(): Plugin {
  let watcher: ReturnType<typeof watch> | null = null
  let debounceTimer: NodeJS.Timeout | null = null
  const DEBOUNCE_DELAY = 500 // ms

  function generateSchema(projectRoot: string) {
    try {
      const contentTypesFile = join(projectRoot, 'content-types', 'definitions.json')
      const schemaPath = join(projectRoot, 'prisma', 'schema.prisma')

      // Check if file exists
      if (!existsSync(contentTypesFile)) {
        return
      }

      // Load content types
      const contentTypesData = readFileSync(contentTypesFile, 'utf-8')
      const contentTypes = JSON.parse(contentTypesData)

      // Check if empty
      if (Object.keys(contentTypes).length === 0) {
        return
      }

      // Import schema generator dynamically
      import('../../src/content-type-builder/schema-generator.js').then(({ prismaSchemaGenerator }) => {
        // Generate schema
        const result = prismaSchemaGenerator.generate(contentTypes)
        const enums = prismaSchemaGenerator.generateEnums(contentTypes)
        const fullSchema = result.prismaSchema + enums

        // Write to Prisma schema file
        writeFileSync(schemaPath, fullSchema, 'utf-8')

        console.log('✅ Prisma schema auto-generated!')
        console.log(`📦 Models: ${result.models.join(', ')}`)
      }).catch(error => {
        console.error('❌ Error generating schema:', error.message)
      })
    } catch (error: any) {
      console.error('❌ Error in content type watcher:', error.message)
    }
  }

  function handleFileChange(projectRoot: string, eventType: string, filename: string | null) {
    if (filename !== 'definitions.json') {
      return
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer
    debounceTimer = setTimeout(() => {
      console.log('📝 Content types changed, regenerating Prisma schema...')
      generateSchema(projectRoot)
    }, DEBOUNCE_DELAY)
  }

  return {
    name: 'content-type-watcher',
    configureServer(server) {
      const projectRoot = server.config.root

      console.log('👀 Content Type Watcher: Active')
      console.log('💡 Edit content-types/definitions.json to auto-generate Prisma schema')

      // Initial generation
      const contentTypesFile = join(projectRoot, 'content-types', 'definitions.json')
      if (existsSync(contentTypesFile)) {
        generateSchema(projectRoot)
      }

      // Watch for changes
      const contentTypesDir = join(projectRoot, 'content-types')
      watcher = watch(contentTypesDir, (eventType, filename) => {
        handleFileChange(projectRoot, eventType, filename)
      })

      // Cleanup on server close
      server.httpServer?.on('close', () => {
        if (watcher) {
          watcher.close()
          watcher = null
        }
      })
    },
    buildStart() {
      // Only run watcher in dev mode, not during build
      if (process.env.NODE_ENV === 'production') {
        return
      }
    },
  }
}
