import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { loginUser } = await import('../src/services/authService.js')
    const credentials = req.body
    console.log('[Express API /login] Attempting login for:', credentials.email)
    const result = await loginUser(credentials)

    if (result.success) {
      console.log('[Express API /login] Login successful for:', credentials.email)
    } else {
      console.warn('[Express API /login] Login failed for:', credentials.email, 'Error:', result.error)
    }

    res.status(result.success ? 200 : 401).json(result)
  } catch (error) {
    console.error('[Express API /login] Unexpected error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /api/posts
app.get('/api/posts', async (req, res) => {
  try {
    const { getAllPosts } = await import('../src/services/postService.js')
    console.log('[Express API /posts] Fetching all posts')
    const posts = await getAllPosts()
    console.log(`[Express API /posts] Successfully fetched ${posts.length} posts`)
    res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error('[Express API /posts] Error fetching posts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /api/me (protected route)
app.get('/api/me', async (req, res) => {
  try {
    const { createContext, requireAuth } = await import('../src/server/context.js')
    console.log('[Express API /me] Authenticating user')
    const context = createContext(req)
    const user = requireAuth(context)
    
    console.log('[Express API /me] User authenticated:', user.email)
    res.status(200).json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.warn('[Express API /me] Unauthorized access attempt')
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: error instanceof Error ? error.message : 'Authentication required',
    })
  }
})

// GET /api/health
app.get('/api/health', (req, res) => {
  console.log('[Express API /health] Health check requested')
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
  })
})

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))

  // SPA fallback - serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`)
  if (process.env.NODE_ENV === 'production') {
    console.log(`📁 Serving static files from: dist/`)
  }
})
