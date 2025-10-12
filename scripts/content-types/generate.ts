#!/usr/bin/env tsx

/**
 * Content Type Generator CLI
 * Generates Prisma schema from content type definitions
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prismaSchemaGenerator } from '../../src/content-type-builder/schema-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')

// Load content types
const contentTypesDir = join(projectRoot, 'content-types')
const contentTypesFile = join(contentTypesDir, 'definitions.json')

async function generate() {
  console.log('🔨 Generating Prisma schema from content types...')

  // Check if content types file exists
  if (!existsSync(contentTypesFile)) {
    console.error('❌ No content types found at:', contentTypesFile)
    console.log('💡 Create content types first by copying an example:')
    console.log('   cp content-types/examples/blog-example.json content-types/definitions.json')
    process.exit(1)
  }

  try {
    // Load content types
    const contentTypesData = readFileSync(contentTypesFile, 'utf-8')
    const contentTypes = JSON.parse(contentTypesData)

    // Generate schema
    const result = prismaSchemaGenerator.generate(contentTypes)

    // Generate enums
    const enums = prismaSchemaGenerator.generateEnums(contentTypes)

    // Combine schema with enums
    const fullSchema = result.prismaSchema + enums

    // Write to Prisma schema file
    const schemaPath = join(projectRoot, 'prisma', 'schema.prisma')
    writeFileSync(schemaPath, fullSchema, 'utf-8')

    console.log('✅ Prisma schema generated successfully!')
    console.log(`📄 Schema written to: ${schemaPath}`)
    console.log(`📦 Models generated: ${result.models.length}`)
    console.log(`   - ${result.models.join('\n   - ')}`)
    console.log('')
    console.log('Next steps:')
    console.log('  1. Review the generated schema')
    console.log('  2. Run: npm run prisma:migrate')
    console.log('  3. Run: npm run prisma:generate')
  } catch (error: any) {
    console.error('❌ Error generating schema:', error.message)
    console.error(error)
    process.exit(1)
  }
}

generate().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
