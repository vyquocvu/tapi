/**
 * Server API
 * 
 * Backend API server with authentication endpoints.
 * 
 * To run this server:
 * 1. Run: node server/api.js
 * 2. The API will be available at http://localhost:3001
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory user storage (for demo purposes)
// In a real app, this would be a database
const users = [
  { email: 'demo@example.com', password: 'password123', name: 'Demo User' },
  { email: 'user@test.com', password: 'test123', name: 'Test User' }
];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }

  // Find user by email
  const user = users.find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // In a real app, you would:
  // 1. Generate a JWT token
  // 2. Set it in a secure httpOnly cookie
  // 3. Return the token to the client
  
  res.json({
    success: true,
    user: {
      email: user.email,
      name: user.name
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server API running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/login - Login with email and password');
  console.log('  GET  /api/health - Health check');
  console.log('\nDemo users:');
  console.log('  Email: demo@example.com, Password: password123');
  console.log('  Email: user@test.com, Password: test123');
});
