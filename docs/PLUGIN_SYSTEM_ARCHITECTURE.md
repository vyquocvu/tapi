# Plugin System Architecture

## Overview

The TAPI CMS plugin system provides a flexible, extensible architecture for customizing and extending core functionality. It allows developers to inject custom logic into the API request/response lifecycle through plugins and middleware.

## Key Concepts

### Plugins

Plugins are self-contained modules that can hook into various points of the request/response lifecycle:

- **onRegister**: Initialize plugin when it's registered
- **onBeforeRequest**: Execute before request processing (can short-circuit)
- **onAfterRequest**: Execute after request processing (can modify response)
- **onError**: Handle errors that occur during request processing
- **onUnregister**: Cleanup when plugin is removed

### Middleware

Middleware follows the Express-style pattern and provides request/response interception:

- Compatible with existing Express middleware
- Executes in priority order
- Can be applied to specific routes or globally
- Supports both synchronous and asynchronous operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Incoming Request                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Chain                           │
│  (Sorted by priority, route-specific)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  MW #1   │→ │  MW #2   │→ │  MW #3   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Plugin: onBeforeRequest                       │
│  (Sorted by priority, route-specific)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Plugin 1  │→ │  Plugin 2  │→ │  Plugin 3  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Handler                               │
│              (Process actual request)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Plugin: onAfterRequest                        │
│           (Transform/enhance response)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Send Response                           │
└─────────────────────────────────────────────────────────────┘

                    (On Error Path)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Plugin: onError                             │
│            (Handle/log/transform errors)                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Plugin Manager (`registry.ts`)

Central registry for all plugins and middleware:

- Register/unregister plugins and middleware
- Route matching with wildcard support
- Priority-based ordering
- Configuration management

```typescript
import { pluginManager } from '@/lib/plugin-system'

// Register a plugin
await pluginManager.register(myPlugin, {
  priority: 50,
  routes: ['/api/*'],
  options: { /* plugin-specific options */ }
})

// Register middleware
pluginManager.registerMiddleware({
  name: 'my-middleware',
  handler: myMiddlewareFunction,
  priority: 50,
  routes: ['/api/*']
})
```

### 2. Plugin Executor (`executor.ts`)

Handles execution of plugins and middleware:

- Executes middleware chain
- Manages plugin lifecycle hooks
- Provides error handling
- Creates plugin context with shared state

```typescript
import { withPlugins } from '@/lib/plugin-system'

// Wrap API handler with plugin execution
const handler = withPlugins(async (req, res) => {
  // Your API logic here
})
```

### 3. Plugin Context

Shared context passed to all plugin hooks:

```typescript
interface PluginContext {
  req: IncomingMessage      // HTTP request
  res: Response             // HTTP response
  state: Map<string, any>   // Shared state between plugins
  user?: any                // Authenticated user (if available)
  requestId: string         // Unique request identifier
}
```

## Route Matching

Plugins and middleware can be configured to apply to specific routes:

```typescript
{
  routes: [
    '/api/*',           // Matches /api/users, /api/posts, etc.
    '/api/content',     // Exact match only
    '/api/admin/',      // Prefix match (trailing slash)
  ],
  excludeRoutes: [
    '/api/health',      // Exclude health check
    '/api/public/*',    // Exclude all public routes
  ]
}
```

## Priority System

Both plugins and middleware support priority ordering:

- **Lower numbers execute first** (default: 100)
- Priority ranges:
  - 1-25: Critical pre-processing (security, validation)
  - 26-50: Standard pre-processing (logging, monitoring)
  - 51-75: Business logic plugins
  - 76-100: Post-processing (response transformation)

Example:

```typescript
// This plugin runs first
await pluginManager.register(securityPlugin, {
  priority: 10
})

// This plugin runs second
await pluginManager.register(loggingPlugin, {
  priority: 50
})

// This plugin runs last
await pluginManager.register(responseTransformer, {
  priority: 90
})
```

## Error Handling

Plugins can handle errors at multiple levels:

1. **Plugin Error**: Error in plugin code itself
   - Logged and isolated (doesn't affect other plugins)
   
2. **Request Error**: Error in API handler
   - Passed to all `onError` hooks
   - Each plugin can log, transform, or handle the error

3. **Short-Circuit**: Plugin stops request processing
   - Return `false` from `onBeforeRequest`
   - Useful for authentication, validation, etc.

## State Management

Plugins can share data through the context state:

```typescript
// In onBeforeRequest
context.state.set('startTime', Date.now())
context.state.set('userId', user.id)

// In onAfterRequest
const startTime = context.state.get('startTime')
const duration = Date.now() - startTime
```

## Best Practices

1. **Keep Plugins Focused**: Each plugin should have a single responsibility
2. **Use Priority Wisely**: Order plugins based on their dependencies
3. **Handle Errors Gracefully**: Don't let plugin errors break the request
4. **Document Options**: Clearly document plugin configuration options
5. **Avoid Blocking Operations**: Use async/await for I/O operations
6. **Test Thoroughly**: Test plugins in isolation and integration
7. **Log Appropriately**: Use structured logging for debugging

## Integration with Existing Code

The plugin system integrates seamlessly with the existing vite.config.ts API middleware:

```typescript
// In vite.config.ts
import { withPlugins, pluginManager } from './src/lib/plugin-system'
import { requestLoggerPlugin } from './src/plugins/examples/logger'

// Register plugins
await pluginManager.register(requestLoggerPlugin, {
  priority: 10,
  routes: ['/api/*']
})

// Wrap API routes
server.middlewares.use('/api', withPlugins(async (req, res) => {
  // Existing API logic
}))
```

## Security Considerations

1. **Validate Plugin Configuration**: Always validate plugin options
2. **Sanitize User Input**: Never trust data from plugins
3. **Limit Plugin Permissions**: Plugins should have minimal access
4. **Audit Plugin Code**: Review third-party plugins carefully
5. **Rate Limit Plugin Actions**: Prevent abuse of plugin hooks

## Performance Considerations

1. **Async Execution**: All plugin hooks support async operations
2. **Minimal Overhead**: Plugins are only executed when configured routes match
3. **Lazy Loading**: Plugins can be loaded on-demand
4. **Caching**: Use context state to cache expensive operations
5. **Monitoring**: Use the performance monitor plugin to track overhead

## Future Enhancements

- **Plugin Marketplace**: Share plugins with the community
- **Hot Reload**: Update plugins without server restart
- **Plugin Dependencies**: Declare dependencies between plugins
- **Plugin Versioning**: Support multiple versions of the same plugin
- **Plugin Sandboxing**: Isolate plugin execution for security
