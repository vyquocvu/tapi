#!/usr/bin/env node

/**
 * Database Migration Check Script
 * 
 * Checks if the database has been migrated by verifying:
 * 1. Database connection is available
 * 2. Prisma tables exist
 * 
 * Exits with:
 * - 0 if database is migrated and ready
 * - 1 if database needs migration or is not accessible
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file manually
try {
  const envPath = join(__dirname, '..', '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim()
    }
  })
} catch (err) {
  // .env file not found
  console.log('⚠️  No .env file found, checking DATABASE_URL from environment')
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not set - skipping database migration check')
  console.log('💡 Database setup will be performed during build')
  process.exit(1)
}

// Dynamically import Prisma Client
async function checkDatabaseMigration() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Check if Prisma Client is generated
      console.log('🔍 Checking database migration status...')
      
      // Try to query the User table (from our schema)
      await prisma.user.findFirst()
      
      console.log('✅ Database is migrated and ready')
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist') || error.message.includes('no such table')) {
        console.log('⚠️  Database tables not found - migration needed')
      } else {
        console.log('⚠️  Database not accessible or not migrated:', error.message)
      }
      await prisma.$disconnect()
      process.exit(1)
    }
  } catch (error) {
    if (error.message.includes('PrismaClient is unable to run') || error.message.includes('prisma generate')) {
      console.log('⚠️  Prisma Client not generated - running db:setup')
    } else {
      console.log('⚠️  Prisma Client error:', error.message)
    }
    process.exit(1)
  }
}

checkDatabaseMigration().catch((error) => {
  console.error('❌ Error checking database migration:', error.message)
  process.exit(1)
})
