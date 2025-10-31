# Plugin System Quick Start

Get started with the TAPI plugin system in minutes!

## Installation

The plugin system is built-in and requires no additional dependencies.

## Basic Usage

### 1. Import the Plugin Manager

```typescript
import { pluginManager } from '@/lib/plugin-system'
```

### 2. Register a Plugin

```typescript
import { requestLoggerPlugin } from '@/plugins/examples/logger'

await pluginManager.register(requestLoggerPlugin, {
  priority: 20,
  routes: ['/api/*'],
  options: {
    logHeaders: false,
    logResponse: false,
  }
})
```

### 3. Use Built-in Example Plugins

```typescript
// Request Logger - Logs all API requests
import { requestLoggerPlugin } from '@/plugins/examples/logger'

// Request ID - Adds unique IDs to requests
import { requestIdPlugin } from '@/plugins/examples/request-id'

// Performance Monitor - Tracks slow requests
import { performanceMonitorPlugin } from '@/plugins/examples/performance-monitor'

// Response Transformer - Standardizes responses
import { responseTransformerPlugin } from '@/plugins/examples/response-transformer'
```

## Create Your First Plugin

### Step 1: Create Plugin File

Create `src/plugins/my-first-plugin.ts`:

```typescript
import type { Plugin, PluginContext } from '@/lib/plugin-system/types'

export const myFirstPlugin: Plugin = {
  name: 'my-first-plugin',
  version: '1.0.0',
  description: 'My awesome first plugin',

  onBeforeRequest: async (context: PluginContext) => {
    console.log(`Processing request to ${context.req.url}`)
    return true // Continue processing
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    console.log('Request completed!')
    return response
  },
}
```

### Step 2: Register Your Plugin

```typescript
import { myFirstPlugin } from '@/plugins/my-first-plugin'

await pluginManager.register(myFirstPlugin, {
  priority: 50,
  routes: ['/api/*'] // Apply to all API routes
})
```

### Step 3: Test It

Make a request to any API endpoint and see your plugin in action!

## Common Patterns

### Authentication Plugin

```typescript
export const authPlugin: Plugin = {
  name: 'auth-plugin',
  
  onBeforeRequest: async (context: PluginContext) => {
    // Skip public routes
    if (context.req.url?.startsWith('/api/public')) {
      return true
    }

    // Check token
    const token = context.req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      context.res.statusCode = 401
      context.res.end(JSON.stringify({ error: 'Unauthorized' }))
      return false // Stop processing
    }

    // Validate and store user
    const user = await validateToken(token)
    context.user = user
    return true
  }
}
```

### Logging Plugin

```typescript
export const loggingPlugin: Plugin = {
  name: 'logging-plugin',
  
  onBeforeRequest: async (context: PluginContext) => {
    context.state.set('startTime', Date.now())
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    const duration = Date.now() - context.state.get('startTime')
    console.log(`${context.req.method} ${context.req.url} - ${duration}ms`)
    return response
  }
}
```

### Error Handling Plugin

```typescript
export const errorHandlerPlugin: Plugin = {
  name: 'error-handler',
  
  onError: async (context: PluginContext, error: Error) => {
    console.error('Error occurred:', {
      url: context.req.url,
      error: error.message,
      stack: error.stack,
    })
    
    // Send to error tracking service
    // await sendToSentry(error)
  }
}
```

## Register Middleware

For simpler use cases, use middleware:

```typescript
pluginManager.registerMiddleware({
  name: 'cors',
  handler: async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    next()
  },
  priority: 1
})
```

## Integration with Vite

Add to your `vite.config.ts`:

```typescript
import { pluginManager, withPlugins } from './src/lib/plugin-system'
import { requestLoggerPlugin } from './src/plugins/examples/logger'

export default defineConfig({
  plugins: [
    {
      name: 'api-middleware',
      async configureServer(server) {
        // Register plugins
        await pluginManager.register(requestLoggerPlugin)
        
        // Wrap API handler
        server.middlewares.use('/api', withPlugins(async (req, res) => {
          // Your API logic
        }))
      }
    }
  ]
})
```

## Configuration Options

### Plugin Config

```typescript
{
  priority: 50,           // Execution order (lower = earlier)
  routes: ['/api/*'],     // Apply to these routes
  excludeRoutes: ['/api/health'], // Exclude these routes
  options: {              // Plugin-specific options
    customOption: 'value'
  }
}
```

### Priority Guidelines

- **1-25**: Critical (security, authentication)
- **26-50**: Standard (logging, monitoring)
- **51-75**: Business logic
- **76-100**: Post-processing

## Plugin Lifecycle

```
1. onRegister    - Called when plugin is registered
2. onBeforeRequest - Before request processing (can short-circuit)
3. [API Handler]   - Your API logic
4. onAfterRequest  - After request (can modify response)
5. onError         - If error occurs (any stage)
6. onUnregister    - When plugin is removed
```

## Testing Plugins

```typescript
import { pluginManager } from '@/lib/plugin-system'
import { myPlugin } from './my-plugin'

// Clear existing plugins
pluginManager.clear()

// Register test plugin
await pluginManager.register(myPlugin)

// Test route matching
const plugins = pluginManager.getPluginsForRoute('/api/test')
console.log('Active plugins:', plugins.length)

// Test plugin execution
// Make request and verify behavior
```

## Next Steps

- Read the [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md) for detailed instructions
- Explore [example plugins](../src/plugins/examples) for more patterns
- Check out the [API Reference](./PLUGIN_API_REFERENCE.md) for complete documentation
- Review [integration examples](../examples/plugin-integration-example.ts) for real-world usage

## Common Issues

### Plugin not executing?

- Check route matching: `pluginManager.getPluginsForRoute('/your/route')`
- Verify plugin is registered: `pluginManager.hasPlugin('plugin-name')`
- Check priority order: Lower numbers execute first

### Response already sent?

- Check `res.writableEnded` before modifying response
- Only one plugin should send the response
- Use `return false` to short-circuit

### Memory leaks?

- Clean up resources in `onUnregister`
- Don't store request data in global scope
- Use `context.state` for request-scoped data

## Getting Help

- [Plugin System Architecture](./PLUGIN_SYSTEM_ARCHITECTURE.md)
- [Middleware Guide](./MIDDLEWARE_GUIDE.md)
- [API Reference](./PLUGIN_API_REFERENCE.md)
- [GitHub Issues](https://github.com/vyquocvu/tapi/issues)
