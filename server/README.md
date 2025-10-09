# API Server

This directory contains the backend API server for the vstack application.

## Overview

The API server is built with Express.js and provides authentication endpoints for the application.

## Running the Server

### Option 1: Run API server only
```bash
npm run dev:server
```

### Option 2: Run both frontend and API server
```bash
npm run dev:all
```

The API server will start on `http://localhost:3001`.

## Endpoints

### POST /api/login

Authenticate a user with email and password.

**Request:**
```json
{
  "email": "demo@user.com",
  "password": "password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "mock-token-1234567890",
  "user": {
    "id": 1,
    "email": "demo@user.com"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

### GET /api/health

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T08:00:00.000Z"
}
```

## Demo Credentials

For testing purposes, the following credentials are hardcoded:

- **Email:** `demo@user.com`
- **Password:** `password`

## Security Notes

⚠️ **Important:** This is a demo implementation for development purposes.

In a production environment, you should:

1. **Never store plaintext passwords** - Use bcrypt or similar hashing algorithms
2. **Use proper JWT tokens** - Implement real JWT token generation with expiration
3. **Add rate limiting** - Prevent brute force attacks
4. **Use HTTPS** - Encrypt data in transit
5. **Validate input** - Add comprehensive input validation and sanitization
6. **Add CSRF protection** - Implement CSRF tokens for state-changing operations
7. **Use a real database** - Replace the mock user object with a proper database (PostgreSQL, MongoDB, etc.)
8. **Implement refresh tokens** - For better security and user experience
9. **Add logging** - Log authentication attempts for security monitoring
10. **Environment variables** - Store sensitive configuration in environment variables

## Future Enhancements

- [ ] Connect to a real database (Prisma + PostgreSQL)
- [ ] Implement JWT token generation and validation
- [ ] Add password hashing with bcrypt
- [ ] Add user registration endpoint
- [ ] Add password reset functionality
- [ ] Implement session management
- [ ] Add role-based access control (RBAC)
- [ ] Add API rate limiting
- [ ] Add comprehensive error handling
- [ ] Add request logging
