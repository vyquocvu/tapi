import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db'

// Setup before all tests
beforeAll(() => {
  // Add any global setup here
})

// Cleanup after all tests
afterAll(() => {
  // Add any global cleanup here
})
