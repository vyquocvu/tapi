# Plugin System Documentation Index

Complete guide to the TAPI CMS plugin system and middleware support.

## 📚 Documentation Overview

### Getting Started

1. **[Quick Start Guide](./PLUGIN_QUICK_START.md)** ⭐ Start here!
   - Basic usage and examples
   - Create your first plugin in minutes
   - Common patterns and recipes
   - Integration with Vite

### Core Documentation

2. **[Plugin System Architecture](./PLUGIN_SYSTEM_ARCHITECTURE.md)**
   - System design and architecture
   - Component overview
   - Request/response flow
   - Best practices and security

3. **[Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)**
   - Creating custom plugins
   - Plugin lifecycle hooks
   - Working with plugin context
   - Common plugin patterns
   - Testing strategies

4. **[Middleware Guide](./MIDDLEWARE_GUIDE.md)**
   - Middleware vs Plugins
   - Creating middleware
   - Common middleware patterns
   - Error handling
   - Testing middleware

5. **[API Reference](./PLUGIN_API_REFERENCE.md)**
   - Complete API documentation
   - Type definitions
   - Plugin Manager methods
   - Plugin Executor functions
   - Route matching syntax

### Examples and Templates

6. **[Integration Examples](../examples/plugin-integration-example.ts)**
   - Vite integration
   - Express server integration
   - Production setup
   - Testing configuration
   - Real-world scenarios

7. **[Plugin Templates](../src/plugins/templates/)**
   - [Plugin Template](../src/plugins/templates/plugin-template.ts) - Starter template for plugins
   - [Middleware Template](../src/plugins/templates/middleware-template.ts) - Starter template for middleware

8. **[Example Plugins](../src/plugins/examples/)**
   - [Request Logger](../src/plugins/examples/logger.ts) - Comprehensive request logging
   - [Request ID](../src/plugins/examples/request-id.ts) - Unique request tracking
   - [Performance Monitor](../src/plugins/examples/performance-monitor.ts) - Performance tracking
   - [Response Transformer](../src/plugins/examples/response-transformer.ts) - Response formatting

## 🎯 Common Use Cases

### By Goal

- **Authentication/Authorization** → See [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md#authentication-plugin)
- **Request Logging** → Use [Request Logger Plugin](../src/plugins/examples/logger.ts)
- **Performance Monitoring** → Use [Performance Monitor Plugin](../src/plugins/examples/performance-monitor.ts)
- **Response Transformation** → See [Response Transformer Plugin](../src/plugins/examples/response-transformer.ts)
- **Error Handling** → See [Error Handling Guide](./PLUGIN_DEVELOPMENT_GUIDE.md#error-handling-plugin)
- **Rate Limiting** → See [Middleware Guide](./MIDDLEWARE_GUIDE.md#rate-limiting-middleware)
- **CORS** → See [Middleware Guide](./MIDDLEWARE_GUIDE.md#cors-middleware)

### By Experience Level

**Beginners**
1. Start with [Quick Start Guide](./PLUGIN_QUICK_START.md)
2. Use [example plugins](../src/plugins/examples/) as-is
3. Modify [plugin templates](../src/plugins/templates/) for your needs

**Intermediate**
1. Read [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
2. Study [common patterns](./PLUGIN_DEVELOPMENT_GUIDE.md#common-plugin-patterns)
3. Create custom plugins using templates

**Advanced**
1. Review [Architecture Documentation](./PLUGIN_SYSTEM_ARCHITECTURE.md)
2. Study the [source code](../src/lib/plugin-system/)
3. Implement complex multi-plugin systems

## 🔑 Key Concepts

### Plugin Lifecycle
```
onRegister → onBeforeRequest → [Handler] → onAfterRequest → onUnregister
                              ↓
                           onError (if error)
```

### Priority System
- **1-25**: Critical (security, auth)
- **26-50**: Standard (logging, monitoring)
- **51-75**: Business logic
- **76-100**: Post-processing

### Route Matching
- `/api/users` - Exact match
- `/api/*` - Wildcard match
- `/api/` - Prefix match

## 🛠️ Quick Reference

### Register a Plugin
```typescript
import { pluginManager } from '@/lib/plugin-system'

await pluginManager.register(myPlugin, {
  priority: 50,
  routes: ['/api/*'],
  options: { /* config */ }
})
```

### Register Middleware
```typescript
pluginManager.registerMiddleware({
  name: 'my-middleware',
  handler: async (req, res, next) => { /* logic */ },
  priority: 50
})
```

### Wrap API Handler
```typescript
import { withPlugins } from '@/lib/plugin-system'

const handler = withPlugins(async (req, res) => {
  // Your API logic
})
```

## 📖 Learning Path

### Day 1: Basics
- [ ] Read [Quick Start Guide](./PLUGIN_QUICK_START.md)
- [ ] Try [Request Logger Plugin](../src/plugins/examples/logger.ts)
- [ ] Test with example API endpoint

### Day 2: First Plugin
- [ ] Copy [Plugin Template](../src/plugins/templates/plugin-template.ts)
- [ ] Create simple logging plugin
- [ ] Register and test

### Day 3: Advanced Features
- [ ] Read [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- [ ] Implement authentication plugin
- [ ] Add error handling

### Day 4: Production Ready
- [ ] Read [Architecture Documentation](./PLUGIN_SYSTEM_ARCHITECTURE.md)
- [ ] Review security considerations
- [ ] Set up plugin testing
- [ ] Deploy to production

## 🔍 Troubleshooting

### Common Issues

**Plugin not executing?**
- Check route patterns match your URLs
- Verify plugin is registered: `pluginManager.hasPlugin('name')`
- Check priority order

**Response already sent?**
- Only short-circuit in `onBeforeRequest`
- Check `res.writableEnded` before writing
- Don't send response in multiple plugins

**Memory leaks?**
- Clean up in `onUnregister`
- Use `context.state` not global variables
- Test with memory profiler

### Debug Checklist
1. Check plugin registration: `pluginManager.getPlugins()`
2. Verify route matching: `pluginManager.getPluginsForRoute('/your/route')`
3. Check execution order (priority)
4. Review plugin logs
5. Test plugin in isolation

## 🚀 Performance Tips

1. **Use priority wisely** - Don't make all plugins run for all routes
2. **Route matching** - Use specific patterns to limit execution
3. **Async operations** - Use async/await, don't block
4. **Caching** - Cache expensive operations in `context.state`
5. **Monitoring** - Use performance monitor plugin in production

## 🔐 Security Considerations

1. **Validate input** - Never trust plugin configuration
2. **Sanitize data** - Clean all user input
3. **Error handling** - Don't expose sensitive information
4. **Rate limiting** - Prevent abuse
5. **Audit plugins** - Review third-party plugins carefully

## 📊 Testing

### Unit Testing
```typescript
import { pluginManager } from '@/lib/plugin-system'

describe('MyPlugin', () => {
  beforeEach(() => {
    pluginManager.clear()
  })

  it('should register successfully', async () => {
    await pluginManager.register(myPlugin)
    expect(pluginManager.hasPlugin('my-plugin')).toBe(true)
  })
})
```

### Integration Testing
See [test examples](../tests/plugin-system.test.ts)

## 🤝 Contributing

Want to contribute a plugin or improve the documentation?

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📝 Additional Resources

- [README.md](../README.md) - Project overview
- [CMS Documentation](./CMS_DATABASE_STRUCTURE.md) - Database structure
- [API Reference](./API_REFERENCE.md) - REST API documentation
- [GitHub Repository](https://github.com/vyquocvu/tapi)

## 💡 Tips for Success

1. **Start small** - Begin with simple plugins
2. **Use examples** - Study existing plugins
3. **Test thoroughly** - Test plugins in isolation and integration
4. **Document well** - Add comments and README
5. **Monitor performance** - Use performance monitoring
6. **Handle errors** - Always handle errors gracefully
7. **Keep focused** - One responsibility per plugin

## 🎓 Video Tutorials

Coming soon! Check back for video guides on:
- Getting started with plugins
- Creating your first plugin
- Advanced plugin patterns
- Production deployment

## 📧 Getting Help

- Open an [issue](https://github.com/vyquocvu/tapi/issues)
- Check [existing issues](https://github.com/vyquocvu/tapi/issues)
- Read the [FAQ](#faq) below

## FAQ

**Q: Can I use Express middleware with the plugin system?**  
A: Yes! Use `pluginManager.registerMiddleware()` with Express-style middleware.

**Q: How do I debug plugins?**  
A: Use console.log in plugin hooks, check `pluginManager.getPlugins()`, and test routes individually.

**Q: Can plugins modify the response?**  
A: Yes, in the `onAfterRequest` hook. Return the modified response.

**Q: How do I handle errors in plugins?**  
A: Use the `onError` hook, or throw/reject in other hooks.

**Q: Can I use plugins in production?**  
A: Yes! The plugin system is production-ready. Use appropriate monitoring.

**Q: How many plugins can I register?**  
A: No hard limit, but keep performance in mind. Use route matching to limit execution.

**Q: Can plugins access the database?**  
A: Yes! Import and use Prisma client or any service layer.

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: Stable
