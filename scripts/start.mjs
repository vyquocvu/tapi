#!/usr/bin/env node

/**
 * Runtime Starter Script
 * 
 * Starts the application based on the RUNTIME environment variable.
 * Set RUNTIME in your .env file or environment to one of:
 * - "dev" or "development" - Vite development server (default)
 * - "node" or "nodejs" - Express production server
 * - "vercel" - Vercel deployment (requires Vercel CLI)
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

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
  // .env file not found, that's ok
}

// Get runtime from environment variable (defaults to dev)
const runtime = (process.env.RUNTIME || 'dev').toLowerCase()

console.log(`🚀 Starting vStack with runtime: ${runtime}\n`)

let command, args, options

switch (runtime) {
  case 'node':
  case 'nodejs':
    console.log('📦 Starting Node.js Express server...')
    command = './node_modules/.bin/tsx'
    args = ['server/index.ts']
    options = {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
    }
    break

  case 'vercel':
    console.log('☁️  Starting Vercel deployment...')
    command = 'vercel'
    args = process.argv.slice(2) // Pass through any additional arguments
    options = {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    }
    break

  case 'dev':
  case 'development':
  default:
    console.log('🔧 Starting Vite development server...')
    command = './node_modules/.bin/vite'
    args = []
    options = {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    }
    break
}

const childProcess = spawn(command, args, options)

childProcess.on('error', (error) => {
  console.error(`❌ Failed to start ${runtime}:`, error.message)
  if (runtime === 'vercel') {
    console.log('\n💡 Make sure Vercel CLI is installed: npm install -g vercel')
  }
  process.exit(1)
})

childProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Process exited with code ${code}`)
  }
  process.exit(code)
})
