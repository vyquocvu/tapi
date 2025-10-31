# Middleware Development Guide

## Overview

Middleware in TAPI CMS provides a lightweight way to intercept and process HTTP requests. Middleware follows the Express-style pattern and integrates seamlessly with the plugin system.

## Middleware vs Plugins

**Use Middleware when:**
- You need simple request/response interception
- You want Express-style compatibility
- Your logic doesn't require lifecycle hooks
- You're porting existing Express middleware

**Use Plugins when:**
- You need complex lifecycle management
- You want to access plugin context and state
- You need error handling hooks
- You're building reusable, configurable extensions

## Creating Middleware

### Basic Middleware

```typescript
import type { Connect } from 'vite'

export const myMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
): Promise<void> => {
  try {
    // Your logic here
    console.log(`${req.method} ${req.url}`)
    
    // Call next to continue
    next()
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)))
  }
}
```

### Middleware with Configuration

```typescript
interface CorsOptions {
  origin: string
  methods: string[]
  allowedHeaders: string[]
}

export function createCorsMiddleware(options: CorsOptions) {
  return async (
    req: Connect.IncomingMessage,
    res: any,
    next: (error?: Error) => void
  ) => {
    res.setHeader('Access-Control-Allow-Origin', options.origin)
    res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '))
    res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '))
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }
    
    next()
  }
}

// Usage
const corsMiddleware = createCorsMiddleware({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

## Registering Middleware

### Simple Registration

```typescript
import { pluginManager } from '@/lib/plugin-system'
import { myMiddleware } from './middleware/my-middleware'

pluginManager.registerMiddleware({
  name: 'my-middleware',
  handler: myMiddleware,
  priority: 50, // Lower numbers execute first
})
```

### Route-Specific Middleware

```typescript
pluginManager.registerMiddleware({
  name: 'auth-middleware',
  handler: authMiddleware,
  priority: 10,
  routes: ['/api/protected/*'],
  excludeRoutes: ['/api/protected/public']
})
```

## Common Middleware Patterns

### Authentication Middleware

```typescript
export const authMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'No token provided' }))
    return
  }
  
  try {
    const user = await validateToken(token)
    // Attach user to request for downstream handlers
    (req as any).user = user
    next()
  } catch (error) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid token' }))
  }
}
```

### CORS Middleware

```typescript
export const corsMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  
  next()
}
```

### Request Logging Middleware

```typescript
export const loggingMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  const startTime = Date.now()
  const { method, url } = req
  
  // Log request
  console.log(`→ ${method} ${url}`)
  
  // Capture original end function
  const originalEnd = res.end
  
  // Override end to log response
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime
    console.log(`← ${method} ${url} - ${res.statusCode} (${duration}ms)`)
    
    // Call original end
    return originalEnd.apply(res, args)
  }
  
  next()
}
```

### Body Parser Middleware

```typescript
export const bodyParserMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  // Only parse for POST, PUT, PATCH
  if (!['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    next()
    return
  }
  
  // Check content type
  const contentType = req.headers['content-type']
  if (!contentType?.includes('application/json')) {
    next()
    return
  }
  
  try {
    const chunks: Buffer[] = []
    
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk))
    }
    
    const body = Buffer.concat(chunks).toString('utf-8')
    (req as any).body = JSON.parse(body)
    
    next()
  } catch (error) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
  }
}
```

### Rate Limiting Middleware

```typescript
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

export function createRateLimitMiddleware(options: {
  windowMs: number
  maxRequests: number
}) {
  return async (
    req: Connect.IncomingMessage,
    res: any,
    next: (error?: Error) => void
  ) => {
    const ip = req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    
    let record = rateLimitStore.get(ip)
    
    // Create or reset window
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs
      }
      rateLimitStore.set(ip, record)
      next()
      return
    }
    
    // Check limit
    record.count++
    
    if (record.count > options.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      
      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Retry-After', retryAfter.toString())
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', Math.floor(record.resetTime / 1000).toString())
      res.end(JSON.stringify({ error: 'Too many requests' }))
      return
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (options.maxRequests - record.count).toString())
    res.setHeader('X-RateLimit-Reset', Math.floor(record.resetTime / 1000).toString())
    
    next()
  }
}

// Usage
const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000, // 1 minute
  maxRequests: 100
})
```

### Request ID Middleware

```typescript
import { randomUUID } from 'crypto'

export const requestIdMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  // Use existing ID or generate new one
  const requestId = 
    req.headers['x-request-id'] as string ||
    randomUUID()
  
  // Attach to request
  (req as any).requestId = requestId
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId)
  
  next()
}
```

### Compression Middleware

```typescript
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

export const compressionMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  // Check if client accepts gzip
  const acceptEncoding = req.headers['accept-encoding'] || ''
  if (!acceptEncoding.includes('gzip')) {
    next()
    return
  }
  
  // Capture original end
  const originalEnd = res.end
  const originalWrite = res.write
  const chunks: Buffer[] = []
  
  // Override write to capture chunks
  res.write = function(chunk: any, ...args: any[]) {
    chunks.push(Buffer.from(chunk))
    return true
  }
  
  // Override end to compress
  res.end = async function(chunk: any, ...args: any[]) {
    if (chunk) {
      chunks.push(Buffer.from(chunk))
    }
    
    try {
      const body = Buffer.concat(chunks)
      const compressed = await gzipAsync(body)
      
      res.setHeader('Content-Encoding', 'gzip')
      res.setHeader('Content-Length', compressed.length)
      
      return originalEnd.call(res, compressed)
    } catch (error) {
      return originalEnd.call(res, Buffer.concat(chunks))
    }
  }
  
  next()
}
```

## Middleware Composition

Chain multiple middleware together:

```typescript
import { pluginManager } from '@/lib/plugin-system'

// Register in order of priority
pluginManager.registerMiddleware({
  name: 'cors',
  handler: corsMiddleware,
  priority: 1
})

pluginManager.registerMiddleware({
  name: 'request-id',
  handler: requestIdMiddleware,
  priority: 5
})

pluginManager.registerMiddleware({
  name: 'logging',
  handler: loggingMiddleware,
  priority: 10
})

pluginManager.registerMiddleware({
  name: 'body-parser',
  handler: bodyParserMiddleware,
  priority: 20
})

pluginManager.registerMiddleware({
  name: 'auth',
  handler: authMiddleware,
  priority: 30,
  routes: ['/api/*'],
  excludeRoutes: ['/api/login', '/api/health']
})
```

## Error Handling in Middleware

### Catching Errors

```typescript
export const errorHandlingMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  try {
    // Your logic
    await someAsyncOperation()
    next()
  } catch (error) {
    // Pass error to next middleware
    next(error instanceof Error ? error : new Error(String(error)))
  }
}
```

### Global Error Handler

```typescript
export const globalErrorHandler = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  // This middleware runs last and catches all errors
  const originalNext = next
  
  next = (error?: Error) => {
    if (error) {
      console.error('Unhandled error:', error)
      
      if (!res.writableEnded) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message,
          requestId: (req as any).requestId
        }))
      }
    } else {
      originalNext()
    }
  }
  
  next()
}
```

## Testing Middleware

```typescript
import { describe, it, expect } from 'your-test-framework'
import { myMiddleware } from './my-middleware'

describe('MyMiddleware', () => {
  it('should call next on success', async () => {
    const req = mockRequest()
    const res = mockResponse()
    let nextCalled = false
    
    const next = () => { nextCalled = true }
    
    await myMiddleware(req, res, next)
    
    expect(nextCalled).toBe(true)
  })
  
  it('should handle errors', async () => {
    const req = mockRequest()
    const res = mockResponse()
    let errorPassed: Error | undefined
    
    const next = (error?: Error) => { errorPassed = error }
    
    // Trigger error condition
    req.headers['content-type'] = 'invalid'
    
    await myMiddleware(req, res, next)
    
    expect(errorPassed).toBeDefined()
  })
})
```

## Best Practices

1. **Always call next()**: Unless you're short-circuiting the request
2. **Handle errors**: Wrap async code in try-catch
3. **Don't modify req/res after response sent**: Check `res.writableEnded`
4. **Use async/await**: For asynchronous operations
5. **Keep middleware focused**: One responsibility per middleware
6. **Order matters**: Register middleware in correct priority order
7. **Performance**: Avoid expensive operations in middleware
8. **Testing**: Test middleware in isolation

## Common Pitfalls

1. **Forgetting to call next()**: Request will hang
2. **Calling next() multiple times**: Causes undefined behavior
3. **Not handling async errors**: Use try-catch with async/await
4. **Modifying response after sent**: Check `res.writableEnded`
5. **Blocking operations**: Use async I/O

## Integration with Vite

Middleware integrates with Vite's development server:

```typescript
// vite.config.ts
import { pluginManager } from './src/lib/plugin-system'
import { corsMiddleware } from './src/middleware/cors'

export default defineConfig({
  plugins: [
    {
      name: 'api-middleware',
      configureServer(server) {
        // Register middleware
        pluginManager.registerMiddleware({
          name: 'cors',
          handler: corsMiddleware,
          priority: 1
        })
        
        // Apply to routes
        server.middlewares.use('/api', async (req, res, next) => {
          // Middleware chain is executed automatically
          // by the plugin system
        })
      }
    }
  ]
})
```

## Next Steps

- Review [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- Check out [middleware examples](../src/middleware)
- Explore [Plugin System Architecture](./PLUGIN_SYSTEM_ARCHITECTURE.md)
