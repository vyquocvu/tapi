/**
 * API Server
 * 
 * Backend API server for the vstack application.
 * Provides authentication and other API endpoints.
 * 
 * To run this server:
 * 1. Ensure express and cors are installed: npm install express cors
 * 2. Run: node server/api.js
 * 3. The API will be available at http://localhost:3001
 */

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Mock user database (in production, use a real database)
const MOCK_USERS = {
  'demo@user.com': {
    id: 1,
    email: 'demo@user.com',
    password: 'password', // In production, this would be hashed
    name: 'Demo User',
  },
}

/**
 * POST /api/login
 * 
 * Authenticate a user with email and password
 * 
 * Request body:
 * {
 *   "email": "demo@user.com",
 *   "password": "password"
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "token": "mock-token",
 *   "user": {
 *     "id": 1,
 *     "email": "demo@user.com"
 *   }
 * }
 * 
 * Error response (401):
 * {
 *   "success": false,
 *   "error": "Invalid credentials"
 * }
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body

  // Validate request body
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    })
  }

  // Check if user exists and password matches
  const user = MOCK_USERS[email]
  if (user && user.password === password) {
    // In production: generate a real JWT token or session ID
    const token = `mock-token-${Date.now()}`
    
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  }

  // Invalid credentials
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials',
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`✅ API Server running at http://localhost:${PORT}`)
  console.log(`📝 Login endpoint: POST http://localhost:${PORT}/api/login`)
  console.log(`💡 Demo credentials: demo@user.com / password`)
})
