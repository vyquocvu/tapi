# Plugin System API Reference

## Core Types

### Plugin

```typescript
interface Plugin {
  name: string
  version?: string
  description?: string
  
  onRegister?: (config: PluginConfig) => void | Promise<void>
  onBeforeRequest?: (context: PluginContext) => boolean | Promise<boolean> | void | Promise<void>
  onAfterRequest?: (context: PluginContext, response: any) => any | Promise<any>
  onError?: (context: PluginContext, error: Error) => void | Promise<void>
  onUnregister?: () => void | Promise<void>
}
```

### PluginConfig

```typescript
interface PluginConfig {
  name: string
  enabled?: boolean
  priority?: number // Lower numbers execute first (default: 100)
  routes?: string[] // Route patterns to apply plugin to
  excludeRoutes?: string[] // Route patterns to exclude
  options?: Record<string, any> // Plugin-specific options
}
```

### PluginContext

```typescript
interface PluginContext {
  req: Connect.IncomingMessage
  res: any
  state: Map<string, any> // Shared state between plugins
  user?: any // Authenticated user if available
  requestId: string // Unique request identifier
}
```

### MiddlewareFunction

```typescript
type MiddlewareFunction = (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => void | Promise<void>
```

### MiddlewareConfig

```typescript
interface MiddlewareConfig {
  name: string
  handler: MiddlewareFunction
  priority?: number // Lower numbers execute first (default: 100)
  routes?: string[] // Route patterns to apply middleware to
  excludeRoutes?: string[] // Route patterns to exclude
}
```

## Plugin Manager

### Methods

#### register

Register a new plugin.

```typescript
async register(plugin: Plugin, config?: Partial<PluginConfig>): Promise<void>
```

**Parameters:**
- `plugin`: Plugin to register
- `config`: Optional plugin configuration

**Throws:**
- Error if plugin already registered
- Error if plugin.onRegister throws

**Example:**
```typescript
await pluginManager.register(myPlugin, {
  priority: 50,
  routes: ['/api/*'],
  options: { timeout: 5000 }
})
```

#### unregister

Unregister a plugin.

```typescript
async unregister(pluginName: string): Promise<void>
```

**Parameters:**
- `pluginName`: Name of plugin to unregister

**Throws:**
- Error if plugin not registered

**Example:**
```typescript
await pluginManager.unregister('my-plugin')
```

#### registerMiddleware

Register middleware.

```typescript
registerMiddleware(config: MiddlewareConfig): void
```

**Parameters:**
- `config`: Middleware configuration

**Throws:**
- Error if middleware already registered

**Example:**
```typescript
pluginManager.registerMiddleware({
  name: 'cors',
  handler: corsMiddleware,
  priority: 10,
  routes: ['/api/*']
})
```

#### unregisterMiddleware

Unregister middleware.

```typescript
unregisterMiddleware(name: string): void
```

**Parameters:**
- `name`: Name of middleware to unregister

**Throws:**
- Error if middleware not registered

**Example:**
```typescript
pluginManager.unregisterMiddleware('cors')
```

#### getPlugins

Get all registered plugins.

```typescript
getPlugins(): Array<{ plugin: Plugin; config: PluginConfig }>
```

**Returns:**
Array of plugin entries

**Example:**
```typescript
const plugins = pluginManager.getPlugins()
console.log('Registered plugins:', plugins.map(p => p.plugin.name))
```

#### getPluginsForRoute

Get plugins for a specific route.

```typescript
getPluginsForRoute(route: string): Array<{ plugin: Plugin; config: PluginConfig }>
```

**Parameters:**
- `route`: Route path (e.g., '/api/users')

**Returns:**
Array of plugins applicable to the route, sorted by priority

**Example:**
```typescript
const plugins = pluginManager.getPluginsForRoute('/api/users')
```

#### getMiddleware

Get all registered middleware.

```typescript
getMiddleware(): MiddlewareConfig[]
```

**Returns:**
Array of middleware configurations

**Example:**
```typescript
const middleware = pluginManager.getMiddleware()
```

#### getMiddlewareForRoute

Get middleware for a specific route.

```typescript
getMiddlewareForRoute(route: string): MiddlewareConfig[]
```

**Parameters:**
- `route`: Route path

**Returns:**
Array of middleware applicable to the route

**Example:**
```typescript
const middleware = pluginManager.getMiddlewareForRoute('/api/users')
```

#### getPlugin

Get a plugin by name.

```typescript
getPlugin(name: string): { plugin: Plugin; config: PluginConfig } | undefined
```

**Parameters:**
- `name`: Plugin name

**Returns:**
Plugin entry or undefined if not found

**Example:**
```typescript
const entry = pluginManager.getPlugin('my-plugin')
if (entry) {
  console.log('Plugin found:', entry.plugin.version)
}
```

#### hasPlugin

Check if a plugin is registered.

```typescript
hasPlugin(name: string): boolean
```

**Parameters:**
- `name`: Plugin name

**Returns:**
True if plugin is registered

**Example:**
```typescript
if (pluginManager.hasPlugin('my-plugin')) {
  console.log('Plugin is registered')
}
```

#### clear

Clear all plugins and middleware.

```typescript
clear(): void
```

**Example:**
```typescript
pluginManager.clear()
```

## Plugin Executor

### executeMiddleware

Execute middleware chain for a request.

```typescript
async executeMiddleware(
  req: Connect.IncomingMessage,
  res: any
): Promise<{ success: boolean; error?: Error }>
```

**Parameters:**
- `req`: HTTP request
- `res`: HTTP response

**Returns:**
Execution result

**Example:**
```typescript
const result = await executeMiddleware(req, res)
if (!result.success) {
  console.error('Middleware error:', result.error)
}
```

### executeBeforeRequest

Execute onBeforeRequest hooks for all applicable plugins.

```typescript
async executeBeforeRequest(
  req: Connect.IncomingMessage,
  res: any,
  user?: any
): Promise<PluginExecutionResult>
```

**Parameters:**
- `req`: HTTP request
- `res`: HTTP response
- `user`: Optional authenticated user

**Returns:**
Execution result with shouldContinue flag

**Example:**
```typescript
const result = await executeBeforeRequest(req, res, user)
if (!result.shouldContinue) {
  return // Request was short-circuited
}
```

### executeAfterRequest

Execute onAfterRequest hooks for all applicable plugins.

```typescript
async executeAfterRequest(
  req: Connect.IncomingMessage,
  res: any,
  response: any,
  user?: any
): Promise<any>
```

**Parameters:**
- `req`: HTTP request
- `res`: HTTP response
- `response`: Response data
- `user`: Optional authenticated user

**Returns:**
Modified response

**Example:**
```typescript
const modifiedResponse = await executeAfterRequest(req, res, response, user)
res.end(JSON.stringify(modifiedResponse))
```

### executeOnError

Execute onError hooks for all applicable plugins.

```typescript
async executeOnError(
  req: Connect.IncomingMessage,
  res: any,
  error: Error,
  user?: any
): Promise<void>
```

**Parameters:**
- `req`: HTTP request
- `res`: HTTP response
- `error`: Error that occurred
- `user`: Optional authenticated user

**Example:**
```typescript
try {
  // Handle request
} catch (error) {
  await executeOnError(req, res, error, user)
  // Send error response
}
```

### withPlugins

Wrap an API handler with plugin execution.

```typescript
function withPlugins(
  handler: (req: Connect.IncomingMessage, res: any) => Promise<void>
): (req: Connect.IncomingMessage, res: any) => Promise<void>
```

**Parameters:**
- `handler`: API handler function

**Returns:**
Wrapped handler with plugin execution

**Example:**
```typescript
const handler = withPlugins(async (req, res) => {
  // Your API logic
  res.statusCode = 200
  res.end(JSON.stringify({ success: true }))
})

// Use in Vite middleware
server.middlewares.use('/api', handler)
```

## Route Matching

Route patterns support wildcards and prefixes:

### Exact Match

```typescript
routes: ['/api/users']
```

Matches only `/api/users`

### Wildcard Match

```typescript
routes: ['/api/*']
```

Matches `/api/users`, `/api/posts`, `/api/anything`

### Prefix Match

```typescript
routes: ['/api/']
```

Matches any route starting with `/api/`

### Multiple Patterns

```typescript
routes: [
  '/api/users',
  '/api/posts/*',
  '/admin/'
]
```

## Priority System

Priority determines execution order:

- **1-25**: Critical (security, authentication)
- **26-50**: Standard (logging, monitoring)
- **51-75**: Business logic
- **76-100**: Post-processing (response transformation)
- **Default**: 100

Lower numbers execute first.

**Example:**
```typescript
// Executes first
await pluginManager.register(securityPlugin, { priority: 10 })

// Executes second
await pluginManager.register(loggingPlugin, { priority: 50 })

// Executes last
await pluginManager.register(transformerPlugin, { priority: 90 })
```

## State Management

Use `context.state` to share data between plugin hooks:

```typescript
// Store data
context.state.set('key', value)

// Retrieve data
const value = context.state.get('key')

// Check existence
if (context.state.has('key')) {
  // ...
}

// Delete data
context.state.delete('key')

// Clear all
context.state.clear()
```

## Error Handling

### Plugin Errors

Errors in plugin code are caught and logged but don't affect other plugins:

```typescript
onBeforeRequest: async (context) => {
  try {
    // Your logic
  } catch (error) {
    console.error('Plugin error:', error)
    throw error // Will be caught by plugin system
  }
}
```

### Request Errors

Errors in request handlers are passed to `onError` hooks:

```typescript
onError: async (context, error) => {
  // Log to external service
  await logError(error, {
    requestId: context.requestId,
    url: context.req.url
  })
}
```

### Short-Circuit

Stop request processing by returning `false`:

```typescript
onBeforeRequest: async (context) => {
  if (!isValid(context.req)) {
    context.res.statusCode = 400
    context.res.end(JSON.stringify({ error: 'Invalid request' }))
    return false // Stop processing
  }
  return true // Continue
}
```

## Examples

### Complete Plugin Example

```typescript
import type { Plugin, PluginContext, PluginConfig } from '@/lib/plugin-system/types'

export const examplePlugin: Plugin = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'Example plugin demonstrating all hooks',

  onRegister: async (config: PluginConfig) => {
    console.log('Plugin registered:', config)
  },

  onBeforeRequest: async (context: PluginContext) => {
    context.state.set('startTime', Date.now())
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    const duration = Date.now() - context.state.get('startTime')
    return {
      ...response,
      meta: { duration }
    }
  },

  onError: async (context: PluginContext, error: Error) => {
    console.error('Request failed:', error.message)
  },

  onUnregister: async () => {
    console.log('Plugin unregistered')
  }
}
```

### Complete Middleware Example

```typescript
import type { Connect } from 'vite'
import type { MiddlewareConfig } from '@/lib/plugin-system/types'

const exampleMiddleware = async (
  req: Connect.IncomingMessage,
  res: any,
  next: (error?: Error) => void
) => {
  console.log(`${req.method} ${req.url}`)
  res.setHeader('X-Custom-Header', 'value')
  next()
}

export const exampleMiddlewareConfig: MiddlewareConfig = {
  name: 'example-middleware',
  handler: exampleMiddleware,
  priority: 50,
  routes: ['/api/*']
}
```

## See Also

- [Plugin System Architecture](./PLUGIN_SYSTEM_ARCHITECTURE.md)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- [Middleware Guide](./MIDDLEWARE_GUIDE.md)
