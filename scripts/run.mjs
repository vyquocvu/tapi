#!/usr/bin/env node

/**
 * Run Script - Choose Runtime Environment
 * 
 * This script allows you to easily run the application in different environments:
 * - nodejs: Run on Node.js server (Express)
 * - vercel: Deploy to Vercel serverless
 * - dev: Run development server (Vite)
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get the environment from command line arguments
const args = process.argv.slice(2)
const environment = args[0]

// Display usage if no environment is specified
if (!environment) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           vStack - Run Environment Selector                    ║
╚════════════════════════════════════════════════════════════════╝

Usage: npm run choose <environment>

Available Environments:
  
  📦 nodejs      - Run on Node.js Express server (production)
                   Best for: Traditional hosting, VPS, Docker
                   
  ☁️  vercel      - Deploy to Vercel serverless platform
                   Best for: Serverless deployment, auto-scaling
                   
  🔧 dev         - Run Vite development server
                   Best for: Local development with hot reload

Examples:
  npm run choose nodejs    # Run Node.js server
  npm run choose vercel    # Deploy to Vercel
  npm run choose dev       # Start dev server

For more details, see README.md
`)
  process.exit(0)
}

// Run the appropriate command based on the environment
switch (environment.toLowerCase()) {
  case 'nodejs':
  case 'node':
    console.log('\n🚀 Starting Node.js Express server...\n')
    console.log('Environment: Node.js')
    console.log('Server will start on port 3000 (or PORT env variable)\n')
    
    // Check if app is built
    const fs = await import('fs')
    const distExists = fs.existsSync(join(__dirname, '../dist'))
    
    if (!distExists) {
      console.log('⚠️  Build directory not found. Building application first...\n')
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
        cwd: join(__dirname, '..')
      })
      
      buildProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Build failed!')
          process.exit(code)
        }
        console.log('\n✅ Build complete! Starting server...\n')
        startNodeServer()
      })
    } else {
      startNodeServer()
    }
    break

  case 'vercel':
    console.log('\n☁️  Deploying to Vercel...\n')
    console.log('This will deploy your application to Vercel serverless platform.')
    console.log('Make sure you have:')
    console.log('  1. Vercel CLI installed (npm install -g vercel)')
    console.log('  2. Environment variables configured in Vercel dashboard')
    console.log('  3. Database URL pointing to PostgreSQL (not SQLite)\n')
    
    const vercelProcess = spawn('vercel', args.slice(1), {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    })
    
    vercelProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Deployment complete!')
        console.log('📝 Remember to run database migrations:')
        console.log('   npx prisma migrate deploy')
      } else {
        console.error('\n❌ Deployment failed!')
        console.log('💡 Make sure Vercel CLI is installed: npm install -g vercel')
      }
      process.exit(code)
    })
    break

  case 'dev':
  case 'development':
    console.log('\n🔧 Starting development server...\n')
    console.log('Environment: Development (Vite)')
    console.log('Server will start on http://localhost:5173\n')
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    })
    
    devProcess.on('close', (code) => {
      process.exit(code)
    })
    break

  default:
    console.error(`\n❌ Unknown environment: ${environment}`)
    console.log('\nValid options: nodejs, vercel, dev')
    console.log('Run "npm run choose" for usage information\n')
    process.exit(1)
}

function startNodeServer() {
  const serverProcess = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' }
  })
  
  serverProcess.on('close', (code) => {
    process.exit(code)
  })
}
