# Server API

Backend API server for the vstack application with authentication endpoints.

## Running the Server

To start the server:

```bash
node server/api.js
```

The API will be available at `http://localhost:3001`

## Available Endpoints

### POST /api/login

Authenticates a user with email and password.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "email": "demo@example.com",
    "name": "Demo User"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Error Response (400):**
```json
{
  "error": "Email and password are required"
}
```

### GET /api/health

Health check endpoint to verify the server is running.

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T07:38:22.000Z"
}
```

## Demo Users

The following demo users are available for testing:

| Email | Password | Name |
|-------|----------|------|
| demo@example.com | password123 | Demo User |
| user@test.com | test123 | Test User |

## Development with Vite

The Vite development server is configured to proxy `/api` requests to `http://localhost:3001` (see `vite.config.ts`). This means when running both the backend API server and the Vite dev server, the frontend can make requests to `/api/login` and they will be automatically proxied to the backend.

To run both servers:

1. Terminal 1: `node server/api.js`
2. Terminal 2: `npm run dev`

## Production Considerations

This is a demo server for development purposes. In a production environment, you should:

1. Use a real database instead of in-memory storage
2. Implement proper password hashing (bcrypt, argon2, etc.)
3. Use JWT tokens or session management for authentication
4. Add rate limiting to prevent brute-force attacks
5. Use HTTPS for secure communication
6. Implement proper CORS configuration
7. Add input validation and sanitization
8. Add logging and monitoring
