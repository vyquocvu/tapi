# Plugin Development Guide

## Getting Started

This guide will walk you through creating custom plugins for the TAPI CMS.

## Prerequisites

- Basic understanding of TypeScript
- Familiarity with Express-style middleware
- Understanding of async/await patterns

## Creating Your First Plugin

### Step 1: Choose a Template

Start with the plugin template:

```bash
cp src/plugins/templates/plugin-template.ts src/plugins/my-custom-plugin.ts
```

### Step 2: Define Your Plugin

```typescript
import type { Plugin, PluginContext, PluginConfig } from '@/lib/plugin-system/types'

interface MyPluginOptions {
  maxRetries?: number
  timeout?: number
}

export const myCustomPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My awesome custom plugin',

  onRegister: async (config: PluginConfig) => {
    const options = config.options as MyPluginOptions
    
    // Validate options
    if (options.timeout && options.timeout < 0) {
      throw new Error('Timeout must be positive')
    }
    
    console.log('[My Plugin] Registered with options:', options)
  },

  onBeforeRequest: async (context: PluginContext) => {
    // Your pre-processing logic
    console.log(`[My Plugin] Processing ${context.req.method} ${context.req.url}`)
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    // Your post-processing logic
    return response
  },

  onError: async (context: PluginContext, error: Error) => {
    // Your error handling logic
    console.error('[My Plugin] Error:', error.message)
  },
}
```

### Step 3: Register Your Plugin

```typescript
import { pluginManager } from '@/lib/plugin-system'
import { myCustomPlugin } from './plugins/my-custom-plugin'

// Register with default options
await pluginManager.register(myCustomPlugin)

// Or with custom configuration
await pluginManager.register(myCustomPlugin, {
  priority: 50,
  routes: ['/api/*'],
  excludeRoutes: ['/api/health'],
  options: {
    maxRetries: 3,
    timeout: 5000,
  }
})
```

## Plugin Lifecycle Hooks

### onRegister

Called once when the plugin is registered. Use for:
- Initialization
- Configuration validation
- Resource setup

```typescript
onRegister: async (config: PluginConfig) => {
  const options = config.options as MyPluginOptions
  
  // Validate configuration
  if (!options.apiKey) {
    throw new Error('API key is required')
  }
  
  // Initialize resources
  await initializeDatabase(options.dbUrl)
}
```

### onBeforeRequest

Called before request processing. Use for:
- Authentication/authorization
- Request validation
- Request transformation
- Short-circuiting requests

```typescript
onBeforeRequest: async (context: PluginContext) => {
  // Check authentication
  const token = context.req.headers.authorization
  if (!token) {
    context.res.statusCode = 401
    context.res.end(JSON.stringify({ error: 'Unauthorized' }))
    return false // Stop processing
  }
  
  // Store user in context for later use
  const user = await validateToken(token)
  context.state.set('authenticatedUser', user)
  
  return true // Continue processing
}
```

### onAfterRequest

Called after successful request processing. Use for:
- Response transformation
- Adding headers
- Logging
- Metrics collection

```typescript
onAfterRequest: async (context: PluginContext, response: any) => {
  // Add custom headers
  context.res.setHeader('X-Powered-By', 'My Plugin')
  
  // Transform response
  return {
    ...response,
    timestamp: new Date().toISOString(),
    version: '2.0',
  }
}
```

### onError

Called when an error occurs. Use for:
- Error logging
- Error transformation
- Error recovery
- Notifications

```typescript
onError: async (context: PluginContext, error: Error) => {
  // Log to external service
  await logToExternalService({
    error: error.message,
    stack: error.stack,
    requestId: context.requestId,
    url: context.req.url,
  })
  
  // Send notification for critical errors
  if (error.message.includes('CRITICAL')) {
    await sendAlert(error)
  }
}
```

### onUnregister

Called when plugin is unregistered. Use for:
- Cleanup
- Closing connections
- Saving state

```typescript
onUnregister: async () => {
  // Close database connection
  await closeDatabase()
  
  // Save metrics
  await saveMetrics()
  
  console.log('[My Plugin] Cleaned up')
}
```

## Working with Plugin Context

The plugin context provides access to request data and shared state:

```typescript
interface PluginContext {
  req: IncomingMessage      // HTTP request
  res: Response             // HTTP response
  state: Map<string, any>   // Shared state
  user?: any                // Authenticated user
  requestId: string         // Request ID
}
```

### Storing and Retrieving Data

```typescript
// Store data in onBeforeRequest
context.state.set('startTime', Date.now())
context.state.set('metadata', { version: '1.0', client: 'web' })

// Retrieve data in onAfterRequest
const startTime = context.state.get('startTime') as number
const duration = Date.now() - startTime

const metadata = context.state.get('metadata') as { version: string, client: string }
```

### Accessing Request Information

```typescript
const { req } = context

// HTTP method
const method = req.method // 'GET', 'POST', etc.

// URL and query params
const url = req.url // '/api/users?page=1'

// Headers
const authHeader = req.headers.authorization
const userAgent = req.headers['user-agent']

// Client IP
const ip = req.socket?.remoteAddress
```

### Modifying Response

```typescript
const { res } = context

// Set headers
res.setHeader('X-Custom-Header', 'value')
res.setHeader('Cache-Control', 'max-age=3600')

// Set status code
res.statusCode = 201

// Send response (short-circuit)
res.end(JSON.stringify({ message: 'Handled by plugin' }))
return false // Stop further processing
```

## Common Plugin Patterns

### Authentication Plugin

```typescript
export const authPlugin: Plugin = {
  name: 'auth-plugin',
  
  onBeforeRequest: async (context: PluginContext) => {
    // Skip auth for public routes
    if (context.req.url?.startsWith('/api/public')) {
      return true
    }
    
    // Check token
    const token = context.req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      context.res.statusCode = 401
      context.res.end(JSON.stringify({ error: 'No token provided' }))
      return false
    }
    
    // Validate token
    try {
      const user = await validateJWT(token)
      context.state.set('user', user)
      context.user = user
      return true
    } catch (error) {
      context.res.statusCode = 401
      context.res.end(JSON.stringify({ error: 'Invalid token' }))
      return false
    }
  }
}
```

### Caching Plugin

```typescript
const cache = new Map<string, { data: any, expires: number }>()

export const cachingPlugin: Plugin = {
  name: 'caching-plugin',
  
  onBeforeRequest: async (context: PluginContext) => {
    // Only cache GET requests
    if (context.req.method !== 'GET') return true
    
    const cacheKey = context.req.url || ''
    const cached = cache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      context.res.statusCode = 200
      context.res.setHeader('X-Cache', 'HIT')
      context.res.end(JSON.stringify(cached.data))
      return false // Short-circuit
    }
    
    context.state.set('cacheKey', cacheKey)
    return true
  },
  
  onAfterRequest: async (context: PluginContext, response: any) => {
    const cacheKey = context.state.get('cacheKey') as string
    if (cacheKey && context.req.method === 'GET') {
      cache.set(cacheKey, {
        data: response,
        expires: Date.now() + 60000, // 1 minute
      })
      context.res.setHeader('X-Cache', 'MISS')
    }
    return response
  }
}
```

### API Versioning Plugin

```typescript
export const versioningPlugin: Plugin = {
  name: 'api-versioning',
  
  onBeforeRequest: async (context: PluginContext) => {
    // Get version from header or URL
    const version = 
      context.req.headers['x-api-version'] ||
      context.req.url?.match(/\/v(\d+)\//)?.[1] ||
      '1'
    
    context.state.set('apiVersion', version)
    return true
  },
  
  onAfterRequest: async (context: PluginContext, response: any) => {
    const version = context.state.get('apiVersion')
    
    // Add version to response
    return {
      ...response,
      _meta: {
        version,
        deprecated: version === '1',
      }
    }
  }
}
```

### Request Validation Plugin

```typescript
export const validationPlugin: Plugin = {
  name: 'request-validation',
  
  onBeforeRequest: async (context: PluginContext) => {
    // Validate content-type for POST/PUT
    if (['POST', 'PUT'].includes(context.req.method || '')) {
      const contentType = context.req.headers['content-type']
      
      if (!contentType?.includes('application/json')) {
        context.res.statusCode = 415
        context.res.end(JSON.stringify({ 
          error: 'Content-Type must be application/json' 
        }))
        return false
      }
    }
    
    // Validate required headers
    const requiredHeaders = ['user-agent', 'accept']
    for (const header of requiredHeaders) {
      if (!context.req.headers[header]) {
        context.res.statusCode = 400
        context.res.end(JSON.stringify({ 
          error: `Missing required header: ${header}` 
        }))
        return false
      }
    }
    
    return true
  }
}
```

## Creating Middleware

For simpler use cases, create middleware instead of full plugins:

```typescript
import { MiddlewareConfig } from '@/lib/plugin-system/types'
import { Connect } from 'vite'

const corsMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  
  next()
}

export const corsMiddlewareConfig: MiddlewareConfig = {
  name: 'cors',
  handler: corsMiddleware,
  priority: 1, // Execute early
  routes: ['/api/*']
}
```

## Testing Plugins

### Unit Testing

```typescript
import { describe, it, expect, beforeEach } from 'your-test-framework'
import { myPlugin } from './my-plugin'

describe('MyPlugin', () => {
  let context: PluginContext
  
  beforeEach(() => {
    context = {
      req: mockRequest(),
      res: mockResponse(),
      state: new Map(),
      requestId: 'test-123'
    }
  })
  
  it('should process request correctly', async () => {
    const result = await myPlugin.onBeforeRequest?.(context)
    expect(result).toBe(true)
  })
  
  it('should transform response', async () => {
    const response = { data: 'test' }
    const result = await myPlugin.onAfterRequest?.(context, response)
    expect(result).toHaveProperty('timestamp')
  })
})
```

### Integration Testing

```typescript
import { pluginManager } from '@/lib/plugin-system'
import { myPlugin } from './my-plugin'

describe('Plugin Integration', () => {
  beforeEach(() => {
    pluginManager.clear()
  })
  
  it('should register and execute plugin', async () => {
    await pluginManager.register(myPlugin, {
      routes: ['/api/test']
    })
    
    const plugins = pluginManager.getPluginsForRoute('/api/test')
    expect(plugins).toHaveLength(1)
    expect(plugins[0].plugin.name).toBe('my-plugin')
  })
})
```

## Best Practices

1. **Error Handling**: Always wrap plugin code in try-catch
2. **Performance**: Avoid blocking operations in plugin hooks
3. **State Management**: Use context.state for sharing data between hooks
4. **Configuration**: Validate plugin options in onRegister
5. **Logging**: Use structured logging with requestId
6. **Documentation**: Document plugin behavior and options
7. **Testing**: Write unit and integration tests
8. **Versioning**: Use semantic versioning for plugins

## Common Pitfalls

1. **Modifying req/res after response sent**: Check `res.writableEnded`
2. **Forgetting to return**: Always return value from hooks
3. **Blocking operations**: Use async/await for I/O
4. **Memory leaks**: Clean up in onUnregister
5. **Race conditions**: Be careful with shared state

## Next Steps

- Review [Plugin System Architecture](./PLUGIN_SYSTEM_ARCHITECTURE.md)
- Explore [example plugins](../src/plugins/examples)
- Check out [middleware examples](./MIDDLEWARE_GUIDE.md)
- Read [API Reference](./PLUGIN_API_REFERENCE.md)
