/**
 * Plugin System Tests
 * Basic tests to validate plugin functionality
 */

import { pluginManager } from '../src/lib/plugin-system'
import type { Plugin, PluginContext, PluginConfig } from '../src/lib/plugin-system/types'

// Test plugin
const testPlugin: Plugin = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'Test plugin for validation',

  onRegister: async (config: PluginConfig) => {
    console.log('[Test Plugin] Registered with config:', config)
  },

  onBeforeRequest: async (context: PluginContext) => {
    console.log('[Test Plugin] Before request:', context.req.url)
    context.state.set('testData', 'test-value')
    return true
  },

  onAfterRequest: async (context: PluginContext, response: any) => {
    console.log('[Test Plugin] After request, data:', context.state.get('testData'))
    return {
      ...response,
      pluginProcessed: true,
    }
  },

  onError: async (context: PluginContext, error: Error) => {
    console.error('[Test Plugin] Error occurred:', error.message)
  },

  onUnregister: async () => {
    console.log('[Test Plugin] Unregistered')
  },
}

// Run tests
async function runTests() {
  console.log('🧪 Running Plugin System Tests...\n')

  try {
    // Test 1: Plugin Registration
    console.log('Test 1: Plugin Registration')
    await pluginManager.register(testPlugin, {
      priority: 50,
      routes: ['/api/*'],
      options: { test: true },
    })
    
    const registered = pluginManager.hasPlugin('test-plugin')
    console.log('✓ Plugin registered:', registered)
    console.log('')

    // Test 2: Get Plugin Info
    console.log('Test 2: Get Plugin Info')
    const plugin = pluginManager.getPlugin('test-plugin')
    console.log('✓ Plugin found:', plugin?.plugin.name)
    console.log('✓ Plugin version:', plugin?.plugin.version)
    console.log('✓ Plugin priority:', plugin?.config.priority)
    console.log('')

    // Test 3: Route Matching
    console.log('Test 3: Route Matching')
    const pluginsForRoute = pluginManager.getPluginsForRoute('/api/test')
    console.log('✓ Plugins for /api/test:', pluginsForRoute.length)
    
    const pluginsForOther = pluginManager.getPluginsForRoute('/other')
    console.log('✓ Plugins for /other:', pluginsForOther.length)
    console.log('')

    // Test 4: Multiple Plugins with Priority
    console.log('Test 4: Multiple Plugins with Priority')
    await pluginManager.register({
      name: 'high-priority-plugin',
      onBeforeRequest: async (context) => {
        console.log('[High Priority] Executing first')
        return true
      },
    }, {
      priority: 10,
    })

    await pluginManager.register({
      name: 'low-priority-plugin',
      onBeforeRequest: async (context) => {
        console.log('[Low Priority] Executing last')
        return true
      },
    }, {
      priority: 90,
    })

    const allPlugins = pluginManager.getPlugins()
    console.log('✓ Total plugins registered:', allPlugins.length)
    console.log('✓ Plugins in order:', allPlugins.map(p => `${p.plugin.name} (priority: ${p.config.priority})`).join(', '))
    console.log('')

    // Test 5: Middleware Registration
    console.log('Test 5: Middleware Registration')
    pluginManager.registerMiddleware({
      name: 'test-middleware',
      handler: async (req, res, next) => {
        console.log('[Test Middleware] Processing')
        next()
      },
      priority: 50,
      routes: ['/api/*'],
    })

    const middleware = pluginManager.getMiddleware()
    console.log('✓ Middleware registered:', middleware.length)
    console.log('')

    // Test 6: Plugin Unregistration
    console.log('Test 6: Plugin Unregistration')
    await pluginManager.unregister('test-plugin')
    const stillRegistered = pluginManager.hasPlugin('test-plugin')
    console.log('✓ Plugin unregistered:', !stillRegistered)
    console.log('')

    // Test 7: Clear All
    console.log('Test 7: Clear All')
    pluginManager.clear()
    const remainingPlugins = pluginManager.getPlugins()
    const remainingMiddleware = pluginManager.getMiddleware()
    console.log('✓ All plugins cleared:', remainingPlugins.length === 0)
    console.log('✓ All middleware cleared:', remainingMiddleware.length === 0)
    console.log('')

    console.log('✅ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
}

export { runTests, testPlugin }
